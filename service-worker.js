// Service Worker - 专升本英语学习助手
// 缓存核心文件，支持离线使用

const CACHE_NAME = 'english-study-v2';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-512.png',
  './icon-180.png'
];

// 安装：预缓存核心文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 拦截请求：网络优先，缓存回退
self.addEventListener('fetch', function(event) {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // 网络成功，更新缓存
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // 网络失败，从缓存读取
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) return cachedResponse;
          // 如果请求的是页面但缓存中没有，返回主页面
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('离线模式：此内容暂不可用', {
            status: 503,
            statusText: 'Offline'
          });
        });
      })
  );
});
