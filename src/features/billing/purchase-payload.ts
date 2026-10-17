export type StorePurchase = {
  store: string;
  productId: string;
  transactionId?: string | null;
  purchaseToken?: string | null;
};

export function purchaseVerificationRequest(purchase: StorePurchase) {
  if (purchase.store === 'apple') {
    if (!purchase.transactionId) throw new Error('billing.missing_transaction_id');
    return { path: '/billing/apple/verify', body: { transaction_id: purchase.transactionId } } as const;
  }
  if (purchase.store === 'google') {
    if (!purchase.purchaseToken) throw new Error('billing.missing_purchase_token');
    return { path: '/billing/google/verify', body: { product_id: purchase.productId, purchase_token: purchase.purchaseToken } } as const;
  }
  throw new Error('billing.unsupported_store');
}
