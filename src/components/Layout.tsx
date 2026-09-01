import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/', label: 'Overview', end: true },
  { to: '/gold-rate', label: 'Gold Rate' },
  { to: '/merchants', label: 'Merchants' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/audit-log', label: 'Audit Log' },
]

export function Layout() {
  const { session } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.svg" alt="" width={18} height={18} />
          Qigo Admin
        </div>
        <nav>
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-email">{session?.user.email}</div>
          <button onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
