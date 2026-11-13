import { apiWithFallback } from './client';
import { mockService } from './mockService';
import { Account, JournalEntry } from '@/types';

export async function fetchAccounts(): Promise<Account[]> {
  return apiWithFallback<Account[]>('/accounts', {}, () => mockService.getAccounts());
}

export async function createAccount(data: Omit<Account, 'id'>): Promise<Account> {
  return apiWithFallback<Account>(
    '/accounts',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createAccount(data)
  );
}

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  return apiWithFallback<JournalEntry[]>('/ledger/journal-entries', {}, () => mockService.getJournalEntries());
}

export async function createJournalEntry(data: Omit<JournalEntry, 'id' | 'entryNumber' | 'createdAt'>): Promise<JournalEntry> {
  return apiWithFallback<JournalEntry>(
    '/ledger/journal-entries',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    () => mockService.createJournalEntry(data)
  );
}
