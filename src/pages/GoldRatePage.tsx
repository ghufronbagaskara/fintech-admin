import { useEffect, useState, type FormEvent } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import type { GoldPrice } from '../lib/types'
import { SkelPanel, SkelStatCards } from '../components/Skeleton'

export function GoldRatePage() {
  const [history, setHistory] = useState<GoldPrice[]>([])
  const [price, setPrice] = useState('')
  const [buyback, setBuyback] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('gold_price').select('*').order('updated_at', { ascending: false }).limit(30)
    setHistory(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const latest = history[0]
  const spread = latest?.buyback_price ? latest.price - Number(latest.buyback_price) : null
  const spreadPercent = spread !== null && latest ? (spread / latest.price) * 100 : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const p = Number(price)
    const b = Number(buyback)
    if (!p || p <= 0) return setError('Harga jual harus lebih dari 0')
    if (!b || b <= 0) return setError('Harga buyback harus lebih dari 0')
    if (b >= p) return setError('Harga buyback harus lebih kecil dari harga jual')
    const jump = latest ? Math.abs(p - latest.price) / latest.price : 0
    if (jump > 0.05) return setError(`Perubahan harga ${(jump * 100).toFixed(1)}% terlalu besar dari harga terakhir (>5%). Cek kembali.`)

    setSubmitting(true)
    const { data, error } = await supabase.from('gold_price').insert({ price: p, buyback_price: b }).select().single()
    setSubmitting(false)
    if (error) return setError(error.message)
    await logAudit('create', 'gold_price', data.id, { price: p, buyback_price: b })
    setPrice('')
    setBuyback('')
    load()
  }

  const chartData = [...history].reverse().map((h) => ({
    date: new Date(h.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    price: h.price,
    buyback: h.buyback_price ?? null,
  }))

  if (loading) {
    return (
      <div>
        <h1>Gold Rate Control</h1>
        <SkelStatCards count={3} />
        <SkelPanel height={70} />
        <SkelPanel height={280} />
      </div>
    )
  }

  return (
    <div>
      <h1>Gold Rate Control</h1>

      <div className="card-row">
        <div className="stat-card">
          <div className="stat-label">Harga Jual Terkini</div>
          <div className="stat-value">Rp {latest ? latest.price.toLocaleString('id-ID') : '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Harga Buyback Terkini</div>
          <div className="stat-value">Rp {latest?.buyback_price ? Number(latest.buyback_price).toLocaleString('id-ID') : '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Spread Margin</div>
          <div className="stat-value">{spreadPercent !== null ? `${spreadPercent.toFixed(2)}%` : '-'}</div>
        </div>
      </div>

      <div className="panel">
        <h2>Update Harga Harian</h2>
        <form onSubmit={handleSubmit} className="inline-form">
          <label>
            Harga Jual (Rp)
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2725000" />
          </label>
          <label>
            Harga Buyback (Rp)
            <input type="number" value={buyback} onChange={(e) => setBuyback(e.target.value)} placeholder="2585000" />
          </label>
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Menyimpan...' : 'Simpan Harga'}
          </button>
        </form>
        {error && <div className="error-text">{error}</div>}
      </div>

      <div className="panel">
        <h2>Riwayat Harga (30 terakhir)</h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-dim)" />
              <YAxis stroke="var(--text-dim)" tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)' }} />
              <Line type="monotone" dataKey="price" stroke="#f0c735" name="Jual" dot={false} />
              <Line type="monotone" dataKey="buyback" stroke="#1e9f5a" name="Buyback" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Harga Jual</th>
            <th>Buyback</th>
            <th>Spread</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => {
            const s = h.buyback_price ? h.price - Number(h.buyback_price) : null
            return (
              <tr key={h.id}>
                <td>{new Date(h.updated_at).toLocaleString('id-ID')}</td>
                <td>Rp {h.price.toLocaleString('id-ID')}</td>
                <td>{h.buyback_price ? `Rp ${Number(h.buyback_price).toLocaleString('id-ID')}` : '-'}</td>
                <td>{s !== null ? `Rp ${s.toLocaleString('id-ID')} (${((s / h.price) * 100).toFixed(2)}%)` : '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
