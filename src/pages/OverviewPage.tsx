import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { SkelPanel, SkelStatCards } from '../components/Skeleton'

interface Stats {
  gmv: number
  txCount: number
  mdrRevenue: number
  merchantCount: number
  activeMerchantCount: number
  goldLiabilityWeight: number
  goldLiabilityValue: number
  dailyVolume: { date: string; amount: number }[]
}

export function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const [txRes, merchantRes, balanceRes, priceRes] = await Promise.all([
        supabase.from('transaksi').select('total_amount, mdr_fee, created_at').order('created_at', { ascending: false }).limit(2000),
        supabase.from('merchant').select('id, is_suspended', { count: 'exact' }),
        supabase.from('balance').select('gold_balance'),
        supabase.from('gold_price').select('price, buyback_price').order('updated_at', { ascending: false }).limit(1),
      ])

      const txs = txRes.data ?? []
      const gmv = txs.reduce((sum, t) => sum + Math.abs(t.total_amount), 0)
      const mdrRevenue = txs.reduce((sum, t) => sum + (t.mdr_fee ?? 0), 0)

      const merchants = merchantRes.data ?? []
      const activeMerchantCount = merchants.filter((m) => !m.is_suspended).length

      const goldLiabilityWeight = (balanceRes.data ?? []).reduce((sum, b) => sum + (b.gold_balance ?? 0), 0)
      const latestPrice = priceRes.data?.[0]
      const buybackRate = latestPrice ? Number(latestPrice.buyback_price ?? latestPrice.price * 0.9486) : 0
      const goldLiabilityValue = goldLiabilityWeight * buybackRate

      const byDay = new Map<string, number>()
      for (const t of txs) {
        const day = new Date(t.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        byDay.set(day, (byDay.get(day) ?? 0) + Math.abs(t.total_amount))
      }
      const dailyVolume = Array.from(byDay.entries())
        .map(([date, amount]) => ({ date, amount }))
        .slice(0, 14)
        .reverse()

      setStats({
        gmv,
        txCount: txs.length,
        mdrRevenue,
        merchantCount: merchants.length,
        activeMerchantCount,
        goldLiabilityWeight,
        goldLiabilityValue,
        dailyVolume,
      })
    }
    load()
  }, [])

  if (!stats) {
    return (
      <div>
        <h1>Overview</h1>
        <SkelStatCards count={5} />
        <SkelPanel height={280} />
      </div>
    )
  }

  return (
    <div>
      <h1>Overview</h1>
      <div className="card-row">
        <div className="stat-card">
          <div className="stat-label">GMV</div>
          <div className="stat-value">Rp {stats.gmv.toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transaksi</div>
          <div className="stat-value">{stats.txCount.toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Revenue MDR</div>
          <div className="stat-value">Rp {stats.mdrRevenue.toLocaleString('id-ID')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Merchant Aktif</div>
          <div className="stat-value">{stats.activeMerchantCount} / {stats.merchantCount}</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-label">Gold Liability</div>
          <div className="stat-value">Rp {Math.round(stats.goldLiabilityValue).toLocaleString('id-ID')}</div>
          <div className="stat-sub">{stats.goldLiabilityWeight.toFixed(4)} gram beredar</div>
        </div>
      </div>

      <div className="panel">
        <h2>Volume Transaksi Harian</h2>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={stats.dailyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-dim)" />
              <YAxis stroke="var(--text-dim)" tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
              <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)' }} />
              <Bar dataKey="amount" fill="#3676e0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
