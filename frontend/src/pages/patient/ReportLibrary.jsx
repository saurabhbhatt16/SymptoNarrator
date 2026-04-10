import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiFileText, FiX } from 'react-icons/fi'
import { getMyReportsApi } from '../../services/report.service'

function formatDateDayTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { date: '--', day: '--', time: '--' }
  }

  return {
    date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    day: date.toLocaleDateString('en-US', { weekday: 'long' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}

function ReportLibrary() {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [selectedReport, setSelectedReport] = useState(null)
  const [nowMs, setNowMs] = useState(Date.now())
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(true)
  const hasFetchedReportsRef = useRef(false)

  const fetchReports = async () => {
    if (hasFetchedReportsRef.current) return
    hasFetchedReportsRef.current = true

    setLoadingReports(true)
    try {
      const response = await getMyReportsApi()
      setReports(Array.isArray(response?.data) ? response.data : [])
    } catch (_error) {
      setReports([])
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 60000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const { recentPrediction, previousPredictions } = useMemo(() => {
    if (reports.length === 0) {
      return { recentPrediction: null, previousPredictions: [] }
    }

    const newest = reports[0]
    const newestTime = new Date(newest.generatedAt).getTime()
    const withinOneHour = Number.isFinite(newestTime) ? nowMs - newestTime <= 60 * 60 * 1000 : false

    if (withinOneHour) {
      return {
        recentPrediction: newest,
        previousPredictions: reports.slice(1),
      }
    }

    return {
      recentPrediction: null,
      previousPredictions: reports,
    }
  }, [reports, nowMs])

  const PredictionRow = ({ report, titlePrefix }) => {
    const info = formatDateDayTime(report.generatedAt)

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {titlePrefix} • {info.day}, {info.date} • {info.time}
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {report?.diagnosis?.diseaseName || '--'}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Severity: {report?.diagnosis?.severity || '--'}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Category: {report?.diagnosis?.category || '--'}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-700">
          <span className="font-medium">Treatment:</span>{' '}
          {(report?.treatmentPlan || []).length > 0 ? report.treatmentPlan.join(', ') : 'No treatment plan available.'}
        </p>

        <button
          type="button"
          onClick={() => setSelectedReport(report)}
          className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <FiFileText className="mr-2 h-4 w-4" />
          View Report
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/patient/dashboard')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
            aria-label="Back to dashboard"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Report Library</h1>
            <p className="text-sm text-slate-600">Saved reports for {user?.name || 'patient'}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <section className="self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">Recent Prediction</h2>
            <div className="mt-4">
              {loadingReports ? (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-600">Loading reports...</p>
              ) : recentPrediction ? (
                <PredictionRow report={recentPrediction} titlePrefix="Recent" />
              ) : (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-600">No recent prediction found.</p>
              )}
            </div>
          </section>

          <section className="self-start rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-semibold text-slate-900">Previous Predictions</h2>
            <div className="mt-4 space-y-3">
              {loadingReports ? (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-600">Loading reports...</p>
              ) : previousPredictions.length > 0 ? (
                previousPredictions.map((report) => (
                  <PredictionRow key={`${report.reportId || report.generatedAt}-${report.createdAt || ''}`} report={report} titlePrefix="Previous" />
                ))
              ) : (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-600">No previous predictions found.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 px-4 py-6">
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-slate-900">Saved Report</h3>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                aria-label="Close report preview"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[78vh] space-y-3 overflow-y-auto px-5 py-4 text-sm text-slate-700 sm:px-6">
              <p><span className="font-semibold">Date:</span> {formatDateDayTime(selectedReport.generatedAt).date}</p>
              <p><span className="font-semibold">Day:</span> {formatDateDayTime(selectedReport.generatedAt).day}</p>
              <p><span className="font-semibold">Time:</span> {formatDateDayTime(selectedReport.generatedAt).time}</p>

              <div className="rounded-lg bg-slate-50 p-3">
                <p><span className="font-semibold">Patient:</span> {selectedReport?.patient?.name || '--'}</p>
                <p><span className="font-semibold">Age:</span> {selectedReport?.patient?.age ?? '--'}</p>
                <p><span className="font-semibold">Gender:</span> {selectedReport?.patient?.gender || '--'}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p><span className="font-semibold">Symptoms:</span> {selectedReport?.form?.symptoms || '--'}</p>
                <p><span className="font-semibold">Duration:</span> {selectedReport?.form?.durationDays ?? '--'} day(s)</p>
                <p><span className="font-semibold">Previous Illness:</span> {selectedReport?.form?.previousIllness || '--'}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p><span className="font-semibold">Disease:</span> {selectedReport?.diagnosis?.diseaseName || '--'}</p>
                <p><span className="font-semibold">Specialist Doctor:</span> {selectedReport?.diagnosis?.specialistDoctor || '--'}</p>
                <p><span className="font-semibold">Severity:</span> {selectedReport?.diagnosis?.severity || '--'}</p>
                <p><span className="font-semibold">Category:</span> {selectedReport?.diagnosis?.category || '--'}</p>
                {selectedReport?.diagnosis?.prevalence && String(selectedReport.diagnosis.prevalence).trim().toLowerCase() !== 'not specified' ? (
                  <p><span className="font-semibold">Prevalence:</span> {selectedReport.diagnosis.prevalence}</p>
                ) : null}
                <p>
                  <span className="font-semibold">Recovery:</span>{' '}
                  {selectedReport?.recovery?.estimatedRange || `${selectedReport?.recovery?.minDays || '--'} - ${selectedReport?.recovery?.maxDays || '--'} days`}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold">Treatment Plan:</p>
                <div className="mt-1 space-y-1">
                  {(selectedReport?.treatmentPlan || []).length > 0 ? (
                    selectedReport.treatmentPlan.map((line) => (
                      <p key={line}>• {line}</p>
                    ))
                  ) : (
                    <p>No treatment plan available.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold">Suggested Medicines:</p>
                <p className="mt-1">
                  {(selectedReport?.medicines || []).length > 0
                    ? selectedReport.medicines.join(', ')
                    : 'No suggested medicines available.'}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="font-semibold">Summary:</p>
                <p className="mt-1">{selectedReport?.summary || 'Summary not available.'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ReportLibrary
