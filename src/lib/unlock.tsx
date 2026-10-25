import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform } from 'react-native';

import { unitOf } from '../data/lessons';
import { deckOfWord } from '../data/words';

/**
 * The one-time Full Unlock purchase.
 *
 * Free for everyone: the whole alphabet, the decks and lesson units listed below, and all settings.
 * The unlock opens every other deck and lesson unit, including future ones.
 * Purchases go through the App Store / Google Play only (via expo-iap); nothing is sent anywhere else.
 */
export const PRODUCT_ID = 'full_unlock';
export const FREE_DECKS = ['greetings'];
export const FREE_UNITS = ['vowels', 'consonants'];

const STORAGE_KEY = 'tamil-app/unlock/v1';
/** Personal builds (the "preview" profile in eas.json) open everything, so you can use the full app on your own phone. */
const UNLOCK_ALL = process.env.EXPO_PUBLIC_UNLOCK_ALL === '1';

/** Expo Go and the web have no store connection; purchases only work in a real (or development) build. */
export const PURCHASES_SUPPORTED =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type Iap = typeof import('expo-iap');
type ErrorLike = Parameters<Iap['getUserFriendlyErrorMessage']>[0];
let iapModule: Iap | null | undefined;
function iap(): Iap | null {
  if (iapModule === undefined) {
    try {
      iapModule = PURCHASES_SUPPORTED ? (require('expo-iap') as Iap) : null;
    } catch {
      iapModule = null;
    }
  }
  return iapModule;
}

type UnlockContextValue = {
  unlocked: boolean;
  /** The store's price, like "$9.99", once it has loaded. */
  price: string | null;
  /** A purchase or restore is in progress. */
  busy: boolean;
  /** The last problem to show the user, if any. */
  error: string | null;
  buy: () => Promise<void>;
  restore: () => Promise<boolean>;
  isDeckLocked: (deckId: string) => boolean;
  isWordLocked: (wordId: string) => boolean;
  isLessonLocked: (lessonId: string) => boolean;
  /** Development only: flip the unlock without a purchase, to preview both versions of the app. */
  setTestUnlocked: (on: boolean) => void;
};

const UnlockContext = createContext<UnlockContextValue | null>(null);

export function UnlockProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(UNLOCK_ALL);
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  // The saved flag lets the app open unlocked offline; the store check below confirms it.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json && JSON.parse(json).unlocked) setUnlocked(true);
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ unlocked })).catch(() => {});
  }, [unlocked]);

  const checkOwned = useCallback(async () => {
    const store = iap();
    if (!store) return false;
    const purchases = await store.getAvailablePurchases();
    const owned = purchases.find((p) => p.productId === PRODUCT_ID);
    if (owned) {
      setUnlocked(true);
      store.finishTransaction({ purchase: owned, isConsumable: false }).catch(() => {});
    }
    return !!owned;
  }, []);

  useEffect(() => {
    const store = iap();
    if (!store) return;
    let alive = true;
    const bought = store.purchaseUpdatedListener((purchase) => {
      if (purchase.productId !== PRODUCT_ID) return;
      setUnlocked(true);
      setBusy(false);
      store.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    });
    const failed = store.purchaseErrorListener((e) => {
      setBusy(false);
      if (!store.isUserCancelledError(e)) setError(store.getUserFriendlyErrorMessage(e));
    });
    (async () => {
      try {
        await store.initConnection();
        const products = await store.fetchProducts({ skus: [PRODUCT_ID], type: 'in-app' });
        const product = (products ?? []).find((p) => p.id === PRODUCT_ID);
        if (alive && product) setPrice(product.displayPrice);
        await checkOwned();
      } catch {
        // No store connection (offline, or the product isn't set up yet): the app still works, locked or not.
      }
    })();
    return () => {
      alive = false;
      bought.remove();
      failed.remove();
      store.endConnection().catch(() => {});
    };
  }, [checkOwned]);

  const value = useMemo<UnlockContextValue>(() => {
    const isDeckLocked = (deckId: string) => !unlocked && !FREE_DECKS.includes(deckId);
    return {
      unlocked,
      price,
      busy,
      error,
      buy: async () => {
        const store = iap();
        setError(null);
        if (!store) {
          setError('Purchases work in the App Store and Google Play versions of the app.');
          return;
        }
        setBusy(true);
        try {
          await store.requestPurchase({
            request: { apple: { sku: PRODUCT_ID }, google: { skus: [PRODUCT_ID] } },
            type: 'in-app',
          });
        } catch (e) {
          setBusy(false);
          if (!store.isUserCancelledError(e)) setError(store.getUserFriendlyErrorMessage(e as ErrorLike));
        }
      },
      restore: async () => {
        const store = iap();
        setError(null);
        if (!store) {
          setError('Purchases work in the App Store and Google Play versions of the app.');
          return false;
        }
        setBusy(true);
        try {
          await store.restorePurchases();
          const owned = await checkOwned();
          if (!owned) setError('No earlier purchase found for this store account.');
          return owned;
        } catch (e) {
          setError(store.getUserFriendlyErrorMessage(e as ErrorLike));
          return false;
        } finally {
          setBusy(false);
        }
      },
      isDeckLocked,
      // Custom decks can hold words from any topic; a word follows the topic it comes from.
      isWordLocked: (wordId) => {
        const deck = deckOfWord(wordId);
        return !!deck && isDeckLocked(deck.id);
      },
      isLessonLocked: (lessonId) => {
        const unit = unitOf(lessonId);
        return !unlocked && !!unit && !FREE_UNITS.includes(unit.id);
      },
      setTestUnlocked: (on) => {
        if (__DEV__) setUnlocked(on);
      },
    };
  }, [unlocked, price, busy, error, checkOwned]);

  return <UnlockContext.Provider value={value}>{children}</UnlockContext.Provider>;
}

export function useUnlock() {
  const ctx = useContext(UnlockContext);
  if (!ctx) throw new Error('useUnlock must be used inside UnlockProvider');
  return ctx;
}
