// Service Worker para cache de imagens de produtos
const CACHE_NAME = 'products-images-v1';
const IMAGE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 dias

// Domínios de imagens para cachear
const IMAGE_DOMAINS = [
  'cloudflare.com',
  'cloudflareimages.com',
  'bling.com.br',
  'images.bling.com.br',
  'r2.cloudflarestorage.com',
  'res.cloudinary.com',
  'imagedelivery.net',
  'supabase.co',
  'lovableproject.com',
  'imgur.com',
  'i.imgur.com',
  'amazonaws.com',
  's3.amazonaws.com'
];

// Verificar se URL deve ser cacheada
function shouldCacheImage(url) {
  try {
    const urlObj = new URL(url);
    
    // Apenas imagens
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname);
    if (!isImage) return false;
    
    // Apenas domínios permitidos
    return IMAGE_DOMAINS.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

// Install - ativa imediatamente
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker instalado');
  self.skipWaiting();
});

// Activate - limpa cache antigo
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker ativado');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('🗑️ Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Assumir controle de todas as páginas imediatamente
      return self.clients.claim();
    })
  );
});

// Fetch - estratégia cache-first para imagens
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;
  
  // Apenas processar imagens
  if (!shouldCacheImage(url)) {
    return; // Deixa o browser fazer fetch normal
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Se tem no cache e é recente, usar
        if (cachedResponse) {
          const dateHeader = cachedResponse.headers.get('date');
          if (dateHeader) {
            const cachedDate = new Date(dateHeader).getTime();
            const now = Date.now();
            if (now - cachedDate < IMAGE_CACHE_MAX_AGE) {
              return cachedResponse;
            }
          }
        }
        
        // Se não tem no cache ou é antigo, buscar da rede
        return fetch(request).then((networkResponse) => {
          // Apenas cachear respostas bem-sucedidas
          if (networkResponse && networkResponse.status === 200) {
            // Clonar resposta para poder usar duas vezes
            const responseToCache = networkResponse.clone();
            
            cache.put(request, responseToCache).catch((err) => {
              console.warn('❌ Erro ao cachear:', url, err);
            });
          }
          
          return networkResponse;
        }).catch((error) => {
          // Se falhar na rede e tem cache (mesmo antigo), usar
          if (cachedResponse) {
            console.log('📦 Usando cache antigo para:', url);
            return cachedResponse;
          }
          
          // Se não tem cache, retornar erro
          console.error('❌ Erro ao buscar imagem:', url, error);
          return new Response('', { status: 404, statusText: 'Image not found' });
        });
      });
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('🗑️ Cache limpo com sucesso');
      })
    );
  }
});
