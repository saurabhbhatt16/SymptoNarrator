import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { logout } from '../../redux/authSlice'
import logo from '../../assets/logo.jpeg'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)

  const displayName = String(user?.name || 'User').trim()
  const firstName = displayName.split(/\s+/)[0] || 'User'
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onLogout = () => {
    dispatch(logout())
    toast.info('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 bg-white shadow-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-bold text-slate-900 sm:text-lg">MediSense Healthcare</span>
          <span className="truncate text-xs text-slate-500 sm:text-sm">Patient Dashboard</span>
        </div>

        <div ref={menuRef} className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm transition hover:bg-slate-50"
            aria-label="Open account menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white">
              <FiUser size={15} />
            </span>
            <span className="max-w-24 truncate text-sm font-medium text-slate-700 sm:max-w-none sm:text-base">
              {firstName}
            </span>
            <FiChevronDown className="text-slate-500" size={14} />
          </button>

          {open ? (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <FiLogOut size={15} /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default Navbar
