# Launch checklist

Everything in the app is ready for the stores except the steps below. Only you can do these, because they need your accounts, money or decisions. They're in order.

## 1. Decide the app's name

The app is still called "Tamil App". Pick the store name, then tell Claude. Claude will update `app.json`, including the bundle ID (`com.tamilapp.learn` now). **The bundle ID can never change after the first upload**, so settle the name first.

## 2. Create the developer accounts

| Store | Cost | Where |
|---|---|---|
| Apple App Store | $99 a year | developer.apple.com/programs |
| Google Play | $25 once | play.google.com/console |

Apple's enrollment can take a day or two to be approved. Google asks new personal accounts to run a closed test with a group of testers for about two weeks before the app can go public. Check Google's current numbers when you sign up; friends and family can be the testers.

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

Both stores need a public web link to it. The text is in `docs/privacy-policy.md`. Fill in the app name, your name or studio name, a contact email and the date. Then publish it somewhere public and free. GitHub Pages works if the repository is public; Google Sites or a public Notion page work too. Put the link in both store listings.

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
