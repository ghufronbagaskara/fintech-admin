export interface Merchant {
  id: number
  username: string
  owner_name: string
  shop_name: string
  shop_address: string | null
  business_type: string | null
  ktp_number: string | null
  is_verified: boolean
  is_umi: boolean
  is_suspended: boolean
  suspended_reason: string | null
  suspended_at: string | null
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
}

export interface Balance {
  id: number
  merchant_id: number
  main_balance: number
  gold_balance: number
}

export interface Transaksi {
  id: string
  merchant_id: number
  type: string
  title: string
  total_amount: number
  main_amount: number
  gold_amount: number
  gold_weight_added: number
  mdr_fee: number
  created_at: string
}

export interface GoldPrice {
  id: number
  price: number
  buyback_price: number | null
  updated_at: string
}

export interface AuditLog {
  id: number
  admin_email: string
  action: string
  target_table: string
  target_id: string | null
  detail: unknown
  created_at: string
}

export interface Installment {
  id: number
  merchant_id: number
  target_weight: number
  split_percentage: number
  accumulated_amount: number
  accumulated_gold_weight: number
  total_installment_amount: number
  is_active: boolean
}
