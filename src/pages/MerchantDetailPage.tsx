import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Balance, Installment, Merchant, Transaksi } from '../lib/types'
import { SkelLine, SkelRows, SkelStatCards } from '../components/Skeleton'

export function MerchantDetailPage() {
  const { id } = useParams()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [transactions, setTransactions] = useState<Transaksi[]>([])
  const [installment, setInstallment] = useState<Installment | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      const [mRes, bRes, tRes, iRes] = await Promise.all([
        supabase.from('merchant').select('*').eq('id', id).single(),
        supabase.from('balance').select('*').eq('merchant_id', id).maybeSingle(),
        supabase.from('transaksi').select('*').eq('merchant_id', id).order('created_at', { ascending: false }).limit(50),
        supabase.from('installment').select('*').eq('merchant_id', id).eq('is_active', true).maybeSingle(),
      ])
      setMerchant(mRes.data)
      setBalance(bRes.data)
      setTransactions(tRes.data ?? [])
      setInstallment(iRes.data)
    }
    load()
  }, [id])

  if (!merchant) {
    return (
      <div>
        <Link to="/merchants" className="back-link">
          &larr; Kembali
        </Link>
        <SkelLine width={220} height={24} />
        <div style={{ height: 8 }} />
        <SkelLine width={320} height={13} />
        <div style={{ height: 24 }} />
        <SkelStatCards count={3} />
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipe</th>
              <th>Judul</th>
              <th>Total</th>
              <th>MDR</th>
              <th>Waktu</th>
            </tr>
          </thead>
          <tbody>
            <SkelRows rows={5} cols={6} />
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <Link to="/merchants" className="back-link">
        &larr; Kembali
      </Link>
      <h1>{merchant.shop_name}</h1>
      <p className="text-dim">
        @{merchant.username} &middot; {merchant.owner_name} &middot; {merchant.business_type || '-'}
      </p>

      <div className="card-row">
        <div className="stat-card">
          <div className="stat-label">Saldo Utama</div>
          <div className="stat-value">Rp {balance ? balance.main_balance.toLocaleString('id-ID') : '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Saldo Emas</div>
          <div className="stat-value">{balance ? balance.gold_balance.toFixed(4) : '-'} gr</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-value">{merchant.is_suspended ? 'Suspended' : merchant.is_verified ? 'Verified' : 'Unverified'}</div>
        </div>
      </div>

      {installment && (
        <div className="panel">
          <h2>Cicilan Emas Aktif</h2>
          <p>
            Target {installment.target_weight} gr &middot; Split {installment.split_percentage}% &middot; Terkumpul Rp{' '}
            {installment.accumulated_amount.toLocaleString('id-ID')} / Rp {installment.total_installment_amount.toLocaleString('id-ID')} (
            {installment.accumulated_gold_weight.toFixed(4)} gr)
          </p>
        </div>
      )}

      <div className="panel">
        <h2>Bank Account (Kotlin app)</h2>
        <p>
          {merchant.bank_name || '-'} &middot; {merchant.bank_account_number || '-'} &middot; {merchant.bank_account_name || '-'}
        </p>
      </div>

      <h2>Transaksi Terakhir</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tipe</th>
            <th>Judul</th>
            <th>Total</th>
            <th>MDR</th>
            <th>Waktu</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.type}</td>
              <td>{t.title}</td>
              <td>Rp {t.total_amount.toLocaleString('id-ID')}</td>
              <td>Rp {t.mdr_fee.toLocaleString('id-ID')}</td>
              <td>{new Date(t.created_at).toLocaleString('id-ID')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
