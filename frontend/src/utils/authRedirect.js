export function getPostAuthRoute(user) {
  if (!user) return '/login'

  if (user.role === 'admin') {
    return '/admin-dashboard'
  }

  if (user.role === 'patient' && user.needsOnboarding) {
    return '/patient/setup'
  }

  if (user.role === 'doctor' && user.isVerified === false) {
    return '/doctor/verification-pending'
  }

  if (user.role === 'doctor' && (user.profileCompleted === false || user.needsOnboarding)) {
    return '/doctor/complete-profile'
  }

  if (user.role === 'doctor') {
    return '/doctor/dashboard'
  }

  return '/patient/dashboard'
}
