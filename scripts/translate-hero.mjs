#!/usr/bin/env node
// Re-emits the hero shader for every CrossTL target. Run after each CrossTL release:
//   pip install -U crosstl && npm run hero
// Writes content/targets/lanes.<backend>.txt — the files shown on the stage and run in the hero.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const CROSSTL = process.env.CROSSTL ?? 'crosstl';
const backends = ['webgl', 'opengl', 'metal', 'directx', 'vulkan', 'wgsl', 'cuda', 'hip', 'slang', 'rust', 'mojo'];
mkdirSync('content/targets', { recursive: true });
let version = 'unknown';
try { version = execFileSync('pip', ['show', 'crosstl'], { encoding: 'utf8' }).match(/^Version: (.+)$/m)?.[1] ?? version; } catch {}
for (const b of backends) {
  try {
    execFileSync(CROSSTL, ['translate', 'src/hero/lanes.cgl', '--backend', b, '--output', `content/targets/lanes.${b}.txt`], { stdio: 'pipe' });
    console.log(`${b.padEnd(8)} ok`);
  } catch (e) {
    const msg = (e.stderr?.toString() || e.message).trim().split('\n').pop();
    writeFileSync(`content/targets/lanes.${b}.txt`, `// crosstl ${version} refused this target:\n// ${msg}\n`);
    console.log(`${b.padEnd(8)} refused: ${msg}`);
  }
}
try {
  const tc = JSON.parse(readFileSync('content/toolchain.json', 'utf8'));
  tc.crosstl = version; writeFileSync('content/toolchain.json', JSON.stringify(tc, null, 2) + '\n');
} catch {}
console.log(`crosstl ${version}`);
