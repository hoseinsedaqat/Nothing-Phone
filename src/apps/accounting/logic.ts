import type { Account, AccountingState, Transaction } from '../../os/types';

export const CURRENCIES: Record<string, { symbol: string; label: string }> = {
  USD: { symbol: '$', label: 'US Dollar' },
  EUR: { symbol: '€', label: 'Euro' },
  GBP: { symbol: '£', label: 'British Pound' },
  SEK: { symbol: 'kr', label: 'Swedish Krona' },
  IRR: { symbol: '﷼', label: 'Iranian Rial' },
  AED: { symbol: 'د.إ', label: 'UAE Dirham' },
};

export function accountBalance(accountId: string, state: AccountingState): number {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  return state.transactions.reduce((bal, t) => {
    if (t.type === 'income' && t.accountId === accountId) return bal + t.amount;
    if (t.type === 'expense' && t.accountId === accountId) return bal - t.amount;
    if (t.type === 'transfer') {
      if (t.accountId === accountId) return bal - t.amount;
      if (t.toAccountId === accountId) return bal + t.amount;
    }
    return bal;
  }, acc.initialBalance);
}

export function totals(state: AccountingState, range?: { from: string; to: string }) {
  const txns = range ? state.transactions.filter((t) => t.date >= range.from && t.date <= range.to) : state.transactions;
  const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = state.accounts.reduce((s, a) => s + accountBalance(a.id, state), 0);
  return { income, expense, net: income - expense, totalBalance, count: txns.length };
}

export function byCategory(state: AccountingState, kind: 'income' | 'expense') {
  const map = new Map<string, number>();
  state.transactions
    .filter((t) => t.type === kind)
    .forEach((t) => map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount));
  return [...map.entries()]
    .map(([categoryId, amount]) => ({
      category: state.categories.find((c) => c.id === categoryId),
      amount,
    }))
    .filter((x) => x.category)
    .sort((a, b) => b.amount - a.amount);
}

export function monthlySeries(state: AccountingState, months = 6) {
  const now = new Date();
  const out: { key: string; label: string; income: number; expense: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const txns = state.transactions.filter((t) => t.date.startsWith(key));
    out.push({
      key,
      label: d.toLocaleDateString([], { month: 'short' }),
      income: txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }
  return out;
}

export function toCSV(state: AccountingState): string {
  const head = 'id,date,type,amount,currency,account,to_account,category,note,created_at';
  const nameOf = (id?: string) => state.accounts.find((a) => a.id === id)?.name ?? '';
  const catOf = (id: string) => state.categories.find((c) => c.id === id)?.name ?? '';
  const rows = state.transactions.map((t: Transaction) =>
    [
      t.id,
      t.date,
      t.type,
      t.amount.toFixed(2),
      state.currency,
      `"${nameOf(t.accountId)}"`,
      `"${nameOf(t.toAccountId)}"`,
      `"${catOf(t.categoryId)}"`,
      `"${t.note.replace(/"/g, '""')}"`,
      new Date(t.createdAt).toISOString(),
    ].join(','),
  );
  return [head, ...rows].join('\n');
}

export function download(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function formatDate(iso: string, style: AccountingState['dateFormat']): string {
  const [y, m, d] = iso.split('-');
  if (style === 'dd/mm/yyyy') return `${d}/${m}/${y}`;
  if (style === 'mm/dd/yyyy') return `${m}/${d}/${y}`;
  return iso;
}

export function sampleSeed(state: AccountingState): AccountingState {
  const today = new Date();
  const d = (offset: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() - offset);
    return x.toISOString().slice(0, 10);
  };
  const cash = state.accounts[0]?.id ?? 'acc-cash';
  const bank = state.accounts[1]?.id ?? 'acc-bank';
  const txns: Transaction[] = [
    { id: 'seed-1', type: 'income', amount: 3200, categoryId: 'cat-salary', accountId: bank, note: 'Monthly salary', date: d(2), createdAt: Date.now() - 2e8 },
    { id: 'seed-2', type: 'expense', amount: 86.4, categoryId: 'cat-food', accountId: cash, note: 'Groceries', date: d(1), createdAt: Date.now() - 1e8 },
    { id: 'seed-3', type: 'expense', amount: 32, categoryId: 'cat-transport', accountId: bank, note: 'Monthly transit pass', date: d(4), createdAt: Date.now() - 4e8 },
    { id: 'seed-4', type: 'expense', amount: 12.9, categoryId: 'cat-fun', accountId: cash, note: 'Cinema', date: d(6), createdAt: Date.now() - 6e8 },
    { id: 'seed-5', type: 'income', amount: 450, categoryId: 'cat-freelance', accountId: bank, note: 'Design project', date: d(9), createdAt: Date.now() - 9e8 },
  ];
  return { ...state, transactions: [...txns, ...state.transactions] };
}

export type { Account };
