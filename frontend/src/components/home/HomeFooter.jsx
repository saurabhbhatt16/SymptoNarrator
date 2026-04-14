import { Link } from 'react-router-dom'

function HomeFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 font-bold text-white">
              S
            </div>
            <p className="text-lg font-semibold text-white">SymptoNarrator</p>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Trusted digital care platform helping patients act early with AI-backed symptom intelligence.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#services" className="transition hover:text-sky-300">Services</a></li>
            <li><a href="#how-it-works" className="transition hover:text-sky-300">How It Works</a></li>
            <li><a href="#about" className="transition hover:text-sky-300">About</a></li>
            <li><Link to="/login" className="transition hover:text-sky-300">Login</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Contact</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>support@symptonarrator.com</li>
            <li>+1 (415) 555-0181</li>
            <li>24/7 Virtual Support</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="transition hover:text-sky-300">Privacy Policy</a></li>
            <li><a href="#" className="transition hover:text-sky-300">Terms of Service</a></li>
            <li><a href="#" className="transition hover:text-sky-300">HIPAA Notice</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} SymptoNarrator. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default HomeFooter
