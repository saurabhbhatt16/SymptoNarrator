import { useEffect, useMemo, useState } from 'react'
import DoctorCard from '../../components/DoctorCard'
import api from '../../services/api'
import { doctors as finalDoctorSheet } from '../../data/finalDoctorSheet'

const LIMIT = 6

function DoctorList() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [search, setSearch] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [minExperience, setMinExperience] = useState('')

  const specializations = useMemo(() => {
    const unique = new Set(doctors.map((doctor) => doctor.specialization))
    return Array.from(unique)
  }, [doctors])

  const fetchDoctors = async (nextPage = page) => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page: nextPage,
        limit: LIMIT,
      }

      if (search.trim()) params.search = search.trim()
      if (specialization) params.specialization = specialization
      if (minExperience !== '') params.experience = Number(minExperience)

      const response = await api.get('/api/doctors', { params })
      const nextDoctors = Array.isArray(response?.data?.data) ? response.data.data : []
      const sourceDoctors = nextDoctors.length > 0 ? nextDoctors : finalDoctorSheet

      setDoctors(sourceDoctors)
      setPage(response.data.page || 1)
      setTotalPages(nextDoctors.length > 0 ? (response.data.totalPages || 1) : 1)
      console.log('DoctorSheet:', sourceDoctors)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch doctors')
      setDoctors(finalDoctorSheet)
      setPage(1)
      setTotalPages(1)
      console.log('DoctorSheet:', finalDoctorSheet)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialization, minExperience])

  const onSearchClick = () => {
    fetchDoctors(1)
  }

  const goToNextPage = () => {
    if (page < totalPages) {
      fetchDoctors(page + 1)
    }
  }

  const goToPreviousPage = () => {
    if (page > 1) {
      fetchDoctors(page - 1)
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-semibold text-slate-800">Find Doctors</h2>
        <p className="mt-1 text-sm text-slate-500">Search and filter doctors based on your needs.</p>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-md sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by doctor name"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />

            <select
              value={specialization}
              onChange={(event) => setSpecialization(event.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">All Specializations</option>
              {specializations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              value={minExperience}
              onChange={(event) => setMinExperience(event.target.value)}
              placeholder="Minimum experience"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />

            <button
              onClick={onSearchClick}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700"
            >
              Search
            </button>
          </div>
        </section>

        {loading ? (
          <div className="mt-8 flex items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
          </div>
        ) : null}

        {error ? <p className="mt-6 text-sm text-red-500">{error}</p> : null}

        {!loading && !error && doctors.length === 0 ? (
          <p className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-md">
            No doctors found.
          </p>
        ) : null}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </section>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={goToPreviousPage}
            disabled={page <= 1 || loading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
          <button
            onClick={goToNextPage}
            disabled={page >= totalPages || loading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  )
}

export default DoctorList
