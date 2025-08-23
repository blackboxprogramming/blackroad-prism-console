import React from 'react';

export interface BillingInfo {
  plan: string;
  amountDue: number;
  nextBillingDate: string;
}

export function BillingCard({ plan, amountDue, nextBillingDate }: BillingInfo) {
  return (
    <div className="p-4 rounded-lg bg-[var(--bg-elev-1)] border border-[var(--border)] shadow-[var(--shadow-md)]">
      <h3 className="text-lg font-semibold mb-2">Billing</h3>
      <div className="flex justify-between"><span>Plan</span><span>{plan}</span></div>
      <div className="flex justify-between"><span>Amount Due</span><span>${amountDue}</span></div>
      <div className="flex justify-between"><span>Next Billing</span><span>{nextBillingDate}</span></div>
    </div>
  );
}
