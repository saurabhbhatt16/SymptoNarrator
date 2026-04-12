import { memo } from 'react'
import { FiX, FiTrash2 } from 'react-icons/fi'

const UserList = memo(function UserList({ users, onDelete, actionLoadingId }) {
  if (!users.length) {
    return <p className="text-sm text-slate-500">No data available</p>
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div key={user.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete && onDelete(user.id)}
            disabled={actionLoadingId === user.id}
            className="rounded-lg bg-red-500 p-1.5 text-white transition hover:bg-red-600 disabled:bg-red-400"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
})

const DoctorList = memo(function DoctorList({ doctors, onDelete, actionLoadingId }) {
  if (!doctors.length) {
    return <p className="text-sm text-slate-500">No data available</p>
  }

  return (
    <div className="space-y-2">
      {doctors.map((doctor) => (
        <div key={doctor.id} className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div>
            <p className="text-sm font-medium text-slate-800">{doctor.fullName}</p>
            <p className="text-xs text-slate-500">{doctor.specialization}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete && onDelete(doctor.id)}
            disabled={actionLoadingId === doctor.id}
            className="rounded-lg bg-red-500 p-1.5 text-white transition hover:bg-red-600 disabled:bg-red-400"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
})

const PendingDoctorList = memo(function PendingDoctorList({ doctors, onVerify, onReject, actionLoadingId }) {
  if (!doctors.length) {
    return <p className="text-sm text-slate-500">No data available</p>
  }

  return (
    <div className="space-y-2">
      {doctors.map((doctor) => (
        <div key={doctor.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-800">{doctor.fullName}</p>
              <p className="text-xs text-slate-500">{doctor.user?.email}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>Specialization: {doctor.specialization}</p>
                <p>Education: {doctor.education || '—'}</p>
                <p>Phone: {doctor.phone || '—'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onVerify(doctor.id)}
                disabled={actionLoadingId === doctor.id}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
              >
                Verify
              </button>
              <button
                type="button"
                onClick={() => onReject(doctor.id)}
                disabled={actionLoadingId === doctor.id}
                className="rounded-lg bg-red-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})

const AppointmentList = memo(function AppointmentList({ appointments }) {
  if (!appointments.length) {
    return <p className="text-sm text-slate-500">No data available</p>
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-800">{appointment.patient?.name || 'Patient'} with {appointment.doctor?.fullName || 'Doctor'}</p>
          <p className="text-xs capitalize text-slate-500">{appointment.status}</p>
        </div>
      ))}
    </div>
  )
})

function Modals({ openType, onClose, patients, doctors, pendingDoctors, appointments, onVerifyDoctor, onRejectDoctor, onDeleteUser, onDeleteDoctor, actionLoadingId }) {
  if (!openType) {
    return null
  }

  const titleMap = {
    patients: 'Patients List',
    doctors: 'Doctors List',
    pendingDoctors: 'Pending Doctor Verification',
    appointments: 'Appointments List',
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{titleMap[openType]}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100">
            <FiX size={18} />
          </button>
        </div>

        {openType === 'patients' ? <UserList users={patients} onDelete={onDeleteUser} actionLoadingId={actionLoadingId} /> : null}
        {openType === 'doctors' ? <DoctorList doctors={doctors} onDelete={onDeleteDoctor} actionLoadingId={actionLoadingId} /> : null}
        {openType === 'pendingDoctors' ? (
          <PendingDoctorList
            doctors={pendingDoctors}
            onVerify={onVerifyDoctor}
            onReject={onRejectDoctor}
            actionLoadingId={actionLoadingId}
          />
        ) : null}
        {openType === 'appointments' ? <AppointmentList appointments={appointments} /> : null}
      </div>
    </div>
  )
}

export default memo(Modals)
