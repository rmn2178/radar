'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Fingerprint, Loader2, LockKeyhole, Radar } from 'lucide-react';
import { adminRequest, errorMessage } from './api';
import { Notice } from './ui';

export function LoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(''); setBusy(true);
    try {
      const result = await adminRequest<{ ok: boolean }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ passcode }) });
      if (result.ok !== true) throw new Error('Sign-in could not be confirmed. Please try again.');
      setPasscode(''); router.replace('/admin/dashboard'); router.refresh();
    } catch (cause) { setError(errorMessage(cause)); setBusy(false); }
  }
  return <main className="admin-login">
    <section className="admin-login-story" aria-label="RADAR Content Studio"><Link href="/" className="admin-brand"><span className="admin-brand-icon"><Radar size={28} /></span><span className="admin-brand-copy">RADAR<small>CONTENT STUDIO</small></span></Link><div className="admin-login-orbit" aria-hidden="true"><span /><span /><span /><Radar size={60} /></div><div className="admin-login-story-copy"><p className="admin-eyebrow">IDEAS DESERVE TO BE SEEN.</p><h1>Behind every discovery,<br />a story worth sharing.</h1><p>Your space to bring RADAR’s research, people, and possibilities to the world.</p></div><div className="admin-login-story-footer"><span>Research & Development in Applied Radiology</span><span>RADAR / RIT</span></div></section>
    <section className="admin-login-panel"><Link href="/" className="admin-back-link"><ArrowLeft size={16} />Back to website</Link><div className="admin-login-form-wrap"><div className="admin-login-lock"><Fingerprint size={29} /></div><p className="admin-eyebrow">WELCOME TO YOUR WORKSPACE</p><h2>A little access.<br />A lot of possibility.</h2><p className="admin-description">Enter your administrator passcode to continue.</p><form onSubmit={submit} className="admin-login-form"><label className="admin-label" htmlFor="admin-passcode">Administrator passcode</label><div className="admin-passcode"><LockKeyhole size={18} /><input id="admin-passcode" name="passcode" type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your passcode" value={passcode} onChange={event => setPasscode(event.target.value)} required disabled={busy} aria-invalid={!!error} aria-describedby={error ? 'admin-login-error' : undefined} /><button type="button" className="admin-icon-button" aria-label={visible ? 'Hide passcode' : 'Show passcode'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div>{error && <div id="admin-login-error"><Notice>{error}</Notice></div>}<button className="admin-button admin-login-submit" disabled={busy || !passcode} type="submit">{busy ? <><Loader2 className="admin-spin" size={18} />Verifying access…</> : <>Enter workspace<ArrowRight size={18} /></>}</button></form><p className="admin-login-private"><LockKeyhole size={13} />A private workspace for authorized administrators.</p></div><p className="admin-login-help">Need access? Contact your website administrator.</p></section>
  </main>;
}
