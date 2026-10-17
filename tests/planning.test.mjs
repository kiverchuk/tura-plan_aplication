import test from 'node:test';
import assert from 'node:assert/strict';
import { monthRange, overtimeMinutes, presetDays, weekRange, yearRange } from '../src/features/calendar/planning.ts';

test('starter rotations keep work and rest in the documented order', () => {
  assert.deepEqual(presetDays('5-2', '08:00', '16:00').map(day => day.kind), ['work', 'work', 'work', 'work', 'work', 'off', 'off']);
  const panama = presetDays('2-2-3', '08:00', '20:00');
  assert.equal(panama.length, 9);
  assert.equal(panama.filter(day => day.kind === 'work').length, 5);
  const nights = presetDays('day-night-off', '07:00', '19:00');
  assert.equal(nights[1].startLocal, '22:00');
  assert.equal(nights[1].endLocal, '06:00');
});

test('overtime starts only after the chosen daily threshold', () => {
  assert.equal(overtimeMinutes(570, 480), 90);
  assert.equal(overtimeMinutes(480, 480), 0);
  assert.throws(() => overtimeMinutes(-1, 480), /shift.invalid_duration/);
});

test('period bounds are half-open and follow the week start', () => {
  const friday = new Date(2026, 9, 16);
  assert.deepEqual(weekRange(friday, 1), { from: '2026-10-12', to: '2026-10-19' });
  assert.deepEqual(weekRange(friday, 0), { from: '2026-10-11', to: '2026-10-18' });
  assert.deepEqual(monthRange(friday), { from: '2026-10-01', to: '2026-11-01' });
  assert.deepEqual(yearRange(friday), { from: '2026-01-01', to: '2027-01-01' });
});
