const BASE_URL = "https://blackroadinc.us";

export const buildMeta = (title: string, description: string, path = "/") => ({
  title: `${title} | BlackRoad Hub`,
  description,
  canonical: `${BASE_URL}${path}`,
});

export const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BlackRoad",
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
};
