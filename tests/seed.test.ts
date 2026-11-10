import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { seedCollections, seedData } from '@/data/seed';
import { recordSchema, sectionSchema, sections, text } from '@/lib/content';
import type { Collection } from '@/types/content';

test('every seeded record passes its collection validation schema', () => {
  for (const collection of seedCollections) {
    for (const record of seedData[collection]) {
      const { title, slug, status, display_order, is_featured, data } = record;
      const result = recordSchema(collection as Collection).safeParse({ title, slug, status, display_order, is_featured, data });
      assert.equal(result.success, true, `${collection}/${record.slug}: ${result.success ? '' : JSON.stringify(result.error.issues)}`);
    }
  }
});

test('seeded page sections use only registered block types', () => {
  for (const page of seedData.pages) {
    const blocks = sections(page.data);
    assert.ok(blocks.length > 0, `${page.slug} has sections`);
    for (const block of blocks) assert.equal(sectionSchema.safeParse(block).success, true, `${page.slug}/${block.id}`);
  }
});

test('slugs are unique within each collection and ids are UUIDs', () => {
  for (const collection of seedCollections) {
    const slugs = new Set<string>();
    for (const record of seedData[collection]) {
      assert.match(record.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      assert.ok(!slugs.has(record.slug), `duplicate slug ${record.slug} in ${collection}`);
      slugs.add(record.slug);
    }
  }
});

test('published records expose a published snapshot; drafts do not', () => {
  for (const collection of seedCollections) {
    for (const record of seedData[collection]) {
      if (record.status === 'published') assert.deepEqual(record.published_data, record.data, `${collection}/${record.slug}`);
      else assert.equal(record.published_data ?? null, null, `${collection}/${record.slug}`);
    }
  }
  const draft = seedData.projects.find(project => project.slug === 'medical-scan-risk-assessment');
  assert.equal(draft?.status, 'draft');
});

test('undated activities remain undated and contact email stays blank', () => {
  for (const slug of ['iit-madras-laboratory-visit', 'knowledge-sharing-sessions']) {
    const event = seedData.events.find(e => e.slug === slug);
    assert.equal(text(event?.data, 'start_date'), '');
  }
  assert.equal(text(seedData.site_settings[0].data, 'email'), '');
  assert.equal(text(seedData.site_settings[0].data, 'phone'), '+91 98840 76657');
});

test('achievement wording preserves accepted vs uploaded distinction', () => {
  const accepted = seedData.achievements.find(a => a.slug === 'ieee-papers-accepted');
  const uploaded = seedData.achievements.find(a => a.slug === 'research-paper-uploaded');
  assert.equal(text(accepted?.data, 'achievement_type'), 'Paper accepted');
  assert.equal(text(uploaded?.data, 'achievement_type'), 'Paper uploaded');
});

test('original brand assets are present and referenced', () => {
  assert.ok(existsSync(join(process.cwd(), 'public/brand/radar-logo.png')));
  assert.ok(existsSync(join(process.cwd(), 'public/brand/rit-logo.jpg')));
  assert.equal(text(seedData.site_settings[0].data, 'radar_logo'), '/brand/radar-logo.png');
  assert.equal(text(seedData.site_settings[0].data, 'rit_logo'), '/brand/rit-logo.jpg');
});
