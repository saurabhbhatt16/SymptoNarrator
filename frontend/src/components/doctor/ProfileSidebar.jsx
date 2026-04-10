import { memo } from 'react'
import { FiCamera, FiEdit2 } from 'react-icons/fi'
import { FaUserDoctor } from 'react-icons/fa6'

function ProfileSidebar({ profile, onEdit, onImageChange }) {
  const displayName = profile?.user?.name || profile?.fullName || 'Doctor'

  return (
    <aside className="rounded-xl bg-white p-5 shadow-lg">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {profile?.profileImage ? (
            <img src={profile.profileImage} alt={displayName} className="h-28 w-28 rounded-full object-cover shadow-md" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-sky-600 text-3xl font-semibold text-white shadow-md">
              <FaUserDoctor size={44} />
            </div>
          )}
          <label className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-white p-2 shadow">
            <FiCamera className="text-slate-700" size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={onImageChange} />
          </label>
        </div>

        <h3 className="mt-4 text-xl font-semibold text-slate-800">{displayName}</h3>
        <p className="text-sm text-slate-500">{profile?.specialization || 'Specialization not set'}</p>

        <div className="mt-5 w-full space-y-3 text-left text-sm text-slate-600">
          <InfoRow label="Age" value={profile?.age ?? '—'} />
          <InfoRow label="Gender" value={profile?.gender || '—'} />
          <InfoRow label="Specialization" value={profile?.specialization || '—'} />
          <InfoRow label="Hospital" value={profile?.hospitalName || '—'} />
          <InfoRow label="Education" value={profile?.education || '—'} />
          <InfoRow label="Email" value={profile?.user?.email || '—'} />
          <InfoRow label="Phone" value={profile?.phone || '—'} />
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          <FiEdit2 size={15} /> Edit Profile
        </button>
      </div>
    </aside>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span className="shrink-0 font-medium text-slate-500">{label}</span>
      <span className="min-w-0 text-right wrap-break-word text-slate-800">{value}</span>
    </div>
  )
}

export default memo(ProfileSidebar)
