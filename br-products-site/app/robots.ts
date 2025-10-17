export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://blackroad.io/sitemap.xml'
  };
}
