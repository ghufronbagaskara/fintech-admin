import { supabase } from './supabase'

export async function logAudit(action: string, targetTable: string, targetId: string | number | null, detail?: unknown) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('audit_log').insert({
    admin_email: user?.email ?? 'unknown',
    action,
    target_table: targetTable,
    target_id: targetId === null ? null : String(targetId),
    detail: detail ?? null,
  })
}
