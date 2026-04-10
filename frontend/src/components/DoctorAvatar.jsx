function DoctorAvatar({ speaking }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
        <span
          className={`absolute h-full w-full rounded-full bg-cyan-400/25 blur-xl ${
            speaking ? 'animate-ping' : 'animate-pulse'
          }`}
        />
        <div
          className={`relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-cyan-200 bg-gradient-to-b from-cyan-100 to-sky-200 text-6xl shadow-2xl sm:h-48 sm:w-48 ${
            speaking ? 'animate-bounce' : 'animate-pulse'
          }`}
        >
          <span role="img" aria-label="doctor avatar">
            👩‍⚕️
          </span>
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-100">Virtual Doctor</p>
      <p className="text-sm text-slate-300">{speaking ? 'Speaking...' : 'Listening for your symptoms'}</p>
    </div>
  )
}

export default DoctorAvatar
