export default async function sitemap() {
  const base = 'https://blackroad.io';
  return [{ url: base, lastModified: new Date() }];
}
