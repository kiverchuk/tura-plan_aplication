import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseVerificationRequest } from '../src/features/billing/purchase-payload.ts';

test('purchase receipt is routed to the matching server verifier',()=>{
  assert.deepEqual(purchaseVerificationRequest({store:'apple',productId:'premium.year',transactionId:'txn-1'}),{path:'/billing/apple/verify',body:{transaction_id:'txn-1'}});
  assert.deepEqual(purchaseVerificationRequest({store:'google',productId:'premium.year',purchaseToken:'secret-token'}),{path:'/billing/google/verify',body:{product_id:'premium.year',purchase_token:'secret-token'}});
});

test('purchase validation rejects missing credentials and unsupported stores',()=>{
  assert.throws(()=>purchaseVerificationRequest({store:'apple',productId:'premium'}),/missing_transaction_id/);
  assert.throws(()=>purchaseVerificationRequest({store:'google',productId:'premium'}),/missing_purchase_token/);
  assert.throws(()=>purchaseVerificationRequest({store:'amazon',productId:'premium'}),/unsupported_store/);
});
