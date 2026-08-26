import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaksi } from '../lib/types'
import { SkelRows } from '../components/Skeleton'

const TYPES = ['QRIS_IN', 'GOLD_BUY', 'GOLD_SELL']

export function TransactionsPage() {
  const [rows, setRows] = useState<Transaksi[]>([])
  const [type, setType] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    let q = supabase.from('transaksi').select('*').order('created_at', { ascending: false }).limit(200)
    if (type) q = q.eq('type', type)
    if (merchantId) q = q.eq('merchant_id', Number(merchantId))
    if (from) q = q.gte('created_at', from)
    if (to) q = q.lte('created_at', to + 'T23:59:59')
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exportCsv() {
    const header = ['id', 'merchant_id', 'type', 'title', 'total_amount', 'main_amount', 'gold_amount', 'gold_weight_added', 'mdr_fee', 'created_at']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push(header.map((h) => JSON.stringify((r as unknown as Record<string, unknown>)[h] ?? '')).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transaksi-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1>Monitoring Transaksi</h1>
      <div className="filter-row">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Semua Tipe</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input placeholder="Merchant ID" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} style={{ width: 110 }} />
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="primary" onClick={load}>Filter</button>
        <button onClick={exportCsv}>Export CSV</button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Merchant</th>
            <th>Tipe</th>
            <th>Judul</th>
            <th>Total</th>
            <th>Emas (gr)</th>
            <th>MDR</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody>
          {loading && <SkelRows rows={8} cols={8} />}
          {!loading &&
            rows.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.merchant_id}</td>
                <td>{t.type}</td>
                <td>{t.title}</td>
                <td>Rp {t.total_amount.toLocaleString('id-ID')}</td>
                <td>{t.gold_weight_added.toFixed(4)}</td>
                <td>Rp {t.mdr_fee.toLocaleString('id-ID')}</td>
                <td>{new Date(t.created_at).toLocaleString('id-ID')}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
