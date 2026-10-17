import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatedPayMinor, localDateTimeToInstant, overlaps, paidMinutes, previewRotation } from '../src/features/calendar/domain.ts';

test('overnight and DST-length shifts use actual elapsed minutes and one break', () => {
  assert.equal(paidMinutes({ startsAt: '2026-10-24T21:00:00Z', endsAt: '2026-10-25T05:00:00Z', breakMinutes: 30 }), 450);
  assert.equal(paidMinutes({ startsAt: '2026-03-29T00:00:00Z', endsAt: '2026-03-29T06:00:00Z', breakMinutes: 0 }), 360);
});

test('money rounds half up in integer minor units and keeps currencies separated by callers', () => {
  assert.equal(estimatedPayMinor({ startsAt: '2026-01-01T08:00:00Z', endsAt: '2026-01-01T08:30:00Z', breakMinutes: 0, hourlyRateMinor: 101 }), 51);
  assert.throws(() => estimatedPayMinor({ startsAt: '2026-01-01T08:00:00Z', endsAt: '2026-01-01T08:30:00Z', breakMinutes: 0, hourlyRateMinor: -1 }), /pay.invalid_rate/);
});

test('overlap is symmetric at boundaries and permits adjacent shifts', () => {
  const a={startsAt:'2026-01-01T08:00:00Z',endsAt:'2026-01-01T12:00:00Z'};
  assert.equal(overlaps(a,{startsAt:'2026-01-01T11:00:00Z',endsAt:'2026-01-01T13:00:00Z'}),true);
  assert.equal(overlaps(a,{startsAt:'2026-01-01T12:00:00Z',endsAt:'2026-01-01T14:00:00Z'}),false);
});

test('rotation preview wraps before its anchor and emits only work days', () => {
  const preview=previewRotation([{kind:'work'},{kind:'off'}],'2026-01-02','2026-01-01','2026-01-04');
  assert.deepEqual(preview.map(x=>x.date),['2026-01-02','2026-01-04']);
});

test('invalid dates and reversed shifts fail safely', () => {
  assert.throws(()=>previewRotation([{kind:'off'}],'2026-02-30','2026-03-01','2026-03-02'),/date.invalid/);
  assert.throws(()=>paidMinutes({startsAt:'2026-01-01T13:00:00Z',endsAt:'2026-01-01T12:00:00Z',breakMinutes:0}),/shift.end_after_start/);
});

test('local wall times detect DST gaps and choose the earlier repeated instant', () => {
  assert.throws(() => localDateTimeToInstant('2026-03-08', '02:30', 'America/New_York'), /date.nonexistent_local_time/);
  const repeated = localDateTimeToInstant('2026-11-01', '01:30', 'America/New_York');
  assert.equal(repeated.instant.toISOString(), '2026-11-01T05:30:00.000Z');
  assert.equal(repeated.ambiguous, true);
  assert.equal(localDateTimeToInstant('2026-11-01', '03:30', 'America/New_York').ambiguous, false);
});
