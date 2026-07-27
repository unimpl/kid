// 难度配置 + 渐进关卡生成 + 减法题目生成
export const DIFFICULTIES = [
  { id: 'ones',      name: '个位数', min: 1,    max: 9,    digits: 1 },
  { id: 'tens',      name: '十位数', min: 10,   max: 99,   digits: 2 },
  { id: 'hundreds',  name: '百位数', min: 100,  max: 999,  digits: 3 },
  { id: 'thousands', name: '千位数', min: 1000, max: 9999, digits: 4 },
];

const STAGE_NAMES = ['月球基地', '小行星带', '火星轨道', '木星风暴', '土星之环'];
const STAGE_ICONS = ['moon', 'rock', 'mars', 'jupiter', 'saturn'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// 根据难度生成 5 个渐进关卡
export function buildStages(difficulty) {
  const diff = difficulty || DIFFICULTIES[0];
  const span = diff.max - diff.min;
  const stages = [];
  for (let i = 0; i < 5; i++) {
    const lo = diff.min + Math.floor(span * i / 5);
    stages.push({
      id: i + 1,
      name: STAGE_NAMES[i],
      icon: STAGE_ICONS[i],
      min: Math.max(diff.min, lo),
      max: diff.max,
      borrow: diff.max >= 10, // 两位及以上才出现退位
      questions: i >= 3 ? 6 : 5,
      time: 13 + (diff.digits - 1) * 5 + (i >= 3 ? 2 : 0),
      difficulty: diff,
    });
  }
  return stages;
}

export function generateProblem(stage) {
  let a, b;
  if (stage.borrow) {
    // 退位减法：个位不够减需借位
    let ok = false, tries = 0;
    while (!ok && tries++ < 120) {
      a = rand(Math.max(stage.min, 10), stage.max);
      const aUnit = a % 10;
      const aRest = Math.floor(a / 10);
      // b 的个位须大于 a 的个位 → 需借位
      const bUnit = aUnit < 9 ? rand(aUnit + 1, 9) : rand(1, 9);
      let bRest = rand(0, aRest);
      b = bRest * 10 + bUnit;
      if (b >= a && aRest > 0) { bRest = aRest - 1; b = bRest * 10 + bUnit; }
      if (b >= 1 && b < a && (a % 10) < (b % 10)) ok = true;
    }
    if (!ok) { a = Math.max(stage.min, 13); b = 6; }
  } else {
    a = rand(Math.max(2, stage.min), stage.max);
    b = rand(0, a);
  }
  const answer = a - b;
  // 干扰项：随数字量级自适应间距
  const step = Math.max(3, Math.min(80, Math.floor(answer / 25) || 3));
  const opts = new Set([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 80) {
    const d = rand(1, step) * (Math.random() < 0.5 ? -1 : 1);
    const cand = answer + d;
    if (cand >= 0 && cand !== answer && !opts.has(cand)) opts.add(cand);
  }
  let pad = 1;
  while (opts.size < 4) { opts.add(answer + pad++); }
  const options = [...opts].sort(() => Math.random() - 0.5);
  return { a, b, answer, options };
}
