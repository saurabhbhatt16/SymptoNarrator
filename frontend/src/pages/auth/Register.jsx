import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { setAuth } from '../../redux/authSlice'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { registerApi } from '../../services/auth.service'
import { getPostAuthRoute } from '../../utils/authRedirect'
import logo from '../../assets/logo.jpeg'

function Register() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('patient')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    setApiError('')

    try {
      const result = await registerApi({ ...data, role })
      dispatch(setAuth({ user: result.user, role: result.user.role, token: result.token }))

      if (result.user?.role === 'doctor') {
        toast.success('Registration successful. Verification is pending.')
        navigate('/doctor/verification-pending')
        return
      }

      toast.success('Registration successful')
      navigate(getPostAuthRoute(result.user))
    } catch (error) {
      const status = error?.response?.status
      const message = error?.response?.data?.message || 'Registration failed. Please try again.'

      if (status === 400) {
        setApiError('Account already exists. Please login.')
        toast.error('Account already exists. Please login')
      } else {
        setApiError(message)
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="grid w-[90%] max-w-250 grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-lg lg:grid-cols-2">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 flex items-center gap-3">
            <img src={logo} alt="MediSense Logo" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Create Account</p>
              <p className="text-sm font-semibold text-slate-700">MediSense Healthcare</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800">Register</h2>
          <p className="mt-1 text-sm text-slate-500">Create your healthcare account</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Register as</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    role === 'patient'
                      ? 'border-2 border-black text-slate-900'
                      : 'border border-gray-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    role === 'doctor'
                      ? 'border-2 border-black text-slate-900'
                      : 'border border-gray-300 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  Doctor
                </button>
              </div>
            </div>

            <Input
              id="name"
              label="Name"
              register={register('name', { required: 'Name is required' })}
              error={errors.name?.message}
              placeholder="Full name"
            />
            <Input
              id="email"
              type="email"
              label="Email"
              register={register('email', { required: 'Email is required' })}
              error={errors.email?.message}
              placeholder="you@example.com"
            />

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  placeholder="Create a password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700"
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password ? <p className="text-xs text-red-500">{errors.password.message}</p> : null}
            </div>

            {apiError ? <p className="text-sm text-red-500">{apiError}</p> : null}

            {apiError && apiError.toLowerCase().includes('login') ? (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-sky-700 transition hover:text-sky-800"
              >
                Go to Login
              </button>
            ) : null}

            <Button type="submit" disabled={loading} className={loading ? 'opacity-70' : ''}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-sky-700 hover:text-sky-800">
              Login
            </Link>
          </p>
        </div>

        <div className="hidden items-center justify-center bg-sky-50 p-10 lg:flex">
          <div className="text-center">
            <img
              src={logo}
              alt="MediSense Healthcare"
              className="mx-auto h-56 w-56 rounded-2xl object-cover shadow-md transition duration-300"
            />
            <p className="mt-6 text-2xl font-semibold text-slate-800">MediSense Healthcare</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Register
