'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, Send } from 'lucide-react';
import { contactSchema } from '@/lib/content';
type Values = z.input<typeof contactSchema>;
export function ContactForm() {
  const [state, setState] = useState<{ kind: 'idle' | 'success' | 'error'; message?: string }>({ kind: 'idle' });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { name: '', email: '', subject: '', message: '', website: '' } });
  const onSubmit = handleSubmit(async values => {
    setState({ kind: 'idle' });
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setState({ kind: 'error', message: body.error ?? 'Your message could not be sent. Please try again later.' }); return; }
      setState({ kind: 'success', message: 'Thank you. Your enquiry has been received.' });
      reset();
    } catch {
      setState({ kind: 'error', message: 'Your message could not be sent. Please check your connection and try again.' });
    }
  });
  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="form-row">
        <div className="field"><label htmlFor="contact-name">Name</label><input id="contact-name" autoComplete="name" {...register('name')} />{errors.name && <p className="field-error">{errors.name.message}</p>}</div>
        <div className="field"><label htmlFor="contact-email">Email</label><input id="contact-email" type="email" autoComplete="email" {...register('email')} />{errors.email && <p className="field-error">{errors.email.message}</p>}</div>
      </div>
      <div className="field"><label htmlFor="contact-subject">Subject</label><input id="contact-subject" {...register('subject')} />{errors.subject && <p className="field-error">{errors.subject.message}</p>}</div>
      <div className="field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" rows={6} {...register('message')} />{errors.message && <p className="field-error">{errors.message.message}</p>}</div>
      <div className="hp-field" aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" {...register('website')} /></div>
      {state.kind === 'success' && <p className="form-success" role="status">{state.message}</p>}
      {state.kind === 'error' && <p className="form-error" role="alert">{state.message}</p>}
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={16} className="spin" /> : <Send size={16} strokeWidth={1.75} />}<span>{isSubmitting ? 'Sending…' : 'Send enquiry'}</span></button>
    </form>
  );
}
