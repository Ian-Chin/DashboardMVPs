import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <div className="min-h-full">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[248px]">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main key={pathname} className="animate-fade-up px-4 py-5 sm:px-6 sm:py-6 print-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
