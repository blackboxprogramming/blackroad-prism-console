export const buildMeta = (title: string, description: string, path = '/') => ({
  title: `${title} | BlackRoad`,
  description,
  canonical: `https://blackroadinc.us${path}`
});

export const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BlackRoad, Inc.",
  "url": "https://blackroadinc.us",
  "logo": "https://blackroadinc.us/logo.png"
};
