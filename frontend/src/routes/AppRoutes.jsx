import { Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import DoctorList from '../pages/patient/DoctorList'
import AdminDashboard from '../pages/admin/AdminDashboard'
import BookAppointment from '../pages/patient/BookAppointment'
import Chat from '../pages/patient/Chat'
import VirtualDoctor from '../pages/patient/VirtualDoctor'
import VideoConsultation from '../pages/consultation/VideoConsultation'
import SymptomChecker from '../pages/patient/SymptomChecker'
import PatientDashboard from '../pages/patient/PatientDashboard'
import AppointmentManagement from '../pages/patient/AppointmentManagement'
import ReportLibrary from '../pages/patient/ReportLibrary'
import DoctorAppointments from '../pages/doctor/DoctorAppointments'
import DoctorDashboard from '../pages/doctor/DoctorDashboard'
import DoctorProfile from '../pages/doctor/DoctorProfile'
import DoctorWaiting from '../pages/doctor/DoctorWaiting'
import DoctorSetupSuccess from '../pages/doctor/DoctorSetupSuccess'
import PatientSetup from '../pages/patient/PatientSetup'
import DoctorSetup from '../pages/doctor/DoctorSetup'
import ProtectedRoute from '../components/common/ProtectedRoute'
import AdminRoute from '../components/common/AdminRoute'
import PatientLayout from '../components/layout/PatientLayout'
import DoctorLayout from '../components/layout/DoctorLayout'
import { getPostAuthRoute } from '../utils/authRedirect'

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  return isAuthenticated ? <Navigate to={getPostAuthRoute(user)} replace /> : children
}

function DashboardRoute() {
  const { user } = useSelector((state) => state.auth)
  const destination = getPostAuthRoute(user)
  return <Navigate to={destination} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route path="/doctor/verification-pending" element={<DoctorWaiting />} />
      <Route path="/doctor/waiting" element={<Navigate to="/doctor/verification-pending" replace />} />
      <Route
        element={
          <ProtectedRoute allowUnverifiedDoctor>
            <PatientLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/doctors" element={<DoctorList />} />
        <Route
          path="/chat/:appointmentId"
          element={
            <ProtectedRoute requiredRole="patient">
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultation/:appointmentId"
          element={
            <ProtectedRoute requiredRole="patient">
              <VideoConsultation />
            </ProtectedRoute>
          }
        />
        <Route path="/chat/:appointmentId/consultation" element={<VirtualDoctor />} />

        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={<Navigate to="/appointments" replace />}
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute requiredRole="patient">
              <AppointmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/report-library"
          element={
            <ProtectedRoute requiredRole="patient">
              <ReportLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute requiredRole="patient">
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book/:doctorId"
          element={
            <Navigate to="/book-appointment" replace />
          }
        />
        <Route
          path="/symptom-checker"
          element={
            <ProtectedRoute requiredRole="patient">
              <SymptomChecker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/setup"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route
        path="/doctor"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="chat/:appointmentId"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="consultation/:appointmentId"
          element={
            <ProtectedRoute requiredRole="doctor">
              <VideoConsultation />
            </ProtectedRoute>
          }
        />
        <Route
          path="book"
          element={
            <ProtectedRoute requiredRole="doctor">
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="complete-profile"
          element={
            <ProtectedRoute requiredRole="doctor" allowIncompleteDoctor>
              <DoctorSetup />
            </ProtectedRoute>
          }
        />
        <Route path="setup" element={<Navigate to="/doctor/complete-profile" replace />} />
        <Route
          path="setup/success"
          element={
            <ProtectedRoute requiredRole="doctor" allowUnverifiedDoctor>
              <DoctorSetupSuccess />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRoutes
