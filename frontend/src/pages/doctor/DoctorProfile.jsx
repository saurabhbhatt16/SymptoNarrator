import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import ProfileSidebar from '../../components/doctor/ProfileSidebar'
import EditProfileModal from '../../components/doctor/EditProfileModal'
import { setAuth } from '../../redux/authSlice'
import { getDoctorProfileApi, updateDoctorProfileApi } from '../../services/doctor.service'

function DoctorProfile() {
  const dispatch = useDispatch()
  const { user, role, token } = useSelector((state) => state.auth)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const hasLoadedRef = useRef(false)

  const loadProfile = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getDoctorProfileApi()
      const nextProfile = response.profile
      setProfile(nextProfile)

      dispatch(
        setAuth({
          user: {
            ...user,
            name: nextProfile.user?.name || user?.name,
            isVerified: Boolean(nextProfile.isVerified || nextProfile.verified),
            needsOnboarding: false,
          },
          role,
          token,
        }),
      )
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load doctor profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    loadProfile()
  }, [])

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const response = await updateDoctorProfileApi({
          name: profile.user?.name || user?.name || 'Doctor',
          age: profile.age ?? null,
          gender: profile.gender || '',
          specialization: profile.specialization,
          education: profile.education || '',
          phone: profile.phone || '',
          profileImage: String(reader.result || ''),
          weeklyAvailability: profile.weeklyAvailability || null,
        })
        setProfile(response.profile)
        dispatch(
          setAuth({
            user: {
              ...user,
              name: response.profile.user?.name || user?.name,
              isVerified: Boolean(response.profile.isVerified || response.profile.verified),
              needsOnboarding: false,
            },
            role,
            token,
          }),
        )
        toast.success('Profile image updated')
      } catch (_error) {
        const details = _error?.response?.data?.details
        const message = Array.isArray(details)
          ? details[0]
          : _error?.response?.data?.message || 'Something went wrong'
        toast.error(message)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (form) => {
    setSavingProfile(true)
    try {
      const response = await updateDoctorProfileApi({
        name: form.name,
        age: form.age === '' ? null : Number(form.age),
        gender: form.gender || '',
        specialization: form.specialization,
        education: form.education,
        phone: form.phone,
        profileImage: form.profileImage,
        weeklyAvailability: profile?.weeklyAvailability || null,
      })

      setProfile(response.profile)
      dispatch(
        setAuth({
          user: {
            ...user,
            name: response.profile.user?.name || form.name,
            isVerified: Boolean(response.profile.isVerified || response.profile.verified),
            needsOnboarding: false,
          },
          role,
          token,
        }),
      )
      setEditOpen(false)
      toast.success('Profile updated successfully')
    } catch (_error) {
      const details = _error?.response?.data?.details
      const message = Array.isArray(details)
        ? details[0]
        : _error?.response?.data?.message || 'Something went wrong'
      toast.error(message)
    } finally {
      setSavingProfile(false)
    }
  }

  const doctorName = (profile?.user?.name || user?.name || 'Doctor')
    .trim()
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)[0]

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <h2 className="text-3xl font-bold text-slate-900">Dr. {doctorName}'s Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Review and update your professional details.</p>

        {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <div className="mt-8 flex justify-center">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          </div>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <ProfileSidebar profile={profile} onEdit={() => setEditOpen(true)} onImageChange={handleImageChange} />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Profile overview</h3>
                    <p className="text-sm text-slate-500">Your public-facing doctor profile details.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Verification" value={profile?.isVerified || profile?.verified ? 'Verified' : 'Pending'} />
                  <InfoCard label="Experience" value={profile?.experience ? `${profile.experience} years` : '—'} />
                  <InfoCard label="Hospital" value={profile?.hospitalName || '—'} />
                  <InfoCard label="Consultation Fee" value={profile?.consultationFee ? `Rs ${profile.consultationFee}` : '—'} />
                  <InfoCard label="Available Timings" value={profile?.availableTimings || '—'} />
                  <InfoCard label="Email" value={profile?.user?.email || '—'} />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-lg">
                Keep your profile image, specialization, and contact details up to date so patients and admin can verify your practice information quickly.
              </div>
            </div>
          </section>
        )}
      </main>

      <EditProfileModal
        isOpen={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveProfile}
        saving={savingProfile}
      />
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

export default DoctorProfile