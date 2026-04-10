import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'

function EditProfileModal({ isOpen, profile, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    specialization: '',
    education: '',
    phone: '',
    profileImage: '',
  })

  useEffect(() => {
    if (!profile) return

    setForm({
      name: profile.user?.name || profile.fullName || '',
      age: profile.age ?? '',
      gender: profile.gender || '',
      specialization: profile.specialization || '',
      education: profile.education || '',
      phone: profile.phone || '',
      profileImage: profile.profileImage || '',
    })
  }, [profile])

  if (!isOpen) {
    return null
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm((current) => ({ ...current, profileImage: String(reader.result || '') }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Edit Profile</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Profile Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Age</span>
            <input
              name="age"
              type="number"
              value={form.age}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Gender</span>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Specialization</span>
            <input
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Education</span>
            <input
              name="education"
              value={form.education}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal
