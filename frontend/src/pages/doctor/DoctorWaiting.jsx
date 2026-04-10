import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

function DoctorWaiting() {
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Verification Page Loaded')
  }, [])

  const handleGoHome = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    try {
      navigate('/login', { replace: true })
    } catch (_error) {
      // Ignore and fall back to a hard navigation below.
    }

    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-gray-100 px-4">
      <main className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl transition duration-300 hover:scale-[1.01]">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 text-blue-600 shadow-inner">
          <div className="flex h-full w-full items-center justify-center text-lg font-bold">!</div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Verification Pending</h2>
        <p className="mb-6 text-gray-600">
          Your profile has been submitted successfully. Admin will verify your profile soon.
        </p>

        <button
          type="button"
          onClick={handleGoHome}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white transition duration-200 hover:bg-blue-700 hover:shadow-lg active:scale-95"
        >
          Go to Homepage
        </button>
      </main>
    </div>
  )
}

export default DoctorWaiting
