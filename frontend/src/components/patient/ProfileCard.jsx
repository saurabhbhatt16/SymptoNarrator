import { FiCamera, FiUser } from 'react-icons/fi'

function ProfileCard({ profile, onEdit }) {
  const fullName = profile?.fullName || profile?.name || profile?.user?.name || '...'
  const phone = profile?.phone || '--'
  const initial = profile?.user?.name?.charAt(0) || fullName.charAt(0).toUpperCase() || 'P'

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-white p-5 shadow-md">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-3xl font-semibold text-white shadow-md">
            {initial ? <span>{initial}</span> : <FiUser size={30} />}
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="absolute bottom-1 right-1 rounded-full bg-white p-2 shadow"
            aria-label="Edit patient profile"
          >
            <FiCamera className="text-slate-700" size={14} />
          </button>
        </div>

        <h3 className="mt-4 max-w-full truncate text-lg font-semibold text-slate-800">{fullName}</h3>
        <p className="text-sm text-slate-500">{profile?.gender || 'Patient profile'}</p>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-700">
        <InfoRow label="Name" value={fullName} />
        <InfoRow label="Age" value={profile?.age ?? '--'} />
        <InfoRow label="Gender" value={profile?.gender || '--'} />
        <InfoRow label="Email" value={profile?.email || profile?.user?.email || '--'} />
        <InfoRow label="Phone" value={phone} />
        <InfoRow label="Blood Group" value={profile?.bloodGroup || '--'} />
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-600"
        >
          Edit Profile
        </button>
      </div>
    </section>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex items-start justify-between gap-4 text-sm">
        <div className="min-w-0 shrink-0 font-medium text-slate-900">{label}:</div>
        <div className="min-w-0 max-w-full break-words text-right text-slate-800">{value}</div>
      </div>
    </div>
  )
}

export default ProfileCard
