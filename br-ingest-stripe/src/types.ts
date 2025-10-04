export interface StripeCharge {
  id: string;
  customer?: string | null;
  amount: number;
  currency: string;
  paid: boolean;
  status: string;
  created: number;
  refunded?: boolean;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  canceled_at?: number;
  cancel_at_period_end?: boolean;
  created: number;
  updated?: number;
}

export interface StripeSubscriptionItem {
  id: string;
  price?: {
    id?: string;
    currency?: string;
    recurring?: { interval?: string; interval_count?: number };
    unit_amount?: number | null;
  };
  quantity?: number | null;
}
