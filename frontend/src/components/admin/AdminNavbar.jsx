import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiShield } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { logout } from '../../redux/authSlice'
import logo from '../../assets/logo.png'

function AdminNavbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

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
        <div className="flex items-center gap-2 text-slate-800">
          <img src={logo} alt="MediSense Logo" className="h-9 w-9 rounded-xl object-cover" />
          <h1 className="text-lg font-semibold">MediSense Healthcare</h1>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 pr-3 shadow-sm transition hover:shadow"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">
              A
            </span>
            <span className="text-sm font-medium text-slate-700">Admin</span>
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

export default AdminNavbar
