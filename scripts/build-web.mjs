// Builds Kodam as a home-screen web app into docs/app, served by GitHub Pages at
// https://scr1ble12.github.io/Kodam/app/. It opens everything (like the personal phone builds)
// and keeps working offline once it has loaded in Safari.
//
//   node scripts/build-web.mjs
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const BASE = '/Kodam/app';
const OUT = 'docs/app';

rmSync(OUT, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${OUT}`, {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_UNLOCK_ALL: '1', EXPO_BASE_URL: BASE },
});

// GitHub Pages runs Jekyll over docs/, which drops folders starting with "_" and any "node_modules".
renameSync(join(OUT, '_expo'), join(OUT, 'expo'));
if (existsSync(join(OUT, 'assets/node_modules'))) renameSync(join(OUT, 'assets/node_modules'), join(OUT, 'assets/nm'));
rmSync(join(OUT, 'metadata.json'), { force: true });

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(relative(OUT, path));
  }
})(OUT);

for (const file of files.filter((f) => /\.(html|js)$/.test(f))) {
  const path = join(OUT, file);
  const text = readFileSync(path, 'utf8')
    .replaceAll(`${BASE}/_expo/`, `${BASE}/expo/`)
    .replaceAll('/assets/node_modules/', '/assets/nm/');
  writeFileSync(path, text);
}

// Home-screen icon, full-screen launch and the offline cache.
const head = `
    <link rel="manifest" href="${BASE}/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="${BASE}/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Kodam" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="theme-color" content="#0E6B63" />
    <script>
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('${BASE}/sw.js', { scope: '${BASE}/' });
    </script>
  </head>`;
const indexPath = join(OUT, 'index.html');
const index = readFileSync(indexPath, 'utf8')
  .replace('<meta httpEquiv="X-UA-Compatible" content="IE=edge" />\n', '')
  .replace('shrink-to-fit=no', 'viewport-fit=cover')
  .replace('</head>', head);
writeFileSync(indexPath, index);

// The service worker stores every file on first visit, then answers from that store, online or not.
// Its version changes with the files, so a new build replaces the old copy next time the app opens online.
const hash = createHash('sha256');
for (const file of files.sort()) hash.update(file).update(readFileSync(join(OUT, file)));
const version = hash.digest('hex').slice(0, 12);
const urls = [`${BASE}/`, ...files.filter((f) => f !== 'index.html').map((f) => `${BASE}/${f}`)];
writeFileSync(
  join(OUT, 'sw.js'),
  `const CACHE = 'kodam-${version}';
const FILES = ${JSON.stringify(urls, null, 2)};

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
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin + '${BASE}/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('${BASE}/').then((page) => page || fetch(request)));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
`,
);

console.log(`Web app written to ${OUT} (${files.length + 1} files, cache ${version}).`);
