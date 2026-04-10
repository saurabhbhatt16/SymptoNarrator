import { Outlet } from 'react-router-dom'
import AdminNavbar from '../admin/AdminNavbar'

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminNavbar />
      <Outlet />
    </div>
  )
}

export default AdminLayout
