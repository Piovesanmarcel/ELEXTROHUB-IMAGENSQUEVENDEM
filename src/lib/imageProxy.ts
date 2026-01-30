// Domínios que têm proteção de hotlink e precisam de proxy
const HOTLINK_PROTECTED_DOMAINS = [
  'media.obaobamix.com.br',
  'obaobamix.com.br',
];

export const needsProxy = (url: string): boolean => {
  if (!url) return false;
  return HOTLINK_PROTECTED_DOMAINS.some(domain => url.includes(domain));
};

export const getProxiedUrl = (url: string): string => {
  if (!url || !needsProxy(url)) return url;
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
};
