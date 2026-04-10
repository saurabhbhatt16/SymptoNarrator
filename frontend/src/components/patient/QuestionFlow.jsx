import { useMemo, useRef, useState } from 'react'
import { FiMic, FiMicOff } from 'react-icons/fi'

function sanitizeSymptomToken(value) {
  return String(value || '').trim().toLowerCase()
}

function extractCurrentToken(text) {
  const value = String(text || '')
  const parts = value.split(',')
  const token = parts[parts.length - 1] || ''
  return token.trim()
}

function replaceCurrentToken(text, replacement) {
  const value = String(text || '')
  const parts = value.split(',')
  parts[parts.length - 1] = ` ${replacement}`
  return parts.join(',').replace(/^\s+/, '').replace(/,\s+/g, ', ').trim()
}

function ensureSymptomInText(text, symptom) {
  const normalized = sanitizeSymptomToken(symptom)
  if (!normalized) return text

  const parts = String(text || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  const exists = parts.some((part) => sanitizeSymptomToken(part) === normalized)
  if (exists) {
    return parts.join(', ')
  }

  return [...parts, symptom].join(', ')
}

function QuestionFlow({
  answers,
  onChange,
  onGenerate,
  generating,
  suggestionPool = [],
  symptomHistory = [],
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const recognitionRef = useRef(null)

  const speechSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  const suggestions = useMemo(() => {
    const currentToken = sanitizeSymptomToken(extractCurrentToken(answers.symptoms))
    if (!currentToken || currentToken.length < 2) {
      return []
    }

    const uniquePool = [...new Set((suggestionPool || []).map((item) => String(item || '').trim()).filter(Boolean))]

    const startsWithMatches = uniquePool.filter((item) =>
      sanitizeSymptomToken(item).startsWith(currentToken),
    )

    const containsMatches = uniquePool.filter((item) => {
      const normalized = sanitizeSymptomToken(item)
      return !normalized.startsWith(currentToken) && normalized.includes(currentToken)
    })

    return [...startsWithMatches, ...containsMatches].slice(0, 8)
  }, [answers.symptoms, suggestionPool])

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = false
      recognition.onstart = () => setIsRecording(true)
      recognition.onend = () => setIsRecording(false)
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || ''
        if (transcript) {
          onChange('symptoms', `${answers.symptoms ? `${answers.symptoms} ` : ''}${transcript}`.trim())
          setShowSuggestions(false)
        }
      }
      recognitionRef.current = recognition
    }

    recognitionRef.current.start()
  }

  const stopSpeech = () => {
    recognitionRef.current?.stop()
  }

  const handleSymptomsInputChange = (value) => {
    onChange('symptoms', value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion) => {
    const next = replaceCurrentToken(answers.symptoms, suggestion)
    onChange('symptoms', next)
    setShowSuggestions(false)
  }

  const handleHistoryClick = (symptom) => {
    const next = ensureSymptomInText(answers.symptoms, symptom)
    onChange('symptoms', next)
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-lg">
      <h3 className="text-xl font-semibold text-slate-900">How are you feeling today?</h3>
      <p className="mt-1 text-sm text-slate-500">Answer the questions below to generate your health report.</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">What symptoms are you experiencing?</label>
          <div className="mt-1 space-y-2">
            <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="relative w-full">
                <textarea
                  value={answers.symptoms}
                  onChange={(event) => handleSymptomsInputChange(event.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120)
                  }}
                  rows={3}
                  placeholder="Example: headache, dizziness, sore throat"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                />

                {showSuggestions && suggestions.length > 0 ? (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                    <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Suggestions</p>
                    <div className="max-h-44 overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full rounded-md px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-purple-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={isRecording ? stopSpeech : startSpeech}
                disabled={!speechSupported}
                className={`h-10 rounded-lg px-3 text-sm font-medium text-white transition sm:shrink-0 ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'
                } disabled:cursor-not-allowed disabled:bg-slate-300`}
              >
                {isRecording ? <FiMicOff /> : <FiMic />}
              </button>
            </div>

            {symptomHistory.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Symptom history</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {symptomHistory.slice(0, 12).map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleHistoryClick(symptom)}
                      className="rounded-full border border-purple-200 bg-white px-3 py-1 text-xs font-medium text-purple-700 transition hover:bg-purple-50"
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Since how many days?</label>
          <input
            value={answers.duration}
            onChange={(event) => onChange('duration', event.target.value)}
            placeholder="Example: 4 days"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Any previous illness?</label>
          <input
            value={answers.previousIllness}
            onChange={(event) => onChange('previousIllness', event.target.value)}
            placeholder="Example: migraine"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </section>
  )
}

export default QuestionFlow
