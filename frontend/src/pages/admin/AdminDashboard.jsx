import { useCallback, useEffect, useState } from 'react'
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

const DASHBOARD_CACHE = {
  data: null,
  promise: null,
}

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

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && DASHBOARD_CACHE.data) {
      return DASHBOARD_CACHE.data
    }

    if (DASHBOARD_CACHE.promise) {
      return DASHBOARD_CACHE.promise
    }

    DASHBOARD_CACHE.promise = Promise.all([
      getAdminStatsApi(),
      getAdminUsersApi(),
      getAdminDoctorsApi(),
      getAdminPendingDoctorsApi(),
      getAdminAppointmentsApi(),
    ])
      .then(([statsResponse, usersResponse, doctorsResponse, pendingDoctorsResponse, appointmentsResponse]) => {
        const nextData = {
          stats: { ...INITIAL_STATS, ...statsResponse },
          patients: (usersResponse.data || []).filter((user) => user.role === 'patient'),
          doctors: (doctorsResponse.data || []).filter((doctor) => doctor.isVerified),
          pendingDoctors: (pendingDoctorsResponse.data || []).filter((doctor) => !doctor.isVerified),
          appointments: appointmentsResponse.data || [],
        }

        DASHBOARD_CACHE.data = nextData
        return nextData
      })
      .finally(() => {
        DASHBOARD_CACHE.promise = null
      })

    return DASHBOARD_CACHE.promise
  }, [])

  useEffect(() => {
    let isActive = true

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const nextData = await fetchDashboardData(false)

        if (!isActive) {
          return
        }

        setStats(nextData.stats)
        setPatients(nextData.patients)
        setDoctors(nextData.doctors)
        setPendingDoctors(nextData.pendingDoctors)
        setAppointments(nextData.appointments)
      } catch (requestError) {
        if (isActive) {
          setError(requestError?.response?.data?.message || 'Failed to load admin dashboard data')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isActive = false
    }
  }, [fetchDashboardData])

  const reloadDashboard = useCallback(async () => {
    const nextData = await fetchDashboardData(true)

    setStats(nextData.stats)
    setPatients(nextData.patients)
    setDoctors(nextData.doctors)
    setPendingDoctors(nextData.pendingDoctors)
    setAppointments(nextData.appointments)
  }, [fetchDashboardData])

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
