import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import AdminNavbar from '../../components/admin/AdminNavbar'
import SummaryCards from '../../components/admin/SummaryCards'
import Charts from '../../components/admin/Charts'
import Modals from '../../components/admin/Modals'
import {
  getAdminAppointmentsApi,
  getAdminDoctorsApi,
  getAdminPendingDoctorsApi,
  getAdminStatsApi,
  getAdminUsersApi,
  rejectAdminDoctorApi,
  verifyAdminDoctorApi,
  deleteAdminUserApi,
} from '../../services/admin.service'

const INITIAL_STATS = {
  totalPatients: 0,
  totalDoctors: 0,
  totalAppointments: 0,
  totalPendingDoctors: 0,
  monthlyPatientRegistrations: [],
  monthlyDoctorRegistrations: [],
  monthlyAppointmentsCreated: [],
  appointmentOutcome: [],
}

function AdminDashboard() {
  const [stats, setStats] = useState(INITIAL_STATS)
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [pendingDoctors, setPendingDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openModalType, setOpenModalType] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const [statsResponse, usersResponse, doctorsResponse, pendingDoctorsResponse, appointmentsResponse] = await Promise.all([
          getAdminStatsApi(),
          getAdminUsersApi(),
          getAdminDoctorsApi(),
          getAdminPendingDoctorsApi(),
          getAdminAppointmentsApi(),
        ])

        setStats({ ...INITIAL_STATS, ...statsResponse })
        setPatients((usersResponse.data || []).filter((user) => user.role === 'patient'))
        setDoctors((doctorsResponse.data || []).filter((doctor) => doctor.isVerified))
        setPendingDoctors((pendingDoctorsResponse.data || []).filter((doctor) => !doctor.isVerified))
        setAppointments(appointmentsResponse.data || [])
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load admin dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const reloadDashboard = async () => {
    const [statsResponse, usersResponse, doctorsResponse, pendingDoctorsResponse, appointmentsResponse] = await Promise.all([
      getAdminStatsApi(),
      getAdminUsersApi(),
      getAdminDoctorsApi(),
      getAdminPendingDoctorsApi(),
      getAdminAppointmentsApi(),
    ])

    setStats({ ...INITIAL_STATS, ...statsResponse })
    setPatients((usersResponse.data || []).filter((user) => user.role === 'patient'))
    setDoctors((doctorsResponse.data || []).filter((doctor) => doctor.isVerified))
    setPendingDoctors((pendingDoctorsResponse.data || []).filter((doctor) => !doctor.isVerified))
    setAppointments(appointmentsResponse.data || [])
  }

  const handleVerifyDoctor = async (doctorId) => {
    setActionLoadingId(doctorId)
    setError('')
    try {
      await verifyAdminDoctorApi(doctorId)
      await reloadDashboard()
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to verify doctor')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRejectDoctor = async (doctorId) => {
    setActionLoadingId(doctorId)
    setError('')
    try {
      await rejectAdminDoctorApi(doctorId)
      await reloadDashboard()
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to reject doctor')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) {
      return
    }
    setActionLoadingId(userId)
    setError('')
    try {
      await deleteAdminUserApi(userId)
      toast.success('User deleted successfully')
      await reloadDashboard()
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to delete user'
      setError(message)
      toast.error(message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to permanently delete this doctor?')) {
      return
    }
    setActionLoadingId(doctorId)
    setError('')
    try {
      await rejectAdminDoctorApi(doctorId)
      toast.success('Doctor deleted successfully')
      await reloadDashboard()
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Failed to delete doctor'
      setError(message)
      toast.error(message)
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AdminNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold text-slate-800">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">Platform summary, interactive analytics, and data insights.</p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 flex items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <SummaryCards stats={stats} onCardClick={setOpenModalType} />
            </div>
            <Charts stats={stats} />
          </>
        )}
      </main>

      <Modals
        openType={openModalType}
        onClose={() => setOpenModalType('')}
        patients={patients}
        doctors={doctors}
        pendingDoctors={pendingDoctors}
        appointments={appointments}
        onVerifyDoctor={handleVerifyDoctor}
        onRejectDoctor={handleRejectDoctor}
        onDeleteUser={handleDeleteUser}
        onDeleteDoctor={handleDeleteDoctor}
        actionLoadingId={actionLoadingId}
      />
    </div>
  )
}

export default AdminDashboard
