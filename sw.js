// NOTE:
// - API 応答をキャッシュすると「保存→少し後に古い GET が返って state が巻き戻る」事故が起きる。
// - キャッシュは静的アセット専用にする（/api/* は network-only）。
const CACHE_VERSION = '1.0.1';
const CACHE_NAME = `self-conditioning-v2-cache-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install: キャッシュ戦略の初期化
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', CACHE_NAME);
  self.skipWaiting(); // 新しい SW を即座にアクティブ化
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Initial cache failed (partial)', err);
      });
    })
  );
});

// Activate: 古いキャッシュを削除、新しい SW が全クライアントを制御
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', CACHE_VERSION);
  self.clientsClaim(); // 古いページを新しい SW が制御
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: キャッシュ戦略
// - index.html: Network first（常に最新を取得）
// - その他: Cache first（ハッシュ付きなので古くならない）
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache non-GET.
  if (request.method !== 'GET') {
    return;
  }

  // API は常に network（キャッシュするとデータが巻き戻る）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // index.html は network first
  if (url.pathname === '/' || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 新しい response をキャッシュに保存
          if (response && response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // オフラインの場合はキャッシュから取得
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - cached version unavailable', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          });
        })
    );
  } else {
    // その他のリソース: cache first
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          if (response && response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      })
    );
  }
});

// Message handler: クライアントからのメッセージ受信
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[SW] Checking for updates...');
    fetch('/index.html?cache-bust=' + Date.now())
      .then((response) => {
        if (response.ok) {
          // 新バージョンがあったことを全クライアントに通知
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: 'UPDATE_AVAILABLE' });
            });
          });
        }
      })
      .catch((err) => console.warn('[SW] Update check failed:', err));
  }

  // 手動更新: クライアントがスキップ待機を要求
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested by client');
    self.skipWaiting();
  }
});
