// Chạy sau npm install: node tests/teachingPlan.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.join(__dirname, '../src/planner/teachingPlan.ts');
const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const mod = new Module(filename, module); mod.filename = filename; mod.paths = module.paths; mod._compile(js, filename);
const { previewTeachingPlan } = mod.exports;
assert.deepEqual(previewTeachingPlan('2026-11-09', ['Thứ 2','Thứ 4','Thứ 6'], 3), {
 firstDate: '2026-11-09', endDate: '2026-12-11', totalPeriods: 45, totalMeetings: 15,
 counts: { 'Thứ 2':5, 'Thứ 3':0, 'Thứ 4':5, 'Thứ 5':0, 'Thứ 6':5, 'Thứ 7':0, 'Chủ nhật':0 },
});
assert.equal(previewTeachingPlan('2026-11-09', ['Thứ 2','Thứ 4'], 3).endDate, '2026-12-28');
assert.equal(previewTeachingPlan('2026-11-09', ['Thứ 3','Thứ 5'], 1).endDate, '2026-11-24');
assert.equal(previewTeachingPlan('2026-11-09', ['Thứ 2','Thứ 2'], 3), null);
assert.equal(previewTeachingPlan('2026-11-09', ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'], 1), null);
console.log('OK: 5 kiểm thử tính lịch theo tín chỉ');
