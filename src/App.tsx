import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { GoldRatePage } from './pages/GoldRatePage'
import { MerchantsPage } from './pages/MerchantsPage'
import { MerchantDetailPage } from './pages/MerchantDetailPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AuditLogPage } from './pages/AuditLogPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/gold-rate" element={<GoldRatePage />} />
              <Route path="/merchants" element={<MerchantsPage />} />
              <Route path="/merchants/:id" element={<MerchantDetailPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/audit-log" element={<AuditLogPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
