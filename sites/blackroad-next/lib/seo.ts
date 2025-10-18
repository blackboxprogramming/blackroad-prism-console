export const buildMeta = (title: string, description: string, path = '/') => ({
  title: `${title} | Blackroad`,
  description,
  canonical: `https://blackroad.com${path}`
});

export const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Blackroad",
  "url": "https://blackroad.com",
  "logo": "https://blackroad.com/logo.png"
};
