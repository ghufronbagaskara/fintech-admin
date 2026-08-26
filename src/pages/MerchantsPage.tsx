import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { logAudit } from '../lib/audit'
import type { Merchant } from '../lib/types'
import { SkelRows } from '../components/Skeleton'

export function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [search, setSearch] = useState('')
  const [suspendTarget, setSuspendTarget] = useState<Merchant | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('merchant').select('*').order('id')
    setMerchants(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = merchants.filter((m) => {
    const q = search.toLowerCase()
    return m.shop_name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q) || m.owner_name.toLowerCase().includes(q)
  })

  async function toggleVerify(m: Merchant) {
    const { error } = await supabase.from('merchant').update({ is_verified: !m.is_verified }).eq('id', m.id)
    if (!error) {
      await logAudit(m.is_verified ? 'unverify' : 'verify', 'merchant', m.id)
      load()
    }
  }

  async function unsuspend(m: Merchant) {
    const { error } = await supabase.from('merchant').update({ is_suspended: false, suspended_reason: null, suspended_at: null }).eq('id', m.id)
    if (!error) {
      await logAudit('unsuspend', 'merchant', m.id)
      load()
    }
  }

  async function confirmSuspend() {
    if (!suspendTarget) return
    const { error } = await supabase
      .from('merchant')
      .update({ is_suspended: true, suspended_reason: reason || null, suspended_at: new Date().toISOString() })
      .eq('id', suspendTarget.id)
    if (!error) {
      await logAudit('suspend', 'merchant', suspendTarget.id, { reason })
      setSuspendTarget(null)
      setReason('')
      load()
    }
  }

  return (
    <div>
      <h1>Merchant Management</h1>
      <input className="search-input" placeholder="Cari nama toko, username, atau pemilik..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <table className="table">
        <thead>
          <tr>
            <th>Toko</th>
            <th>Pemilik</th>
            <th>Tipe</th>
            <th>Verifikasi</th>
            <th>UMI</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading && <SkelRows rows={5} cols={7} />}
          {!loading && filtered.map((m) => (
            <tr key={m.id}>
              <td>
                <Link to={`/merchants/${m.id}`}>{m.shop_name}</Link>
                <div className="text-dim">@{m.username}</div>
              </td>
              <td>{m.owner_name}</td>
              <td>{m.business_type || '-'}</td>
              <td>
                <span className={m.is_verified ? 'badge badge-green' : 'badge badge-gray'}>{m.is_verified ? 'Verified' : 'Unverified'}</span>
              </td>
              <td>{m.is_umi ? 'Ya' : 'Tidak'}</td>
              <td>
                <span className={m.is_suspended ? 'badge badge-red' : 'badge badge-green'}>{m.is_suspended ? 'Suspended' : 'Active'}</span>
              </td>
              <td className="actions">
                <button onClick={() => toggleVerify(m)}>{m.is_verified ? 'Unverify' : 'Verify'}</button>
                {m.is_suspended ? (
                  <button onClick={() => unsuspend(m)}>Unsuspend</button>
                ) : (
                  <button className="danger" onClick={() => setSuspendTarget(m)}>
                    Suspend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {suspendTarget && (
        <div className="modal-overlay" onClick={() => setSuspendTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Suspend {suspendTarget.shop_name}?</h2>
            <p className="text-dim">Merchant tidak akan bisa login/bertransaksi setelah backend app menerapkan pengecekan is_suspended.</p>
            <label>
              Alasan (opsional)
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </label>
            <div className="modal-actions">
              <button onClick={() => setSuspendTarget(null)}>Batal</button>
              <button className="danger" onClick={confirmSuspend}>
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
