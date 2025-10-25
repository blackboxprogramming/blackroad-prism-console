import { PostComposer } from '@/components/post-composer';

export default function ComposePage() {
  return (
    <section className="space-y-6" aria-labelledby="compose-heading">
      <header>
        <h1 id="compose-heading" className="text-3xl font-semibold text-slate-50">
          Compose a thoughtful post
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Draft now, publish later. Posts default to a three hour delay so everyone can reflect
          before the conversation continues.
        </p>
      </header>
      <PostComposer mode="standalone" />
    </section>
  );
}
