import { createHash } from 'node:crypto';
import { ZodError } from 'zod';
import { isConfigured } from '@/lib/supabase/config';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function ensureConfigured(): void {
  if (!isConfigured()) throw new ApiError(503, 'This workspace is running in read-only preview. Connect Supabase to enable saving.');
}

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { throw new ApiError(400, 'The request body must be valid JSON.'); }
}

export function apiFailure(cause: unknown): Response {
  if (cause instanceof ApiError) return json({ error: cause.message }, cause.status);
  if (cause instanceof ZodError) {
    const issue = cause.issues[0];
    const path = issue.path.join('.');
    return json({ error: `${path ? `${path}: ` : ''}${issue.message}` }, 400);
  }
  console.error('[radar-api]', cause);
  return json({ error: 'Something went wrong on the server. Please try again.' }, 500);
}

export function clientHash(request: Request, secret: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const agent = request.headers.get('user-agent') ?? '';
  // Anonymised, keyed hash: raw IPs are never stored in the database.
  return createHash('sha256').update(`${secret}|${ip}|${agent}`).digest('hex').slice(0, 32);
}