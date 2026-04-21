import { useState } from 'react'
import { HiMenu, HiX } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'

const navItems = [
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

function HomeNavbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <img src={logo} alt="SymptoNarrator logo" className="h-13 w-13 object-contain sm:h-14 sm:w-14" />
          <span className="text-[1.15rem] font-semibold tracking-[0.02em] text-slate-800 sm:text-[1.2rem]">
            SymptoNarrator
          </span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="text-[0.98rem] font-medium tracking-wide text-slate-600 transition duration-300 hover:text-sky-700"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Link
            to="/login"
            className="inline-flex items-center rounded-xl bg-linear-to-r from-sky-600 to-emerald-600 px-5 py-2.5 text-[0.95rem] font-semibold text-white shadow-lg shadow-sky-200/60 transition duration-300 hover:-translate-y-0.5 hover:from-sky-700 hover:to-emerald-700"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
        >
          {isOpen ? <HiX className="h-5 w-5" /> : <HiMenu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-sm md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-50 hover:text-sky-700"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-linear-to-r from-sky-600 to-emerald-600 px-4 py-2.5 text-base font-semibold text-white shadow-lg shadow-sky-200/60 transition hover:from-sky-700 hover:to-emerald-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default HomeNavbar
