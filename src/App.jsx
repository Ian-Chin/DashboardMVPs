import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profitability from './pages/Profitability.jsx'
import Menu from './pages/Menu.jsx'
import Inventory from './pages/Inventory.jsx'
import Labor from './pages/Labor.jsx'
import Purchasing from './pages/Purchasing.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="profitability" element={<Profitability />} />
        <Route path="menu" element={<Menu />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="labor" element={<Labor />} />
        <Route path="purchasing" element={<Purchasing />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
