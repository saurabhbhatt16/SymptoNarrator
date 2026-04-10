import { Link } from 'react-router-dom'

function DoctorSetupSuccess() {
  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Submitted</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-800">Profile submitted successfully</h1>
          <p className="mt-3 text-sm text-slate-500">
            Doctor dashboard will be accessible after admin verification.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/dashboard"
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              OK / Go to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DoctorSetupSuccess
