import { validateTurns } from './validate-session-turns';

const turns = [
  { role: 'nexus', turnIdx: 0, tao: { t: 7, a: 1, o: 5 } },        // t 범위 초과
  { role: 'nexus', turnIdx: 1, tao: { t: 3, a: -1, o: 6 } },       // a, o 범위 위반
  { role: 'nexus', turnIdx: 2, tao: 'invalid' },                   // 객체 아님
  { role: 'nexus', turnIdx: 3, tao: { t: 4, a: 2, o: 3 } },        // valid
  { role: 'nexus', turnIdx: 4 },                                   // tao 없음 — pass
];

const r = validateTurns('test_tao', turns, false, []);
console.log(JSON.stringify(r, null, 2));
