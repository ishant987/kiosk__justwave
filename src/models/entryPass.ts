export interface EntryPass {
  id: string;
  pass_number?: string;
  qr_token?: string;
  status?: string;
  amount?: number;
  bill_total_amount?: number;
  pass_price?: number;
  child_name?: string;
  child_id?: string;
  customer_name?: string;
  parent_name?: string;
  location_name?: string;
  entry_type?: string;
  expected_duration_minutes?: number;
  issued_at?: string;
  paid_at?: string;
  print_count?: number;
}

export interface CreatePassPayload {
  location_id: string;
  phone: string;
  duration_price_id: string;
  parent_id?: string;
  child_ids?: string[];
  customer_name?: string;
  child_count?: number;
  child_names?: string[];
  payment_mode?: 'cash' | 'razorpay';
}

export interface EntryPassCreateResult {
  data?: EntryPass[];
  passes?: EntryPass[];
  pass?: EntryPass;
  ids?: string[];
  payment?: {
    required?: boolean;
    provider?: string;
    ids?: string[];
    create_order_url?: string;
    verify_url?: string;
  };
  total_amount?: number;
  payment_required?: boolean;
  message?: string;
}

export interface PrintRecordPayload {
  ids: string[];
}
