# Launch checklist

Everything in the app is ready for the stores except the steps below. Only you can do these, because they need your accounts, money or decisions. They're in order.

## 1. App name ✓

The app is called **Kodam**, with the bundle ID / package name `com.kodam.learn`. **The bundle ID can never change after the first upload.** If you want a different one, say so before step 7.

## 2. Create the developer accounts

| Store | Cost | Where |
|---|---|---|
| Apple App Store | $99 a year | developer.apple.com/programs |
| Google Play | $25 once | play.google.com/console |

Apple's enrollment can take a day or two to be approved. Use your legal name, turn on two-factor sign-in, and pay with a card that allows international payments.

Google asks personal accounts created after 13 November 2023 to run a closed test before the app can go public. The test needs at least **12 testers who stay enrolled for 14 days in a row**. Friends and family with Android phones work. If you don't have 12, here are the options:

- **Swap testing with other developers.** Online communities exist where indie developers join each other's closed tests; search for "Google Play closed testing 12 testers". Testers can be anywhere in the world. They only need an Android phone and a Google account, join from a link, and stay opted in for the 14 days.
- **Register as an organization instead of a person.** The rule only applies to personal accounts. You need a registered business and a free D-U-N-S number.
- **Launch on iPhone first.** Apple has no such rule, so the App Store version can go live while the Android test runs.

**From India:** Apple enrollment in India only works through the **Apple Developer app** (iPhone, iPad or Mac), and the fee is shown in rupees. Some people in India have recently hit a "not available in your country/region" error at payment; if you do, contact Apple Developer Support. The stores pay out to a bank account in the country you register with, so if you're only visiting India, register with your home-country details.

## 3. Create a free Expo account

Expo builds the iOS and Android app files in the cloud, so you don't need a Mac or Android Studio.

1. Sign up at expo.dev.
2. In Terminal, inside the `tamil-app` folder:
   ```
   npm install -g eas-cli
   eas login
   eas init
   ```
   `eas init` links the project to your account.

## 4. Set up the Full Unlock purchase in both stores

Create one **non-consumable** in-app product in each store with the product ID **`full_unlock`**. The app looks for exactly that ID.

- **App Store Connect:** your app → Monetization → In-App Purchases → + → Non-Consumable. Turn on **Family Sharing** so one purchase covers the whole family.
- **Google Play Console:** your app → Monetize → Products → In-app products → Create product.
- **Price:** set a base price. Then use each store's price tools to set fair local prices for India, Sri Lanka and Malaysia.

## 5. Publish the privacy policy

Both stores need a public link to it. It's set up to be served from this repository with GitHub Pages:

1. On GitHub, open the Kodam repository → **Settings** → **Pages**.
2. Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main** and folder to **/docs**, then click **Save**.
3. After a minute or two, the policy is live at **https://scr1ble12.github.io/Kodam/privacy-policy**. Put that link in both store listings.

## 6. Test the purchase on a real phone

Purchases don't work in Expo Go. Make a test build:

```
eas build --profile development --platform android   (or ios)
```

Install it from the link Expo gives you.

- **iPhone:** add a Sandbox tester in App Store Connect (Users and Access → Sandbox).
- **Android:** add your Google account as a license tester (Play Console → Settings → License testing).

In development builds, Settings → Full Unlock also has a **"Test: pretend unlocked"** switch, so you can see both the free and the unlocked app without paying. This switch does nothing in store builds.

## 7. Build and submit

```
eas build --profile production --platform all
eas submit --platform ios
eas submit --platform android
```

Then, in each store's console:

- Paste the text from `docs/store-listing.md`.
- Upload the screenshots from `docs/store-screenshots/`: the `ios-` files are 1320×2868 for iPhone, and the `android-` files are 1080×1920 for phones.
- Fill in the privacy and data-safety answers and the content rating. The answers are in `docs/store-listing.md`.
- Send the app for review.

## Later, as the community grows

- Hand out free unlock codes to Tamil weekend schools and teachers: Offer Codes in App Store Connect, Promo codes in Play Console.
- Each update: bump `version` in `app.json` (for example 1.0.1), plus `ios.buildNumber` and `android.versionCode`, then run step 7 again.
