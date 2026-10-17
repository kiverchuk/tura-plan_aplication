import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSyncMutation } from '../src/features/sync/prepare-mutation.ts';

test('sync payload drops SQLite identity metadata and carries the server base revision', () => {
  const mutation={id:'f9ae8c88-d287-47d2-b33e-913aa608bb12',entity_type:'shift',entity_id:'96cc48fd-6ef8-444a-9062-bd0793948c65',operation:'upsert',payload:JSON.stringify({id:'96cc48fd-6ef8-444a-9062-bd0793948c65',revision:4,title:'Night shift',rotationId:'64c906bc-4908-431f-a51e-a46e8b51cbe9',updatedAt:'2026-01-01T00:00:00Z',startsAt:'2026-01-01T20:00:00Z'})};
  assert.deepEqual(prepareSyncMutation(mutation,5),{id:mutation.id,entityType:'shift',entityId:mutation.entity_id,operation:'upsert',payload:{title:'Night shift',rotationId:'64c906bc-4908-431f-a51e-a46e8b51cbe9',startsAt:'2026-01-01T20:00:00Z'},baseRevision:4});
});
