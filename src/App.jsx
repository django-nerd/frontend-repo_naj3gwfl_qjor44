import React, { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { ArrowRight, FileText, Users, FileSignature, Receipt, Upload, Mail, Plus, Filter } from 'lucide-react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function StatCard({ title, value, accent }) {
  return (
    <div className="p-4 rounded-xl bg-white/70 backdrop-blur border border-black/5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: accent }}>{value}</div>
    </div>
  )
}

function Section({ title, icon, children, actions }) {
  const Icon = icon
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-black/5 shadow-sm">
      <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-700"><Icon size={18} /></div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function TextInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none" />
    </label>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}

function useFetch(url, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(url).then(r => r.json()).then(d => { if (mounted) { setData(d); setLoading(false) } }).catch(e => { setError(e); setLoading(false) })
    return () => { mounted = false }
  }, deps) // eslint-disable-line
  return { data, loading, error }
}

function Dashboard() {
  const { data: summary, loading } = useFetch(`${API_BASE}/api/dashboard-summary`, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="POs" value={loading ? '…' : summary?.totals?.purchase_orders ?? 0} accent="#0ea5e9" />
      <StatCard title="Invoices" value={loading ? '…' : summary?.totals?.invoices ?? 0} accent="#6366f1" />
      <StatCard title="Paid" value={loading ? '…' : summary?.totals?.paid_invoices ?? 0} accent="#10b981" />
      <StatCard title="Outstanding" value={loading ? '…' : `₹${summary?.totals?.outstanding_amount ?? 0}`} accent="#ef4444" />
    </div>
  )
}

function Customers() {
  const { data: customers, loading, error } = useFetch(`${API_BASE}/api/customers`, [])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [industry, setIndustry] = useState('')

  const submit = async () => {
    if (!name) return
    await fetch(`${API_BASE}/api/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, industry }) })
    setName(''); setEmail(''); setIndustry('')
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TextInput label="Customer Name" value={name} onChange={setName} placeholder="Acme Corp" />
        <TextInput label="Email" value={email} onChange={setEmail} placeholder="ops@acme.com" />
        <TextInput label="Industry" value={industry} onChange={setIndustry} placeholder="Fintech" />
      </div>
      <button onClick={submit} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        <Plus size={16} /> Add Customer
      </button>

      <div className="grid md:grid-cols-3 gap-3">
        {(customers || []).map(c => (
          <div key={c.id} className="p-4 rounded-xl border bg-white/70 backdrop-blur">
            <div className="font-semibold text-gray-800">{c.name}</div>
            <div className="text-sm text-gray-500">{c.email || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Pos() {
  const { data: customers } = useFetch(`${API_BASE}/api/customers`, [])
  const [customerId, setCustomerId] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [amount, setAmount] = useState('')
  const { data: pos } = useFetch(`${API_BASE}/api/pos${customerId ? `?customer_id=${customerId}` : ''}`, [customerId])

  const submit = async () => {
    if (!poNumber || !customerId) return
    await fetch(`${API_BASE}/api/pos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ po_number: poNumber, customer_id: customerId, amount: parseFloat(amount || '0'), status: 'Active' }) })
    setPoNumber(''); setAmount('')
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Customer</span>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="px-3 py-2 rounded-lg border">
            <option value="">Select customer</option>
            {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <TextInput label="PO Number" value={poNumber} onChange={setPoNumber} />
        <TextInput label="Amount" type="number" value={amount} onChange={setAmount} />
      </div>
      <button onClick={submit} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
        <Plus size={16} /> Add PO
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {(pos || []).map(p => (
          <div key={p.id} className="p-4 rounded-xl border bg-white/70">
            <div className="font-semibold">{p.po_number} • <span className="text-gray-500">{p.status}</span></div>
            <div className="text-sm text-gray-600">Amount: ₹{p.amount} | Billed: ₹{p.billed_amount} | Balance: ₹{p.po_balance}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Invoices() {
  const { data: customers } = useFetch(`${API_BASE}/api/customers`, [])
  const { data: pos } = useFetch(`${API_BASE}/api/pos`, [])
  const [customerId, setCustomerId] = useState('')
  const [poId, setPoId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const { data: invoices } = useFetch(`${API_BASE}/api/invoices${poId ? `?po_id=${poId}` : ''}`, [poId])

  const submit = async () => {
    if (!invoiceNumber || !poId || !customerId) return
    await fetch(`${API_BASE}/api/invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_number: invoiceNumber, po_id: poId, customer_id: customerId, amount: parseFloat(amount || '0') }) })
    setInvoiceNumber(''); setAmount('')
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-5 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Customer</span>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="px-3 py-2 rounded-lg border">
            <option value="">Select customer</option>
            {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">PO</span>
          <select value={poId} onChange={e => setPoId(e.target.value)} className="px-3 py-2 rounded-lg border">
            <option value="">Select PO</option>
            {(pos || []).map(p => <option key={p.id} value={p.id}>{p.po_number}</option>)}
          </select>
        </label>
        <TextInput label="Invoice Number" value={invoiceNumber} onChange={setInvoiceNumber} />
        <TextInput label="Amount" type="number" value={amount} onChange={setAmount} />
      </div>
      <button onClick={submit} className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700">
        <Plus size={16} /> Add Invoice
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {(invoices || []).map(inv => (
          <div key={inv.id} className="p-4 rounded-xl border bg-white/70">
            <div className="font-semibold">{inv.invoice_number} • <span className="text-gray-500">{inv.payment_status}</span></div>
            <div className="text-sm text-gray-600">Amount: ₹{inv.amount} | Received: ₹{inv.amount_received} | Balance: ₹{inv.balance_amount}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Agreements() {
  const { data: customers } = useFetch(`${API_BASE}/api/customers`, [])
  const [customerId, setCustomerId] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('Agreement')
  const [endDate, setEndDate] = useState('')
  const { data: agreements } = useFetch(`${API_BASE}/api/agreements`, [])

  const submit = async () => {
    if (!name || !customerId) return
    await fetch(`${API_BASE}/api/agreements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type, customer_id: customerId, end_date: endDate || null }) })
    setName(''); setEndDate('')
    setTimeout(() => window.location.reload(), 300)
  }

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-600">Customer</span>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="px-3 py-2 rounded-lg border">
            <option value="">Select customer</option>
            {(customers || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <TextInput label="Agreement Name" value={name} onChange={setName} />
        <Select label="Type" value={type} onChange={setType} options={["Agreement", "NDA"]} />
        <TextInput label="End Date" type="date" value={endDate} onChange={setEndDate} />
      </div>
      <button onClick={submit} className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700">
        <Plus size={16} /> Add Agreement
      </button>
      <div className="grid md:grid-cols-2 gap-3">
        {(agreements || []).map(a => (
          <div key={a.id} className="p-4 rounded-xl border bg-white/70">
            <div className="font-semibold">{a.name} • <span className="text-gray-500">{a.type}</span></div>
            <div className="text-sm text-gray-600">Status: {a.renewal_status} {a.end_date ? `• Ends ${a.end_date}` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 relative">
      <div className="absolute inset-x-0 top-0 h-[320px]">
        <Spline scene="https://prod.spline.design/8nsoLg1te84JZcE9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/60 to-white pointer-events-none" />
      </div>

      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between">
          <div className="text-slate-800">
            <div className="text-xs uppercase tracking-wider text-slate-500">Operations</div>
            <h1 className="text-2xl md:text-3xl font-semibold">Customer • PO • Invoice • Agreement Dashboard</h1>
          </div>
          <a href="#main" className="inline-flex items-center gap-2 text-blue-700 hover:gap-3 transition-all">Explore <ArrowRight size={16} /></a>
        </div>
      </header>

      <main id="main" className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <button onClick={() => setTab('dashboard')} className={`p-3 rounded-xl border bg-white/80 backdrop-blur flex items-center gap-2 ${tab==='dashboard'?'ring-2 ring-blue-200':''}`}><FileText size={16}/> Dashboard</button>
          <button onClick={() => setTab('customers')} className={`p-3 rounded-xl border bg-white/80 backdrop-blur flex items-center gap-2 ${tab==='customers'?'ring-2 ring-blue-200':''}`}><Users size={16}/> Customers</button>
          <button onClick={() => setTab('pos')} className={`p-3 rounded-xl border bg-white/80 backdrop-blur flex items-center gap-2 ${tab==='pos'?'ring-2 ring-blue-200':''}`}><Receipt size={16}/> POs</button>
          <button onClick={() => setTab('invoices')} className={`p-3 rounded-xl border bg-white/80 backdrop-blur flex items-center gap-2 ${tab==='invoices'?'ring-2 ring-blue-200':''}`}><FileText size={16}/> Invoices</button>
          <button onClick={() => setTab('agreements')} className={`p-3 rounded-xl border bg-white/80 backdrop-blur flex items-center gap-2 ${tab==='agreements'?'ring-2 ring-blue-200':''}`}><FileSignature size={16}/> Agreements</button>
        </div>

        <div className="mt-6 space-y-6">
          {tab === 'dashboard' && (
            <Section title="Overview" icon={FileText}>
              <Dashboard />
            </Section>
          )}

          {tab === 'customers' && (
            <Section title="Manage Customers" icon={Users}>
              <Customers />
            </Section>
          )}

          {tab === 'pos' && (
            <Section title="Manage Purchase Orders" icon={Receipt}>
              <Pos />
            </Section>
          )}

          {tab === 'invoices' && (
            <Section title="Manage Invoices" icon={FileText}>
              <Invoices />
            </Section>
          )}

          {tab === 'agreements' && (
            <Section title="Agreements & NDAs" icon={FileSignature}>
              <Agreements />
            </Section>
          )}
        </div>
      </main>
    </div>
  )
}
