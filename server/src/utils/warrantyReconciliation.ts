// Read-only reconciliation. Never invent receipts for legacy records.
export function reconcileWarrantyClaims(sale: any, transactions: any[]) {
  const claims = sale.claims || [];
  const byId = new Map(transactions.map(tx => [String(tx._id), tx]));
  return claims.map((claim: any) => {
    const cost = claim.cost || 0;
    const id = claim.costTransactionId && String(claim.costTransactionId);
    if (!id) return { status: cost > 0 ? 'missing_link' : 'no_cost' };
    const tx: any = byId.get(id);
    if (!tx) return { status: 'missing_transaction' };
    if (tx.isDeleted) return { status: 'deleted_transaction' };
    if (String(tx.saleId) !== String(sale._id) || tx.type !== 'expense') return { status: 'wrong_transaction' };
    if (claims.filter((other: any) => String(other.costTransactionId) === id).length > 1) return { status: 'duplicate_link' };
    if (tx.amount !== cost) return { status: 'amount_mismatch', transactionAmount: tx.amount };
    return { status: 'matched', transactionAmount: tx.amount };
  });
}
