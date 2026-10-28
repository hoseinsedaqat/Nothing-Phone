import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, Pencil, ArrowLeftRight, Wallet, TrendingUp, TrendingDown,
  Scale, FileDown, Search, X, LayoutDashboard, Receipt, Landmark, BarChart3, Settings2,
} from 'lucide-react';
import { useData } from '../../os/dataStore';
import { useOS } from '../../os/store';
import { EmptyState, Sheet, ConfirmDialog, Segmented, Switch } from '../../components/ui';
import { uid } from '../../os/storage';
import type { Account, AccountingState, Category, Transaction, TxnType } from '../../os/types';
import {
  CURRENCIES, accountBalance, totals, byCategory, monthlySeries, toCSV, download,
  formatDate, sampleSeed,
} from './logic';
import './AccountingApp.css';

type Tab = 'dashboard' | 'transactions' | 'accounts' | 'reports' | 'settings';

export default function AccountingApp() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editor, setEditor] = useState<Transaction | 'new' | null>(null);
  const accounting = useData((s) => s.accounting);

  return (
    <div className="acc-app">
      <div className="acc-content app-scroll">
        {tab === 'dashboard' && <Dashboard onAdd={() => setEditor('new')} go={setTab} />}
        {tab === 'transactions' && <Transactions onEdit={setEditor} onAdd={() => setEditor('new')} />}
        {tab === 'accounts' && <Accounts />}
        {tab === 'reports' && <Reports />}
        {tab === 'settings' && <SettingsTab onSample={() => setEditor(null)} />}
      </div>

      {tab !== 'settings' && (
        <button className="fab" onClick={() => setEditor('new')} aria-label="Add transaction">
          <Plus size={24} />
        </button>
      )}

      <TransactionEditor
        open={editor !== null}
        value={editor === 'new' ? null : editor}
        onClose={() => setEditor(null)}
      />

      <nav className="acc-tabs">
        {([
          ['dashboard', LayoutDashboard, 'Home'],
          ['transactions', Receipt, 'Txns'],
          ['accounts', Landmark, 'Accounts'],
          ['reports', BarChart3, 'Reports'],
          ['settings', Settings2, 'Settings'],
        ] as const).map(([id, Icon, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function useMoney() {
  const currency = useData((s) => s.accounting.currency);
  const sym = CURRENCIES[currency]?.symbol ?? '$';
  return (n: number) => `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Dashboard ────────────────────────────────────────────────
function Dashboard({ onAdd, go }: { onAdd: () => void; go: (t: Tab) => void }) {
  const state = useData((s) => s.accounting);
  const money = useMoney();
  const [range, setRange] = useState<'month' | '3m' | 'all'>('month');
  const now = new Date();
  const ranges = useMemo(() => {
    const to = now.toISOString().slice(0, 10);
    const from = new Date(now.getFullYear(), now.getMonth() - (range === 'month' ? 0 : range === '3m' ? 2 : 120), 1)
      .toISOString()
      .slice(0, 10);
    return { from, to };
  }, [range]); // eslint-disable-line
  const t = totals(state, ranges);
  const series = monthlySeries(state);
  const max = Math.max(1, ...series.map((s) => Math.max(s.income, s.expense)));
  const recent = [...state.transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="dash">
      <header className="acc-head">
        <h1>Accounting</h1>
      </header>
      <div className="range-chips">
        {(['month', '3m', 'all'] as const).map((r) => (
          <button key={r} className={`chip ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
            {r === '3m' ? '3 months' : r === 'all' ? 'All time' : 'This month'}
          </button>
        ))}
      </div>
      <div className="balance-hero n-card">
        <small>Total balance</small>
        <strong>{money(t.totalBalance)}</strong>
        <span className={`net ${t.net >= 0 ? 'pos' : 'neg'}`}>
          <Scale size={13} /> Net {money(t.net)}
        </span>
      </div>
      <div className="stat-row">
        <div className="n-card stat"><TrendingUp size={16} /><small>Income</small><strong className="pos">{money(t.income)}</strong></div>
        <div className="n-card stat"><TrendingDown size={16} /><small>Expense</small><strong className="neg">{money(t.expense)}</strong></div>
      </div>
      <div className="n-card chart-card">
        <div className="chart-title"><strong>Cash flow</strong><button onClick={() => go('reports')}>Reports</button></div>
        <div className="bars">
          {series.map((s) => (
            <div key={s.key} className="bar-col">
              <div className="bar-pair">
                <i className="bar income" style={{ height: `${(s.income / max) * 100}%` }} />
                <i className="bar expense" style={{ height: `${(s.expense / max) * 100}%` }} />
              </div>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="dash-recent">
        <div className="chart-title"><strong>Recent transactions</strong><button onClick={() => go('transactions')}>See all</button></div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Wallet size={24} />}
            title="No transactions yet"
            text="Record your first income or expense to see your finances."
            action={<button className="n-btn accent" onClick={onAdd}><Plus size={15} /> Add transaction</button>}
          />
        ) : (
          recent.map((tx) => <TxnRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}

// ── Transactions ─────────────────────────────────────────────
function Transactions({ onEdit, onAdd }: { onEdit: (t: Transaction) => void; onAdd: () => void }) {
  const state = useData((s) => s.accounting);
  const money = useMoney();
  const [filter, setFilter] = useState<'all' | TxnType>('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const patch = useData((s) => s.patch);

  const list = useMemo(() => {
    let l = state.transactions.filter((t) => filter === 'all' || t.type === filter);
    if (query) {
      const q = query.toLowerCase();
      l = l.filter((t) => {
        const cat = state.categories.find((c) => c.id === t.categoryId)?.name ?? '';
        const acc = state.accounts.find((a) => a.id === t.accountId)?.name ?? '';
        return t.note.toLowerCase().includes(q) || cat.toLowerCase().includes(q) || acc.toLowerCase().includes(q);
      });
    }
    return [...l].sort((a, b) =>
      sortBy === 'date' ? b.date.localeCompare(a.date) || b.createdAt - a.createdAt : b.amount - a.amount,
    );
  }, [state, filter, query, sortBy]);

  const remove = (t: Transaction) =>
    patch('accounting', { ...state, transactions: state.transactions.filter((x) => x.id !== t.id) });

  return (
    <div className="txns">
      <header className="acc-head"><h1>Transactions</h1></header>
      <div className="contacts-search">
        <Search size={15} />
        <input placeholder="Search note, category, account" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery('')}><X size={14} /></button>}
      </div>
      <div className="range-chips">
        {(['all', 'income', 'expense', 'transfer'] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <button className="chip" onClick={() => setSortBy(sortBy === 'date' ? 'amount' : 'date')}>
          Sort: {sortBy}
        </button>
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} />}
          title="Nothing here"
          text={state.transactions.length ? 'No transactions match your filters.' : 'Add an income or expense to begin.'}
          action={!state.transactions.length ? <button className="n-btn accent" onClick={onAdd}><Plus size={15} /> Add transaction</button> : undefined}
        />
      ) : (
        <div className="n-list-group" style={{ margin: 12 }}>
          {list.map((tx) => (
            <div className="n-list-row txn-row" key={tx.id}>
              <TxnRow tx={tx} compact />
              <span className="txn-buttons">
                <button className="inline-icon" onClick={() => onEdit(tx)} aria-label="Edit"><Pencil size={15} /></button>
                <button className="inline-icon danger" onClick={() => setToDelete(tx)} aria-label="Delete"><Trash2 size={15} /></button>
              </span>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete transaction?"
        text={`${money(toDelete?.amount ?? 0)} will be removed and balances recalculated.`}
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) remove(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function TxnRow({ tx, compact }: { tx: Transaction; compact?: boolean }) {
  const state = useData((s) => s.accounting);
  const money = useMoney();
  const cat = state.categories.find((c) => c.id === tx.categoryId);
  const acc = state.accounts.find((a) => a.id === tx.accountId);
  const toAcc = state.accounts.find((a) => a.id === tx.toAccountId);
  const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '';
  return (
    <div className="txn-line">
      <span className="txn-cat" style={{ background: cat?.color ?? 'var(--bg-card-2)', color: '#fff' }}>
        {tx.type === 'transfer' ? <ArrowLeftRight size={15} /> : (cat?.name[0] ?? '?')}
      </span>
      <span className="row-text">
        <span>{tx.note || cat?.name || 'Transaction'}</span>
        <small>
          {formatDate(tx.date, state.dateFormat)} · {tx.type === 'transfer' ? `${acc?.name} → ${toAcc?.name}` : acc?.name}
          {!compact && cat ? ` · ${cat.name}` : ''}
        </small>
      </span>
      <strong className={tx.type === 'income' ? 'pos' : tx.type === 'expense' ? 'neg' : ''}>
        {sign}
        {money(tx.amount)}
      </strong>
    </div>
  );
}

// ── Accounts ─────────────────────────────────────────────────
function Accounts() {
  const state = useData((s) => s.accounting);
  const patch = useData((s) => s.patch);
  const money = useMoney();
  const [editor, setEditor] = useState<Account | 'new' | null>(null);
  const [transfer, setTransfer] = useState(false);
  const [toDelete, setToDelete] = useState<Account | null>(null);
  const showToast = useOS((s) => s.showToast);
  const used = new Set(state.transactions.flatMap((t) => [t.accountId, t.toAccountId].filter(Boolean)));

  return (
    <div>
      <header className="acc-head"><h1>Accounts</h1></header>
      <div className="range-chips">
        <button className="n-btn accent" onClick={() => setTransfer(true)}><ArrowLeftRight size={15} /> Transfer</button>
        <button className="n-btn" onClick={() => setEditor('new')}><Plus size={15} /> New account</button>
      </div>
      {state.accounts.length === 0 ? (
        <EmptyState icon={<Landmark size={24} />} title="No accounts" text="Create a cash, bank or card account to track balances." />
      ) : (
        <div className="n-list-group" style={{ margin: 12 }}>
          {state.accounts.map((a) => (
            <div className="n-list-row" key={a.id}>
              <span className="txn-cat" style={{ background: a.color, color: '#fff' }}>{a.name[0]}</span>
              <span className="row-text">
                <span>{a.name}</span>
                <small>{a.kind} · initial {money(a.initialBalance)}</small>
              </span>
              <strong>{money(accountBalance(a.id, state))}</strong>
              <button className="inline-icon" onClick={() => setEditor(a)} aria-label="Edit"><Pencil size={15} /></button>
              <button
                className="inline-icon danger"
                onClick={() => (used.has(a.id) ? showToast('Account has transactions — delete them first') : setToDelete(a))}
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <AccountEditor open={editor !== null} value={editor === 'new' ? null : editor} onClose={() => setEditor(null)} />
      <TransferSheet open={transfer} onClose={() => setTransfer(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete account?"
        text={toDelete ? `${toDelete.name} and its opening balance will be removed.` : ''}
        danger
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) patch('accounting', { ...state, accounts: state.accounts.filter((a) => a.id !== toDelete.id) });
          setToDelete(null);
        }}
      />
    </div>
  );
}

function AccountEditor({ open, value, onClose }: { open: boolean; value: Account | null; onClose: () => void }) {
  const state = useData((s) => s.accounting);
  const patch = useData((s) => s.patch);
  const [form, setForm] = useState<Account>(
    value ?? { id: uid(), name: '', kind: 'cash', initialBalance: 0, color: '#D71921', createdAt: Date.now() },
  );
  useEffect(() => {
    if (open) setForm(value ?? { id: uid(), name: '', kind: 'cash', initialBalance: 0, color: '#D71921', createdAt: Date.now() });
  }, [open, value]);
  const save = () => {
    if (!form.name.trim()) return;
    const exists = state.accounts.some((a) => a.id === form.id);
    patch('accounting', {
      ...state,
      accounts: exists ? state.accounts.map((a) => (a.id === form.id ? form : a)) : [...state.accounts, form],
    });
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={value ? 'Edit account' : 'New account'}>
      <div className="editor-fields">
        <input className="n-input" placeholder="Account name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Segmented
          value={form.kind}
          onChange={(k) => setForm({ ...form, kind: k as Account['kind'] })}
          options={[
            { id: 'cash', label: 'Cash' }, { id: 'bank', label: 'Bank' },
            { id: 'card', label: 'Card' }, { id: 'savings', label: 'Savings' },
          ]}
        />
        <input
          className="n-input" type="number" inputMode="decimal" placeholder="Opening balance"
          value={form.initialBalance || ''} onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })}
        />
        <div className="color-row">
          {['#D71921', '#2f7cf6', '#30b455', '#8b5cf6', '#f2711c', '#5b6b7a'].map((c) => (
            <button key={c} className={`color-dot ${form.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} aria-label={`Color ${c}`} />
          ))}
        </div>
        <button className="n-btn accent" disabled={!form.name.trim()} onClick={save}>Save account</button>
      </div>
    </Sheet>
  );
}

function TransferSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useData((s) => s.accounting);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const [from, setFrom] = useState(state.accounts[0]?.id ?? '');
  const [to, setTo] = useState(state.accounts[1]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setFrom(state.accounts[0]?.id ?? '');
      setTo(state.accounts[1]?.id ?? '');
    }
  }, [open]); // eslint-disable-line
  const submit = () => {
    const amt = Number(amount);
    if (!from || !to || from === to) return showToast('Choose two different accounts');
    if (!(amt > 0)) return showToast('Enter a valid amount');
    const tx: Transaction = {
      id: uid(), type: 'transfer', amount: amt, categoryId: 'cat-transfer',
      accountId: from, toAccountId: to, note: note || 'Transfer',
      date: new Date().toISOString().slice(0, 10), createdAt: Date.now(),
    };
    patch('accounting', { ...state, transactions: [tx, ...state.transactions] });
    setAmount('');
    setNote('');
    onClose();
    showToast('Transfer recorded');
  };
  return (
    <Sheet open={open} onClose={onClose} title="Transfer between accounts">
      <div className="editor-fields">
        <select className="n-input" value={from} onChange={(e) => setFrom(e.target.value)}>
          {state.accounts.map((a) => <option key={a.id} value={a.id}>From · {a.name}</option>)}
        </select>
        <select className="n-input" value={to} onChange={(e) => setTo(e.target.value)}>
          {state.accounts.map((a) => <option key={a.id} value={a.id}>To · {a.name}</option>)}
        </select>
        <input className="n-input" type="number" inputMode="decimal" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="n-input" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="n-btn accent" onClick={submit}>Record transfer</button>
      </div>
    </Sheet>
  );
}

// ── Transaction editor ───────────────────────────────────────
function TransactionEditor({ open, value, onClose }: { open: boolean; value: Transaction | null; onClose: () => void }) {
  const state = useData((s) => s.accounting);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const [form, setForm] = useState<Transaction>(
    value ?? blankTxn(state),
  );
  useEffect(() => {
    if (open) setForm(value ?? blankTxn(useData.getState().accounting));
  }, [open, value]);

  const cats = state.categories.filter((c) => c.kind === form.type || form.type === 'transfer');
  const save = () => {
    if (!(form.amount > 0)) return showToast('Amount must be greater than zero');
    if (!form.accountId) return showToast('Select an account');
    if (form.type === 'transfer' && (!form.toAccountId || form.toAccountId === form.accountId))
      return showToast('Select a valid destination account');
    const exists = state.transactions.some((t) => t.id === form.id);
    patch('accounting', {
      ...state,
      transactions: exists
        ? state.transactions.map((t) => (t.id === form.id ? form : t))
        : [form, ...state.transactions],
    });
    onClose();
    showToast(exists ? 'Transaction updated' : 'Transaction saved');
  };

  return (
    <Sheet open={open} onClose={onClose} title={value ? 'Edit transaction' : 'New transaction'}>
      <div className="editor-fields">
        <Segmented
          value={form.type}
          onChange={(t) => setForm({ ...form, type: t as TxnType, categoryId: state.categories.find((c) => c.kind === t)?.id ?? form.categoryId })}
          options={[
            { id: 'expense', label: 'Expense' }, { id: 'income', label: 'Income' }, { id: 'transfer', label: 'Transfer' },
          ]}
        />
        <input
          className="n-input amount-input" type="number" inputMode="decimal" placeholder="0.00"
          value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
        />
        {form.type !== 'transfer' && (
          <select className="n-input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select className="n-input" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
          <option value="">Select account…</option>
          {state.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {form.type === 'transfer' && (
          <select className="n-input" value={form.toAccountId} onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}>
            <option value="">Destination account…</option>
            {state.accounts.filter((a) => a.id !== form.accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <input className="n-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="n-input" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button className="n-btn accent" onClick={save}>Save transaction</button>
      </div>
    </Sheet>
  );
}

function blankTxn(state: AccountingState): Transaction {
  return {
    id: uid(),
    type: 'expense',
    amount: 0,
    categoryId: state.categories.find((c) => c.kind === 'expense')?.id ?? state.categories[0]?.id ?? '',
    accountId: state.accounts[0]?.id ?? '',
    note: '',
    date: new Date().toISOString().slice(0, 10),
    createdAt: Date.now(),
  };
}

// ── Reports ──────────────────────────────────────────────────
function Reports() {
  const state = useData((s) => s.accounting);
  const money = useMoney();
  const [mode, setMode] = useState<'monthly' | 'yearly'>('monthly');
  const series = monthlySeries(state, mode === 'monthly' ? 6 : 12);
  const expenseCats = byCategory(state, 'expense');
  const incomeCats = byCategory(state, 'income');
  const expTotal = expenseCats.reduce((s, c) => s + c.amount, 0);
  const balanceSeries = series.reduce<{ label: string; bal: number }[]>((acc, s) => {
    const prev = acc[acc.length - 1]?.bal ?? state.accounts.reduce((x, a) => x + a.initialBalance, 0);
    acc.push({ label: s.label, bal: prev + s.income - s.expense });
    return acc;
  }, []);
  const maxBal = Math.max(1, ...balanceSeries.map((b) => Math.abs(b.bal)));

  return (
    <div>
      <header className="acc-head"><h1>Reports</h1></header>
      <div className="range-chips">
        <Segmented
          value={mode}
          onChange={(m) => setMode(m as typeof mode)}
          options={[{ id: 'monthly', label: '6 months' }, { id: 'yearly', label: '12 months' }]}
        />
        <button className="n-btn" onClick={() => download('transactions.csv', toCSV(state), 'text/csv')}>
          <FileDown size={15} /> CSV
        </button>
      </div>
      <div className="n-card chart-card">
        <div className="chart-title"><strong>Balance trend</strong></div>
        <div className="line-chart">
          {balanceSeries.map((b, i) => (
            <div key={i} className="line-col" style={{ height: `${Math.max(6, (Math.abs(b.bal) / maxBal) * 100)}%`, background: b.bal >= 0 ? 'var(--accent)' : '#ff453a' }} title={`${b.label}: ${money(b.bal)}`}>
              <small>{b.label}</small>
            </div>
          ))}
        </div>
      </div>
      <p className="n-section-title">Expenses by category</p>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {expenseCats.length === 0 && <div className="n-list-row"><span className="row-text"><span>No expenses recorded</span></span></div>}
        {expenseCats.map(({ category, amount }) => (
          <div className="n-list-row" key={category!.id}>
            <span className="txn-cat" style={{ background: category!.color, color: '#fff' }}>{category!.name[0]}</span>
            <span className="row-text">
              <span>{category!.name}</span>
              <span className="usage-bar"><i style={{ width: `${(amount / Math.max(1, expTotal)) * 100}%`, background: category!.color }} /></span>
            </span>
            <strong>{money(amount)}</strong>
          </div>
        ))}
      </div>
      <p className="n-section-title">Income by category</p>
      <div className="n-list-group" style={{ margin: '0 12px 16px' }}>
        {incomeCats.length === 0 && <div className="n-list-row"><span className="row-text"><span>No income recorded</span></span></div>}
        {incomeCats.map(({ category, amount }) => (
          <div className="n-list-row" key={category!.id}>
            <span className="txn-cat" style={{ background: category!.color, color: '#fff' }}>{category!.name[0]}</span>
            <span className="row-text"><span>{category!.name}</span></span>
            <strong className="pos">{money(amount)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────
function SettingsTab({ onSample }: { onSample: () => void }) {
  const state = useData((s) => s.accounting);
  const patch = useData((s) => s.patch);
  const showToast = useOS((s) => s.showToast);
  const [newCat, setNewCat] = useState('');
  const [confirmWipe, setConfirmWipe] = useState(false);
  const set = (p: Partial<AccountingState>) => patch('accounting', { ...state, ...p });

  const addCategory = () => {
    if (!newCat.trim()) return;
    const cat: Category = {
      id: uid(), name: newCat.trim(), kind: 'expense', icon: 'tag',
      color: ['#D71921', '#2f7cf6', '#30b455', '#8b5cf6', '#f2711c'][state.categories.length % 5],
    };
    set({ categories: [...state.categories, cat] });
    setNewCat('');
  };

  return (
    <div>
      <header className="acc-head"><h1>Settings</h1></header>
      <p className="n-section-title">Currency</p>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        <div className="n-list-row">
          <span className="row-text"><span>Display currency</span></span>
          <select className="n-input mini-select" value={state.currency} onChange={(e) => set({ currency: e.target.value })}>
            {Object.entries(CURRENCIES).map(([id, c]) => <option key={id} value={id}>{id} · {c.symbol}</option>)}
          </select>
        </div>
        <div className="n-list-row">
          <span className="row-text"><span>Date format</span></span>
          <select
            className="n-input mini-select"
            value={state.dateFormat}
            onChange={(e) => set({ dateFormat: e.target.value as AccountingState['dateFormat'] })}
          >
            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
            <option value="dd/mm/yyyy">DD/MM/YYYY</option>
            <option value="mm/dd/yyyy">MM/DD/YYYY</option>
          </select>
        </div>
      </div>

      <p className="n-section-title">Categories</p>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        {state.categories.map((c) => (
          <div className="n-list-row" key={c.id}>
            <span className="txn-cat" style={{ background: c.color, color: '#fff' }}>{c.name[0]}</span>
            <span className="row-text"><span>{c.name}</span><small>{c.kind}</small></span>
            <button
              className="inline-icon danger"
              onClick={() => {
                if (state.transactions.some((t) => t.categoryId === c.id)) return showToast('Category is used by transactions');
                set({ categories: state.categories.filter((x) => x.id !== c.id) });
              }}
              aria-label="Delete category"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="cat-add">
        <input className="n-input" placeholder="New expense category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
        <button className="n-btn accent" onClick={addCategory}><Plus size={15} /></button>
      </div>

      <p className="n-section-title">Data</p>
      <div className="n-list-group" style={{ margin: '0 12px' }}>
        <div className="n-list-row" onClick={() => download('accounting-backup.json', JSON.stringify(state, null, 2), 'application/json')}>
          <span className="row-text"><span>Export data (JSON)</span><small>Download a backup</small></span>
        </div>
        <div className="n-list-row" onClick={() => set({ ...sampleSeed(state) })}>
          <span className="row-text"><span>Load sample transactions</span><small>Adds demo income & expenses</small></span>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <button className="n-btn danger" style={{ width: '100%' }} onClick={() => setConfirmWipe(true)}>
          <Trash2 size={15} /> Erase all accounting data
        </button>
      </div>
      <ConfirmDialog
        open={confirmWipe}
        title="Erase everything?"
        text="All accounts and transactions in this app will be deleted permanently."
        danger
        confirmLabel="Erase"
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => {
          set({ accounts: [], transactions: [] });
          setConfirmWipe(false);
          onSample();
          showToast('Accounting data erased');
        }}
      />
    </div>
  );
}
