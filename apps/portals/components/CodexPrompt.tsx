interface Props {
  title: string;
  html: string;
  downloadName: string;
}

export default function CodexPrompt({ title, html, downloadName }: Props) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <a
        className="mt-4 inline-block underline"
        href={`data:text/plain;charset=utf-8,${encodeURIComponent(html.replace(/<[^>]+>/g, ''))}`}
        download={downloadName}
      >
        Download
      </a>
    </div>
  );
}
