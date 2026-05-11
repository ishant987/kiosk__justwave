export interface RazorpayOrderConfig {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  key?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  method?: Record<string, boolean>;
}

export interface RazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
