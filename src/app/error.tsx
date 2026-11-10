'use client';
import { AlertTriangle } from 'lucide-react';
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="section" id="main-content"><div className="container narrow">
      <div className="empty-state">
        <AlertTriangle size={30} strokeWidth={1.5} />
        <h1 style={{ fontSize: '1.5rem' }}>Something went wrong</h1>
        <p>This page could not be loaded. If the site is being configured, check that Supabase environment variables and migrations are in place.</p>
        <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={reset}>Try again</button>
      </div>
    </div></main>
  );
}
