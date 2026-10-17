import test from 'node:test';
import assert from 'node:assert/strict';
import { apiOrigin, localApiOrigin, productionApiOrigin } from '../src/features/sync/api-base.ts';

test('web development uses the local OSPanel host and native builds use the production domain', () => {
  assert.equal(apiOrigin('web'), localApiOrigin);
  assert.equal(apiOrigin('ios'), productionApiOrigin);
  assert.equal(apiOrigin('android'), productionApiOrigin);
  assert.equal(apiOrigin('web', 'https://example.test/'), 'https://example.test');
});
