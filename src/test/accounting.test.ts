import { describe, it, expect } from 'vitest';
import { accountBalance, totals, byCategory, toCSV, CURRENCIES } from '../apps/accounting/logic';
import type { AccountingState, Transaction } from '../os/types';
import { uid } from '../os/storage';

const state: AccountingState = {
  accounts: [
    { id: 'a1', name: 'Cash', kind: 'cash', initialBalance: 100, color: '#000', createdAt: 0 },
    { id: 'a2', name: 'Bank', kind: 'bank', initialBalance: 500, color: '#111', createdAt: 0 },
  ],
  transactions: [],
  categories: [
    { id: 'c1', name: 'Salary', kind: 'income', icon: 'wallet', color: '#fff' },
    { id: 'c2', name: 'Food', kind: 'expense', icon: 'food', color: '#eee' },
  ],
  currency: 'USD',
  dateFormat: 'yyyy-mm-dd',
};

const txn = (t: Partial<Transaction>): Transaction => ({
  id: uid(),
  type: 'expense',
  amount: 0,
  categoryId: 'c2',
  accountId: 'a1',
  note: '',
  date: '2026-10-20',
  createdAt: Date.now(),
  ...t,
});

describe('accounting math', () => {
  it('starts from opening balances', () => {
    expect(accountBalance('a1', state)).toBe(100);
    expect(accountBalance('a2', state)).toBe(500);
    expect(totals(state).totalBalance).toBe(600);
  });

  it('adds income and subtracts expenses', () => {
    const s: AccountingState = {
      ...state,
      transactions: [
        txn({ type: 'income', amount: 400, categoryId: 'c1', accountId: 'a2' }),
        txn({ type: 'expense', amount: 30, accountId: 'a1' }),
      ],
    };
    expect(accountBalance('a2', s)).toBe(900);
    expect(accountBalance('a1', s)).toBe(70);
    const t = totals(s);
    expect(t.income).toBe(400);
    expect(t.expense).toBe(30);
    expect(t.net).toBe(370);
  });

  it('moves money correctly on transfers (no wealth creation)', () => {
    const s: AccountingState = {
      ...state,
      transactions: [txn({ type: 'transfer', amount: 200, accountId: 'a2', toAccountId: 'a1' })],
    };
    expect(accountBalance('a1', s)).toBe(300);
    expect(accountBalance('a2', s)).toBe(300);
    expect(totals(s).totalBalance).toBe(600);
  });

  it('groups expenses by category', () => {
    const s: AccountingState = {
      ...state,
      transactions: [
        txn({ amount: 40, categoryId: 'c2' }),
        txn({ amount: 60, categoryId: 'c2' }),
      ],
    };
    const groups = byCategory(s, 'expense');
    expect(groups).toHaveLength(1);
    expect(groups[0].amount).toBe(100);
  });

  it('exports valid CSV with headers and rows', () => {
    const s: AccountingState = {
      ...state,
      transactions: [txn({ amount: 25, note: 'Lunch, with comma' })],
    };
    const csv = toCSV(s);
    const [head, row] = csv.split('\n');
    expect(head).toContain('date,type,amount,currency');
    expect(row).toContain('25.00');
    expect(row).toContain('"Lunch, with comma"');
  });

  it('supports multiple currencies', () => {
    expect(CURRENCIES.EUR.symbol).toBe('€');
    expect(CURRENCIES.SEK.symbol).toBe('kr');
  });
});
