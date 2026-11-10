import { contactSchema } from '@/lib/content';
import { createPublicSupabaseClient } from '@/lib/supabase/server';
import { ApiError, apiFailure, clientHash, ensureConfigured, json, readJson } from '@/lib/http';

export async function POST(request: Request) {
  try {
    ensureConfigured();
    const body = await readJson(request);
    // Honeypot: bots that fill the hidden field get a polite no-op, never a save.
    if (body && typeof body === 'object' && 'website' in body && body.website) return json({ ok: true });
    const enquiry = contactSchema.parse(body);
    const supabase = createPublicSupabaseClient();
    const secret = process.env.RADAR_RATE_LIMIT_SECRET ?? 'radar-local-rate-limit';
    const { error } = await supabase.rpc('submit_contact_enquiry', {
      p_name: enquiry.name, p_email: enquiry.email, p_subject: enquiry.subject,
      p_message: enquiry.message, p_client_hash: clientHash(request, secret),
    });
    if (error) {
      if (/rate limit/i.test(error.message)) throw new ApiError(429, 'You have sent several messages recently. Please try again later.');
      throw new ApiError(500, 'Your message could not be delivered. Please try again.');
    }
    return json({ ok: true });
  } catch (cause) { return apiFailure(cause); }
}