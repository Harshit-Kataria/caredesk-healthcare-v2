const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('browser script demonstrates function, var, and let hoisting rules', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'hoisting.js'),
    'utf8'
  );
  const browser = {};
  vm.runInNewContext(source, { window: browser });

  const report = browser.CareDeskHoistingReport;
  assert.equal(report.functionBeforeDeclaration, 'Function declarations are hoisted');
  assert.equal(report.varBeforeAssignment, undefined);
  assert.equal(report.varAfterAssignment, 'scheduled');
  assert.equal(report.temporalDeadZone, 'ReferenceError');
  assert.equal(report.letAfterInitialization, 'practice administrator');
});
