import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seedData, seedCollections } from '../src/data/seed';
import { collections } from '../src/types/content';

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/0001_core_schema.sql'), 'utf8');
const storage = readFileSync(join(process.cwd(), 'supabase/migrations/0002_storage.sql'), 'utf8');
const seedSql = readFileSync(join(process.cwd(), 'supabase/seed/initial-radar-content.sql'), 'utf8');

test('migration enables RLS and covers every collection with an admin-only policy', () => {
  assert.match(migration, /enable row level security/);
  for (const collection of collections) {
    assert.ok(migration.includes(`'${collection}'`), `collection ${collection} missing from schema loop`);
  }
  // Views are generated per collection via format(): public.public_<collection>.
  assert.ok(migration.includes('public.public_%I'), 'public snapshot view template missing');
  for (const table of ['admin_profiles', 'contact_messages', 'content_revisions', 'admin_activity_logs', 'media_assets', 'rate_limit_buckets']) {
    assert.ok(migration.includes(table), `system table ${table} missing`);
  }
  // Admin policies must gate on the verified role helper, never on JWT claims
  // alone. Templates inside DO loops expand per table at runtime.
  assert.ok((migration.match(/public\.is_admin\(\)/g) ?? []).length >= 6);
});

test('public views project only published snapshots', () => {
  assert.match(migration, /published_data as data/);
  assert.match(migration, /where status = 'published' and published_data is not null/);
  assert.match(migration, /security_barrier = true/);
  // Anonymous roles receive SELECT on views only, never on base tables.
  assert.match(migration, /grant select on public\.public_%I to anon, authenticated/);
  assert.doesNotMatch(migration, /grant (all|insert|update|delete) on public\.%I to anon/);
});

test('privileged functions are SECURITY DEFINER with a fixed search_path', () => {
  for (const fn of ['is_admin', 'check_rate_limit', 'submit_contact_enquiry', 'set_updated_at']) {
    const index = migration.indexOf(`function public.${fn}`);
    assert.ok(index >= 0, `${fn} missing`);
    const body = migration.slice(index, index + 600);
    assert.match(body, /security definer|set search_path = public/, `${fn} must pin search_path`);
  }
  assert.match(migration, /revoke all on function public\.is_admin\(\) from public, anon/);
});

test('contact enquiries are insertable only through the validated, rate-limited RPC', () => {
  assert.match(migration, /submit_contact_enquiry/);
  assert.match(migration, /check_rate_limit\('contact:' \|\| p_client_hash, 5, 3600\)/);
  // No anon insert policy on the raw table.
  assert.doesNotMatch(migration, /create policy[\s\S]{0,120}contact_messages[\s\S]{0,80}to anon/);
});

test('storage writes require a verified admin; reads are public', () => {
  assert.match(storage, /radar_media_public_read[\s\S]*?to anon, authenticated/);
  for (const verb of ['insert', 'update', 'delete']) {
    assert.match(storage, new RegExp(`radar_media_admin_${verb}[\\s\\S]*?to authenticated[\\s\\S]*?public\\.is_admin\\(\\)`));
  }
});

test('generated seed SQL is idempotent and matches the verified seed exactly', () => {
  const expected = seedCollections.reduce((sum, collection) => sum + seedData[collection].length, 0);
  const inserts = seedSql.match(/^insert into public\./gm) ?? [];
  assert.equal(inserts.length, expected, 'run npm run seed:generate to refresh the SQL');
  assert.ok(seedSql.includes('on conflict (id) do nothing'));
  for (const collection of seedCollections) assert.ok(seedSql.includes(`insert into public.${collection} `));
  // The unverified AI medical-scan project must be seeded as a draft with no public snapshot.
  const draftLine = seedSql.split('\n').find(line => line.includes('medical-scan-risk-assessment'));
  assert.ok(draftLine, 'draft project missing from seed');
  assert.match(draftLine, /'draft'/);
  assert.match(draftLine, /null\)/);
});

test('seed SQL preserves undated events and the blank contact email', () => {
  const iit = seedSql.split('\n').find(line => line.includes('iit-madras-laboratory-visit'));
  assert.ok(iit);
  assert.ok(iit.includes('"start_date":null'), 'IIT Madras visit must stay undated');
  const settings = seedSql.split('\n').find(line => line.includes('insert into public.site_settings'));
  assert.ok(settings);
  assert.ok(settings.includes('"email":""'), 'contact email must remain blank until confirmed');
});