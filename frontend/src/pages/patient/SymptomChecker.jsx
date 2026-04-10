import { useState } from 'react'
import { toast } from 'react-toastify'
import { predictDiseaseApi } from '../../services/ai.service'

function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!symptoms.trim()) {
      setError('Please enter symptoms before predicting.')
      toast.error('Something went wrong')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await predictDiseaseApi({ symptoms })
      setResult(response.data)

      if (response?.data?.disease === 'No match found') {
        toast.info('No close disease match found')
      } else {
        toast.success('Prediction completed')
      }
    } catch (_error) {
      setError('Unable to predict symptoms right now.')
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Symptom Checker</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your symptoms separated by spaces or commas. Example: fever headache nausea
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <textarea
              value={symptoms}
              onChange={(event) => setSymptoms(event.target.value)}
              rows={4}
              placeholder="Type your symptoms here"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                  Predicting...
                </>
              ) : (
                'Predict Disease'
              )}
            </button>
          </form>

          {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

          {result ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-800">Prediction Result</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Disease:</span> {result.disease || 'No match found'}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Treatment:</span> {result.treatment || 'No data'}
                </p>
                {typeof result.confidence === 'number' ? (
                  <p>
                    <span className="font-medium text-slate-900">Confidence:</span> {result.confidence}%
                  </p>
                ) : null}
                {typeof result.matchedSymptoms === 'number' ? (
                  <p>
                    <span className="font-medium text-slate-900">Matched Symptoms:</span> {result.matchedSymptoms}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export default SymptomChecker
