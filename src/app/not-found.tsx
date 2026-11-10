import Link from 'next/link';
import { Compass } from 'lucide-react';
export default function NotFound() {
  return (
    <main className="section" id="main-content"><div className="container narrow">
      <div className="empty-state">
        <Compass size={30} strokeWidth={1.5} />
        <h1 style={{ fontSize: '1.5rem' }}>Page not found</h1>
        <p>The page you are looking for does not exist or has not been published.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 20 }}>Return home</Link>
      </div>
    </div></main>
  );
}
