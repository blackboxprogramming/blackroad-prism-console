export default function sitemap() {
  const base = "https://blackroadinc.us";
  return [
    { url: `${base}/` },
    { url: `${base}/status` },
    { url: `${base}/portal` },
    { url: `${base}/docs` },
  ];
}
