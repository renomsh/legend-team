import { extractTaoFromContent } from './lib/nexus-turn-push';

const cases: Array<{ name: string; text: string; expected: unknown }> = [
  {
    name: 'multi-line block',
    text: '본문 단언입니다.\n\n# tao\nt: 4\na: 2\no: 5\n',
    expected: { t: 4, a: 2, o: 5 },
  },
  {
    name: 'single line block',
    text: '결론.\n# tao\nt:3 a:1 o:4',
    expected: { t: 3, a: 1, o: 4 },
  },
  {
    name: 'no tao block',
    text: '본문만 있음.',
    expected: null,
  },
  {
    name: 'partial (missing o)',
    text: '# tao\nt: 4\na: 2',
    expected: null,
  },
  {
    name: 'last block wins',
    text: '# tao\nt:1 a:0 o:1\n나중\n# tao\nt:5 a:4 o:5',
    expected: { t: 5, a: 4, o: 5 },
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const got = extractTaoFromContent([{ type: 'text', text: c.text }]);
  const ok = JSON.stringify(got) === JSON.stringify(c.expected);
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${c.name}: got=${JSON.stringify(got)} expected=${JSON.stringify(c.expected)}`);
  if (ok) pass++;
  else fail++;
}
console.log(`\n총 ${cases.length} — PASS ${pass} / FAIL ${fail}`);
process.exit(fail > 0 ? 1 : 0);
