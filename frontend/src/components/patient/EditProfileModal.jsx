import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCamera, FiUser } from 'react-icons/fi'

function EditProfileModal({ isOpen, initialValues, onClose, onSave, saving }) {
  const [form, setForm] = useState({ name: '', age: '', gender: '', phone: '' })
  const [profileImage, setProfileImage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    setForm({
      name: initialValues?.fullName || initialValues?.user?.name || '',
      age: initialValues?.age ?? '',
      gender: initialValues?.gender || '',
      phone: initialValues?.phone || '',
    })
    setProfileImage(initialValues?.profileImage || '')
  }, [isOpen, initialValues])

  const avatarLabel = useMemo(() => {
    const name = initialValues?.fullName || initialValues?.name || initialValues?.user?.name || 'P'
    return name.charAt(0).toUpperCase()
  }, [initialValues])

  if (!isOpen) return null

  const onChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const loadImage = () =>
      new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

    try {
      const dataUrl = await loadImage()
      const image = new Image()

      const resized = await new Promise((resolve, reject) => {
        image.onload = () => {
          const maxSize = 512
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1)
          const width = Math.max(1, Math.round(image.width * scale))
          const height = Math.max(1, Math.round(image.height * scale))

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('Canvas not available'))
            return
          }

          context.drawImage(image, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }

        image.onerror = reject
        image.src = dataUrl
      })

      setProfileImage(resized)
    } catch (_error) {
      setProfileImage('')
    }

    event.target.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave({
      ...form,
      age: Number(form.age),
      profileImage,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Edit Patient Profile</h3>
            <p className="text-sm text-slate-500">Update your photo and profile details in one place.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center sm:flex-row sm:text-left">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-sky-500 to-cyan-600 text-3xl font-semibold text-white shadow-md">
                {profileImage ? (
                  <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarLabel || <FiUser size={26} />}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                aria-label="Upload profile photo"
              >
                <FiCamera className="h-4 w-4" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700">Profile photo</p>
              <p className="mt-1 text-sm text-slate-500">
                Add or replace your avatar photo. It will be shown on your dashboard profile card.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Insert Photo
                </button>
                {profileImage ? (
                  <button
                    type="button"
                    onClick={() => setProfileImage('')}
                    className="rounded-xl border border-transparent px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => onChange('name', event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(event) => onChange('age', event.target.value)}
                required
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Gender</label>
              <input
                value={form.gender}
                onChange={(event) => onChange('gender', event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              value={form.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal
