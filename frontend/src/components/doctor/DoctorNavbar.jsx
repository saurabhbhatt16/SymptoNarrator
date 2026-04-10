import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiLogOut } from 'react-icons/fi'
import logo from '../../assets/logo.jpeg'
import { logout } from '../../redux/authSlice'
import { toast } from 'react-toastify'

function DoctorNavbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  const doctorFirstName = (user?.name || 'Doctor')
    .trim()
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)[0]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    toast.info('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MediSense Healthcare" className="h-10 w-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Doctor Dashboard</h1>
            <p className="text-xs text-slate-500">MediSense Healthcare</p>
          </div>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 pr-3 shadow-sm transition hover:shadow"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              D
            </span>
            <span className="text-sm font-medium text-slate-700">{doctorFirstName}</span>
            <FiChevronDown className="text-slate-500" size={14} />
          </button>

          {open ? (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
              <button
                type="button"
                onClick={handleLogout}
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

export default DoctorNavbar
