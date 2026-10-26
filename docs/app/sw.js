const CACHE = 'kodam-0ceac249c00e';
const FILES = [
  "/Kodam/app/",
  "/Kodam/app/apple-touch-icon.png",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/100Thin/Catamaran_100Thin.68f4c1f367e2c2755574c76170ca897a.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/200ExtraLight/Catamaran_200ExtraLight.5de23a91ff338ee7a287c54bf759b83a.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/300Light/Catamaran_300Light.ecf2d6d9df4d33e793027611a0dc1bd1.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/400Regular/Catamaran_400Regular.b5c875e52ce007a403286faddcb56f2f.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/500Medium/Catamaran_500Medium.17343a2b5ff603a8fa9c336d61fefcca.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/600SemiBold/Catamaran_600SemiBold.23ab1654dcb4d958bb2ccb8b80877227.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/700Bold/Catamaran_700Bold.f00cdac5511c5adc97e4c16157e77f8a.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/800ExtraBold/Catamaran_800ExtraBold.e6c275611694ab342c6f1dce772c98ea.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/catamaran/900Black/Catamaran_900Black.636a6353173e4537ea1ee5c248b141e9.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/200ExtraLight/MuktaMalar_200ExtraLight.fc08602ea42ccfd316e6041d7b825061.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/300Light/MuktaMalar_300Light.7c1030d22ff81e258a87f42e9581579b.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/400Regular/MuktaMalar_400Regular.e98ccc02c4c708919c7505899e4605f7.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/500Medium/MuktaMalar_500Medium.826eeeee1af838fdd3c57d64f2f33583.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/600SemiBold/MuktaMalar_600SemiBold.73e80262b6c06d7a6358b9e219450b0b.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/700Bold/MuktaMalar_700Bold.4b3e3db8b8bfce607d6e05e5df94e461.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/mukta-malar/800ExtraBold/MuktaMalar_800ExtraBold.5adefef14c83c0e2ff35a5ffe3cb905e.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/100Thin/NotoSansTamil_100Thin.2358c1a02d0b4853963ab78d01e6a0c1.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/200ExtraLight/NotoSansTamil_200ExtraLight.c97b8759e0ae74ad0bd34cfd1edf33af.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/300Light/NotoSansTamil_300Light.fe29c5abc19222e7649e815f504b270b.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/400Regular/NotoSansTamil_400Regular.ef60ee4b035cd3cabf5ff8003606a840.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/500Medium/NotoSansTamil_500Medium.71dfbd133fce81ffb53fd2129a5ff558.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/600SemiBold/NotoSansTamil_600SemiBold.2e990d5afffbe6ce6382a35cf8ac3f4a.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/700Bold/NotoSansTamil_700Bold.7526079191b411cac08291541e4b14d8.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/800ExtraBold/NotoSansTamil_800ExtraBold.57ba636c64b215d71ca2bb9cce1e04d9.ttf",
  "/Kodam/app/assets/nm/@expo-google-fonts/noto-sans-tamil/900Black/NotoSansTamil_900Black.09c7fdde1e81869c00a2d6d2ca529ed3.ttf",
  "/Kodam/app/assets/nm/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png",
  "/Kodam/app/assets/nm/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png",
  "/Kodam/app/assets/nm/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png",
  "/Kodam/app/assets/nm/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png",
  "/Kodam/app/assets/nm/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png",
  "/Kodam/app/assets/nm/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png",
  "/Kodam/app/assets/nm/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png",
  "/Kodam/app/assets/nm/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png",
  "/Kodam/app/expo/static/js/web/entry-94cfff5e071c808039b8ad8575afec04.js",
  "/Kodam/app/favicon.ico",
  "/Kodam/app/icon-192.png",
  "/Kodam/app/icon-512.png",
  "/Kodam/app/manifest.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin + '/Kodam/app/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('/Kodam/app/').then((page) => page || fetch(request)));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
