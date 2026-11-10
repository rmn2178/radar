import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventStatus, recordSchema, safeUrl, sectionSchema, slugify } from '@/lib/content';
import type { Section } from '@/types/content';

test('safeUrl allows institutional links and rejects script vectors', () => {
  assert.equal(safeUrl('/research'), '/research');
  assert.equal(safeUrl('https://rit.ac.in'), 'https://rit.ac.in');
  assert.equal(safeUrl('mailto:team@example.org'), 'mailto:team@example.org');
  assert.equal(safeUrl('tel:+919884076657'), 'tel:+919884076657');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,hi'), '');
  assert.equal(safeUrl('//evil.example'), '');
  assert.equal(safeUrl('https://example.org/\njavascript:alert(1)'), '');
});

test('slugify produces URL-safe slugs', () => {
  assert.equal(slugify('Dr. S. Praveena'), 'dr-s-praveena');
  assert.equal(slugify('RF & Microwave Imaging'), 'rf-microwave-imaging');
});

test('eventStatus never invents dates and classifies against today', () => {
  const today = '2026-11-10';
  assert.equal(eventStatus({}, today), 'Date not recorded');
  assert.equal(eventStatus({ start_date: '2026-08-20' }, today), 'Completed');
  assert.equal(eventStatus({ start_date: '2026-12-01' }, today), 'Upcoming');
  assert.equal(eventStatus({ start_date: '2026-11-10' }, today), 'Ongoing');
  assert.equal(eventStatus({ start_date: '2026-11-09', end_date: '2026-11-12' }, today), 'Ongoing');
});

test('recordSchema validates member fields and rejects unsafe URLs', () => {
  const valid = { title: 'Test Member', slug: 'test-member', status: 'draft' as const, display_order: 1, is_featured: false, data: { designation: 'Researcher', linkedin_url: 'https://linkedin.com/in/test' } };
  assert.equal(recordSchema('members').safeParse(valid).success, true);
  assert.equal(recordSchema('members').safeParse({ ...valid, data: { linkedin_url: 'javascript:alert(1)' } }).success, false);
  assert.equal(recordSchema('members').safeParse({ ...valid, slug: 'Bad Slug' }).success, false);
});

test('event end date cannot precede start date', () => {
  const base = { title: 'Event', slug: 'event', status: 'draft' as const, display_order: 0, is_featured: false, data: { start_date: '2026-08-20', end_date: '2026-08-19' } };
  assert.equal(recordSchema('events').safeParse(base).success, false);
});

test('sectionSchema enforces the typed registry and field shapes', () => {
  const hero: Section = { id: 's1', type: 'hero', visible: true, variant: 'default', data: { heading: 'Hello', button_url: '/research' } };
  assert.equal(sectionSchema.safeParse(hero).success, true);
  assert.equal(sectionSchema.safeParse({ ...hero, type: 'custom_code' }).success, false);
  assert.equal(sectionSchema.safeParse({ ...hero, data: { heading: 'Hello', raw_html: '<script />' } }).success, false);
  assert.equal(sectionSchema.safeParse({ ...hero, data: { button_url: 'javascript:alert(1)' } }).success, false);
});
