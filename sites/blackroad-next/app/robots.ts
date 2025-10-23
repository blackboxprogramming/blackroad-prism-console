export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://blackroad.com/sitemap.xml'
  };
}
