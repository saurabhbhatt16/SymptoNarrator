import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { createPatientProfileApi } from '../../services/auth.service'
import { setAuth } from '../../redux/authSlice'

function PatientSetup() {
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
      await createPatientProfileApi({
        ...data,
        age: Number(data.age),
      })

      const updatedUser = { ...user, needsOnboarding: false }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      dispatch(setAuth({ user: updatedUser, role, token }))
      navigate('/patient/dashboard')
    } catch (error) {
      setApiError(error?.response?.data?.message || 'Failed to save patient profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Patient Setup</h2>
          <p className="mt-1 text-sm text-slate-500">Complete your health profile to continue.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              id="fullName"
              label="Full Name"
              register={register('fullName', { required: 'Full name is required' })}
              error={errors.fullName?.message}
            />
            <Input
              id="age"
              type="number"
              label="Age"
              register={register('age', { required: 'Age is required', min: 0 })}
              error={errors.age?.message}
            />
            <Input
              id="gender"
              label="Gender"
              register={register('gender', { required: 'Gender is required' })}
              error={errors.gender?.message}
            />
            <Input
              id="bloodGroup"
              label="Blood Group"
              register={register('bloodGroup', { required: 'Blood group is required' })}
              error={errors.bloodGroup?.message}
            />

            <div className="space-y-1">
              <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700">
                Symptoms
              </label>
              <textarea
                id="symptoms"
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                {...register('symptoms', { required: 'Symptoms are required' })}
              />
              {errors.symptoms ? <p className="text-xs text-red-500">{errors.symptoms.message}</p> : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="medicalHistory" className="block text-sm font-medium text-slate-700">
                Medical History (Optional)
              </label>
              <textarea
                id="medicalHistory"
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                {...register('medicalHistory')}
              />
            </div>

            {apiError ? <p className="text-sm text-red-500">{apiError}</p> : null}

            <Button type="submit" disabled={loading} className={loading ? 'opacity-80' : ''}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                  Saving...
                </span>
              ) : (
                'Save Profile'
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default PatientSetup
