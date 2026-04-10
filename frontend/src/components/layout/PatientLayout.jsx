import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import DashboardNavbar from './DashboardNavbar'

function PatientLayout() {
  const { user } = useSelector((state) => state.auth)
  const isAdmin = user?.role === 'admin'

  return (
    <div className="min-h-screen bg-slate-100">
      {!isAdmin && <DashboardNavbar title="MediSense Healthcare" subtitle="Patient Dashboard" userName={user?.name} />}
      <Outlet />
    </div>
  )
}

export default PatientLayout