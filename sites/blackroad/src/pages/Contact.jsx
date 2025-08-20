export default function Contact() {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Contact</h2>
      <p>
        Reach us at{' '}
        <a href="mailto:hello@example.com" className="underline">
          hello@example.com
        </a>
        .
      </p>
    </div>
  );
import { t } from '../lib/i18n.ts'
export default function Contact(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">{t('navContact')}</h2>
      <p className="opacity-80">Contact info coming soon.</p>
export default function Contact(){
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Contact</h2>
      <p>Content coming soon.</p>
    </div>
  )
}
