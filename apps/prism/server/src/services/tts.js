export async function synthesize({ ssml, voice }) {
  const dataUrl = `data:application/ssml+xml,${encodeURIComponent(ssml)}`;
  return {
    provider: 'stub',
    voice,
    ssml,
    audioUrl: dataUrl
  };
}
