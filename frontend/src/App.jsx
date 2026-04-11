import AppRoutes from './routes/AppRoutes'
import { ToastContainer } from 'react-toastify'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { logout } from './redux/authSlice'
import 'react-toastify/dist/ReactToastify.css'

const SESSION_ENDED_FLAG = 'app_session_ended_logout'

function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const hadEndedSession = localStorage.getItem(SESSION_ENDED_FLAG) === '1'
    const hasSessionToken = Boolean(sessionStorage.getItem('token'))

    if (hadEndedSession && !hasSessionToken) {
      localStorage.removeItem(SESSION_ENDED_FLAG)
      dispatch(logout())
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
      toast.info('Session ended when the website was closed. Please login again.')
      return
    }

    if (hadEndedSession && hasSessionToken) {
      localStorage.removeItem(SESSION_ENDED_FLAG)
    }
  }, [dispatch, location.pathname, navigate])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (sessionStorage.getItem('token')) {
        localStorage.setItem(SESSION_ENDED_FLAG, '1')
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [])

  return (
    <>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </>
  )
}

export default App
