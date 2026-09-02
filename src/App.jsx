import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { Splash } from './components/brand/Splash.jsx'
import Launcher from './pages/Launcher.jsx'
import RestaurantMenu from './pages/RestaurantMenu.jsx'
import EcommerceMenu from './pages/EcommerceMenu.jsx'
import { EcomLayout } from './components/layout/EcomLayout.jsx'
import EcomOverview from './pages/ecom/Overview.jsx'
import EcomProducts from './pages/ecom/Products.jsx'
import EcomMarketing from './pages/ecom/Marketing.jsx'
import EcomFulfilment from './pages/ecom/Fulfilment.jsx'
import EcomReturns from './pages/ecom/Returns.jsx'
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
    <>
      <Splash />
      <Routes>
        {/* The entry point is the picker, never a dashboard chosen for you:
            business first, then the dashboard inside it. */}
        <Route index element={<Launcher />} />
        <Route path="restaurants" element={<RestaurantMenu />} />
        <Route path="ecommerce" element={<EcommerceMenu />} />
        <Route element={<EcomLayout />}>
          <Route path="ecommerce/overview" element={<EcomOverview />} />
          <Route path="ecommerce/products" element={<EcomProducts />} />
          <Route path="ecommerce/marketing" element={<EcomMarketing />} />
          <Route path="ecommerce/fulfilment" element={<EcomFulfilment />} />
          <Route path="ecommerce/returns" element={<EcomReturns />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
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
    </>
  )
}
