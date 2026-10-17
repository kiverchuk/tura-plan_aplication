import test from 'node:test';
import assert from 'node:assert/strict';
import { configureAnalyticsAdapter, hasAnalyticsConsent, setAnalyticsConsent, trackAnalyticsEvent } from '../src/features/analytics/analytics.ts';

function database(){let consent='denied';return {
  async runAsync(_sql,...params){consent=params[1];},
  async getFirstAsync(){return {value:consent};},
};}

test('analytics persists opt-in and only emits allowlisted events without parameters',async()=>{
  const db=database(),events=[],collection=[];
  configureAnalyticsAdapter({setCollectionEnabled:async value=>collection.push(value),logEvent:async name=>events.push(name)});
  await trackAnalyticsEvent(db,'shift_created');
  await setAnalyticsConsent(db,true);
  await trackAnalyticsEvent(db,'shift_created');
  await trackAnalyticsEvent(db,'email_entered');
  assert.equal(await hasAnalyticsConsent(db),true);
  assert.deepEqual(collection,[true]);
  assert.deepEqual(events,['shift_created']);
  await setAnalyticsConsent(db,false);
  assert.deepEqual(collection,[true,false]);
  configureAnalyticsAdapter(null);
});
