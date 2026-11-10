import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
test('no service-role key is referenced in application source or public env example', () => {
  const files = [...walk(join(process.cwd(), 'src')), join(process.cwd(), '.env.example')];
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.ok(!/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/.test(source), `${file} exposes a public service-role variable`);
    assert.ok(!/SUPABASE_SERVICE_ROLE_KEY\s*=/.test(source), `${file} hardcodes a service-role assignment`);
  }
});
test('CMS renderer never evaluates database content as code', () => {
  const renderer = readFileSync(join(process.cwd(), 'src/components/cms/section-renderer.tsx'), 'utf8');
  assert.ok(!/\beval\s*\(/.test(renderer));
  assert.ok(!/new Function\s*\(/.test(renderer));
  assert.ok(!/dangerouslySetInnerHTML/.test(renderer));
});
