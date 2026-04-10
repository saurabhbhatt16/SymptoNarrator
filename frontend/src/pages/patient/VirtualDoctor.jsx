import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiMoon, FiPhoneOff, FiSend, FiSun } from 'react-icons/fi'
import DoctorAvatar from '../../components/DoctorAvatar'
import VoiceInput from '../../components/VoiceInput'
import { getAiResponseApi } from '../../services/ai.service'

function VirtualDoctor() {
  const { appointmentId } = useParams()
  const numericAppointmentId = Number(appointmentId)
  const isValidAppointmentId = useMemo(
    () => Number.isInteger(numericAppointmentId) && numericAppointmentId > 0,
    [numericAppointmentId],
  )

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState('')
  const [detectedDisease, setDetectedDisease] = useState('')
  const [confidence, setConfidence] = useState(null)
  const [darkMode, setDarkMode] = useState(true)
  const [predictedDisease, setPredictedDisease] = useState('')

  const feedRef = useRef(null)

  useEffect(() => {
    if (!feedRef.current) return
    feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages, isLoading])

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speakText = (text) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const pushMessage = (role, text, metadata = null) => {
    setMessages((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random()}`,
        role,
        text,
        metadata,
        createdAt: new Date().toISOString(),
      },
    ])
  }

  const handleResponse = async (rawText) => {
    const text = rawText.trim()
    if (!text || isLoading) return

    setError('')
    pushMessage('user', text)
    setInput('')
    setIsLoading(true)

    try {
      const response = await getAiResponseApi({
        message: text,
        predictedDisease: predictedDisease || undefined,
      })

      const data = response.data
      setDetectedDisease(data?.disease || '')
      setConfidence(typeof data?.confidence === 'number' ? data.confidence : null)

      pushMessage('doctor', data?.response || 'I am here to help.', {
        disease: data?.disease,
        confidence: data?.confidence,
      })

      speakText(data?.response || 'I am here to help.')
    } catch (requestError) {
      const message = requestError?.response?.data?.message || 'Unable to process consultation right now.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    handleResponse(input)
  }

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript)
  }

  const layoutClasses = darkMode
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-100 text-slate-900'

  const panelClass = darkMode
    ? 'border-slate-800 bg-slate-900'
    : 'border-slate-200 bg-white'

  if (!isValidAppointmentId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Invalid appointment id.</p>
        </main>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${layoutClasses}`}>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Virtual AI Doctor Consultation</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Appointment #{numericAppointmentId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500/40 px-3 py-2 text-sm"
            >
              {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <Link
              to={`/chat/${numericAppointmentId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              <FiPhoneOff size={16} />
              End Call
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-12">
          <div className={`rounded-2xl border p-4 lg:col-span-7 ${panelClass}`}>
            <div className="grid h-[68vh] grid-rows-2 gap-3">
              <div className="rounded-2xl bg-linear-to-br from-cyan-700 to-sky-900 p-4">
                <DoctorAvatar speaking={isSpeaking} />
              </div>
              <div className={`rounded-2xl border p-4 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-400/50">
                  <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Patient video placeholder</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 lg:col-span-5 ${panelClass}`}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Consultation Chat</h2>
              {isLoading ? <span className="text-xs text-amber-500">Analyzing...</span> : null}
            </div>

            <div ref={feedRef} className={`h-[52vh] overflow-y-auto rounded-xl p-3 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
              {messages.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Start by describing your symptoms.
                </p>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isUser = message.role === 'user'
                    return (
                      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[86%] rounded-2xl px-4 py-2 text-sm ${
                            isUser
                              ? 'rounded-br-md bg-cyan-600 text-white'
                              : darkMode
                                ? 'rounded-bl-md bg-slate-800 text-slate-100'
                                : 'rounded-bl-md bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          <p>{message.text}</p>
                          {message.metadata?.disease ? (
                            <p className={`mt-1 text-[11px] ${isUser ? 'text-cyan-100' : darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                              Detected: {message.metadata.disease}
                              {typeof message.metadata.confidence === 'number'
                                ? ` (${message.metadata.confidence}%)`
                                : ''}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-slate-500/20 p-3">
              <label htmlFor="predictedDisease" className={`mb-1 block text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Optional predicted disease from ML
              </label>
              <input
                id="predictedDisease"
                value={predictedDisease}
                onChange={(event) => setPredictedDisease(event.target.value)}
                placeholder="e.g., Dengue"
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-cyan-400'
                    : 'border-slate-200 bg-white text-slate-700 focus:border-cyan-400'
                }`}
              />
              {detectedDisease ? (
                <p className={`mt-2 text-xs ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                  Current detected disease: {detectedDisease}
                  {typeof confidence === 'number' ? ` (${confidence}%)` : ''}
                </p>
              ) : null}
            </div>

            {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

            <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type symptoms or ask a health question"
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                  darkMode
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-cyan-400'
                    : 'border-slate-200 bg-white text-slate-700 focus:border-cyan-400'
                }`}
              />
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={isLoading} />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSend size={16} /> Send
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default VirtualDoctor
