export interface TransactionData {
  type: string;
  amount: number;
  asset: string;
  status?: string;
  metadata?: Record<string, unknown>;
  tx_hash?: string;
  lzybra_borrowed?: number; // For deposit/withdraw transactions only
}

export interface ExecuteTransactionData {
  dest: string;
  calldata: string;
  asset: string;
  amount: number;
}

export interface UserProfileUpdateData {
  first_name?: string;
  last_name?: string;
  profile_details?: Record<string, unknown>;
}

export interface KYCSubmissionData {
  document_type: string;
  document_number: string;
  document_image: string;
}
