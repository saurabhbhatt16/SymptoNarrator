import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { completeDoctorProfileApi } from '../../services/auth.service'
import { setAuth } from '../../redux/authSlice'

function DoctorSetup() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, token, role } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setApiError('')

    try {
      await completeDoctorProfileApi({
        ...data,
        experience: Number(data.experience),
        consultationFee: data.consultationFee === '' ? null : Number(data.consultationFee),
        age: data.age === '' ? null : Number(data.age),
        gender: data.gender,
        education: data.education?.trim() || '',
        hospitalName: data.hospitalName?.trim() || '',
        availableTimings: data.availableTimings?.trim() || '',
        phone: data.phone?.trim() || '',
      })

      const updatedUser = { ...user, needsOnboarding: false, profileCompleted: true }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      dispatch(setAuth({ user: updatedUser, role, token }))
      toast.success('Profile completed successfully')
      navigate('/doctor/dashboard')
    } catch (error) {
      setApiError(error?.response?.data?.message || 'Failed to save doctor profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Complete Doctor Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Add your professional details to unlock the doctor dashboard.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              id="specialization"
              label="Specialization"
              register={register('specialization', { required: 'Specialization is required' })}
              error={errors.specialization?.message}
            />
            <Input
              id="experience"
              type="number"
              label="Experience (Years)"
              register={register('experience', { required: 'Experience is required', min: 0 })}
              error={errors.experience?.message}
            />
            <Input
              id="age"
              type="number"
              label="Age (Optional)"
              register={register('age')}
              error={errors.age?.message}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Gender</label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender?.message ? <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p> : null}
            </div>
            <Input
              id="phone"
              label="Phone Number"
              register={register('phone', { required: 'Phone number is required' })}
              error={errors.phone?.message}
            />
            <Input
              id="education"
              label="Education (Optional)"
              register={register('education')}
              error={errors.education?.message}
            />
            <Input
              id="hospitalName"
              label="Hospital Name (Optional)"
              register={register('hospitalName')}
              error={errors.hospitalName?.message}
            />
            <Input
              id="availableTimings"
              label="Available Timings (Optional)"
              register={register('availableTimings')}
              error={errors.availableTimings?.message}
            />
            <Input
              id="consultationFee"
              type="number"
              label="Consultation Fee (Optional)"
              register={register('consultationFee', { min: 0 })}
              error={errors.consultationFee?.message}
            />

            {apiError ? <p className="text-sm text-red-500">{apiError}</p> : null}

            <Button type="submit" disabled={loading} className={loading ? 'opacity-80' : ''}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                  Saving...
                </span>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default DoctorSetup
