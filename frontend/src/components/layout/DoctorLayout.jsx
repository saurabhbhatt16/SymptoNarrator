import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import DashboardNavbar from './DashboardNavbar'

function DoctorLayout() {
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNavbar title="MediSense Healthcare" subtitle="Doctor Dashboard" userName={user?.name} namePrefix="Dr. " />
      <Outlet />
    </div>
  )
}

export default DoctorLayout