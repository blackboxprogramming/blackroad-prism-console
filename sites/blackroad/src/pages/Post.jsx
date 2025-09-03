import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { t } from '../lib/i18n.ts';

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  useEffect(() => {
    fetch(`/blog/${slug}.json`, { cache: 'no-cache' })
      .then((r) => r.json())
      .then(setPost)
      .catch(() =>
        setPost({
          title: 'Not found',
          html: '<p>Post missing.</p>',
          date: new Date().toISOString(),
          description: '',
        })
      );
  }, [slug]);
  if (!post) return <div className="card">{t('loading')}</div>;
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
      <p className="opacity-70 mb-4">{new Date(post.date).toDateString()}</p>
      {post.description && (
        <p className="opacity-80 mb-4">{post.description}</p>
      )}
      <div
        className="prose prose-invert"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      <p className="mt-6">
        <a className="underline" href={`/blog/${slug}.html`}>
          Static HTML version
        </a>
      </p>
    </div>
  );
}
