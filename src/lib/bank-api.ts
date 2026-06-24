/**
 * Bank API placeholder interface.
 * Until bank access is provided: manual payment marking via VS matching.
 */

export interface BankTransaction {
  transactionId: string;
  date: Date;
  amount: number; // halere
  variableSymbol?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  message?: string;
}

export interface BankApiProvider {
  fetchTransactions(since: Date): Promise<BankTransaction[]>;
  isConnected(): Promise<boolean>;
}

/**
 * Manual provider (default): no-op, all payments entered manually.
 */
export class ManualBankProvider implements BankApiProvider {
  async fetchTransactions(): Promise<BankTransaction[]> {
    return [];
  }

  async isConnected(): Promise<boolean> {
    return false;
  }
}

export function getBankProvider(): BankApiProvider {
  // Future: switch based on BANK_API_PROVIDER env var
  return new ManualBankProvider();
}
