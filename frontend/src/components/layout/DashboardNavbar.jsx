import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { logout } from '../../redux/authSlice'
import logo from '@/assets/logo.png'

function getFirstName(name) {
  const fullName = String(name || '').trim().replace(/^dr\.?\s+/i, '')
  const firstName = fullName.split(/\s+/)[0]
  return firstName || 'User'
}

function DashboardNavbar({ title, subtitle, userName, namePrefix = '' }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)

  const firstName = getFirstName(userName)

  console.log('User Data:', userName)

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
    <header className="sticky top-0 z-30 bg-white shadow-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="logo" className="h-12 w-12 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="truncate text-lg font-semibold text-slate-900">{title}</span>
            <span className="truncate text-sm text-slate-500">{subtitle}</span>
          </div>
        </div>

        <div ref={menuRef} className="relative flex items-center gap-2">
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
              {namePrefix}
              {firstName}
            </span>
            <FiChevronDown className="text-slate-500" size={14} />
          </button>

          {open ? (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
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

export default DashboardNavbar