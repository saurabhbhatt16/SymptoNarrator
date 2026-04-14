import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

function ProtectedRoute({ children, requiredRole, allowUnverifiedDoctor = false, allowIncompleteDoctor = false }) {
  const { isAuthenticated, role, user } = useSelector((state) => state.auth)
  const effectiveRole = role || user?.role
  const isDoctor = effectiveRole === 'doctor'
  const isVerifiedDoctor = Boolean(user?.isVerified)
  const isProfileCompleted = user?.profileCompleted ?? !user?.needsOnboarding

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && effectiveRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  if (isDoctor && !allowUnverifiedDoctor && !isVerifiedDoctor) {
    return <Navigate to="/doctor/verification-pending" replace />
  }

  if (isDoctor && isVerifiedDoctor && !allowIncompleteDoctor && !isProfileCompleted) {
    return <Navigate to="/doctor/complete-profile" replace />
  }

  return children
}

export default ProtectedRoute
