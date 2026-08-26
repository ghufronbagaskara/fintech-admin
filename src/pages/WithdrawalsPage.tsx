import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import type { Withdrawal } from '../lib/types'
import { SkelRows } from '../components/Skeleton'

export function WithdrawalsPage() {
  const [rows, setRows] = useState<Withdrawal[]>([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    let q = supabase.from('withdrawal').select('*').order('requested_at', { ascending: false })
    if (statusFilter) q = q.eq('status', statusFilter)
    const { data } = await q
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function setStatus(w: Withdrawal, status: Withdrawal['status']) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('withdrawal')
      .update({ status, processed_at: new Date().toISOString(), admin_email: user?.email ?? null })
      .eq('id', w.id)
    if (!error) {
      await logAudit(status, 'withdrawal', w.id, { merchant_id: w.merchant_id, amount: w.amount })
      load()
    }
  }

  return (
    <div>
      <h1>Withdrawal</h1>
      <p className="text-dim">
        Table baru, terpisah dari app Kotlin (yang saat ini cair instan lewat RPC tanpa approval). Merchant/admin input request di sini, admin
        approve/reject/complete manual.
      </p>

      <div className="filter-row">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Merchant</th>
            <th>Jumlah</th>
            <th>Rekening Tujuan</th>
            <th>Status</th>
            <th>Diminta</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading && <SkelRows rows={4} cols={6} />}
          {!loading && rows.map((w) => (
            <tr key={w.id}>
              <td>{w.merchant_id}</td>
              <td>Rp {w.amount.toLocaleString('id-ID')}</td>
              <td>
                {w.bank_name} &middot; {w.bank_account_number} &middot; {w.bank_account_name}
              </td>
              <td>
                <span className={`badge badge-${w.status === 'rejected' ? 'red' : w.status === 'pending' ? 'gray' : 'green'}`}>{w.status}</span>
              </td>
              <td>{new Date(w.requested_at).toLocaleString('id-ID')}</td>
              <td className="actions">
                {w.status === 'pending' && (
                  <>
                    <button className="primary" onClick={() => setStatus(w, 'approved')}>Approve</button>
                    <button className="danger" onClick={() => setStatus(w, 'rejected')}>
                      Reject
                    </button>
                  </>
                )}
                {w.status === 'approved' && <button className="primary" onClick={() => setStatus(w, 'completed')}>Tandai Selesai</button>}
              </td>
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={6} className="text-dim">
                Belum ada data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
