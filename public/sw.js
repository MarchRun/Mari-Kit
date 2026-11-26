const CACHE_VERSION = 'v1'
const CACHE_NAME = `marikit-${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png'
]

const isCacheableAsset = url =>
  url.pathname.startsWith('/_nuxt/')
  || url.pathname.startsWith('/icons/')
  || url.pathname.startsWith('/fonts/')
  || url.pathname.startsWith('/images/')
  || url.pathname === '/favicon.ico'
  || url.pathname === '/manifest.webmanifest'

const cacheResponse = async (request, response) => {
  if (!response || !response.ok || response.status !== 200) {
    return response
  }

  const cache = await caches.open(CACHE_NAME)
  await cache.put(request, response.clone())
  return response
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(PRECACHE_URLS)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const request = event.request

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await cacheResponse(request, await fetch(request))
      } catch {
        const cached = await caches.match(request)
        return cached ?? (await caches.match(OFFLINE_URL)) ?? Response.error()
      }
    })())
    return
  }

  if (isCacheableAsset(url)) {
    const network = fetch(request)
      .then(response => cacheResponse(request, response))
      .catch(() => undefined)

    event.waitUntil(network)

    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      return (await cache.match(request)) ?? (await network) ?? Response.error()
    })())
  }
})
