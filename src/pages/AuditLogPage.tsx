import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AuditLog } from '../lib/types'
import { SkelRows } from '../components/Skeleton'

export function AuditLogPage() {
  const [rows, setRows] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1>Audit Log</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Admin</th>
            <th>Aksi</th>
            <th>Target</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {loading && <SkelRows rows={8} cols={5} />}
          {!loading &&
            rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString('id-ID')}</td>
                <td>{r.admin_email}</td>
                <td>{r.action}</td>
                <td>
                  {r.target_table}#{r.target_id}
                </td>
                <td className="text-dim">{r.detail ? JSON.stringify(r.detail) : '-'}</td>
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-dim">
                Belum ada aktivitas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
