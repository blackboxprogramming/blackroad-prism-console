import Link from 'next/link';
import { withBase } from '@/lib/paths';

export default function Page() {
  return (
    <main style={{ padding: 24 }}>
      <h1>BlackRoad</h1>
      <p>Shipping fast, clean, and observable.</p>
      <ul>
        <li>
          <Link href={withBase('/health')}>/health</Link>
        </li>
      </ul>
    </main>
  );
}
