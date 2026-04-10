import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  FiArrowLeft,
  FiCamera,
  FiCameraOff,
  FiFileText,
  FiMic,
  FiMicOff,
  FiPaperclip,
  FiPhoneOff,
  FiSend,
} from 'react-icons/fi'
import ChatBubble from '../../components/ChatBubble'
import useSocket from '../../hooks/useSocket'
import { getMessagesApi } from '../../services/message.service'
import { getDoctorAppointmentsApi, getPatientAppointmentsApi } from '../../services/appointment.service'
import { getMyReportsApi } from '../../services/report.service'
import { isAppointmentVideoActive } from '../../utils/appointmentTime'

function formatGeneratedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { date: '--', time: '--', day: '--' }
  }

  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    day: date.toLocaleDateString('en-US', { weekday: 'long' }),
  }
}

function buildReportMessage(report) {
  const info = formatGeneratedAt(report?.generatedAt)
  const disease = report?.diagnosis?.diseaseName || '--'
  const severity = report?.diagnosis?.severity || '--'
  const category = report?.diagnosis?.category || '--'
  const summary = report?.summary || 'Summary not available.'
  return `Recent report submitted | ${info.date} ${info.time} | Disease: ${disease} | Severity: ${severity} | Category: ${category} | Summary: ${summary}`
}

function getReportKey(report) {
  return String(report?.reportId || report?.generatedAt || report?.createdAt || '')
}

function VideoConsultation() {
  const { appointmentId } = useParams()
  const numericAppointmentId = Number(appointmentId)
  const isValidAppointmentId = Number.isInteger(numericAppointmentId) && numericAppointmentId > 0
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const role = user?.role

  const [appointment, setAppointment] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [chatContext, setChatContext] = useState(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [showReportPicker, setShowReportPicker] = useState(false)
  const [selectedReportKey, setSelectedReportKey] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [sessionNow, setSessionNow] = useState(Date.now())
  const [mediaError, setMediaError] = useState('')
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const hasFetchedReportsRef = useRef(false)

  const { socket, isConnected, connectionError } = useSocket(token)
  const feedRef = useRef(null)
  const localVideoRef = useRef(null)

  const selectedReport = useMemo(
    () => reports.find((report) => getReportKey(report) === selectedReportKey) || reports[0] || null,
    [reports, selectedReportKey],
  )

  const appointmentDateLabel = useMemo(() => {
    if (!appointment?.date) return '--'
    return new Date(appointment.date).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [appointment?.date])

  const isVideoActive = appointment ? isAppointmentVideoActive(appointment, sessionNow) : false
  const doctorName =
    appointment?.doctor?.fullName || chatContext?.doctor?.fullName || (role === 'doctor' ? user?.name : 'Doctor')
  const patientName =
    appointment?.patient?.name || chatContext?.patient?.name || (role === 'patient' ? user?.name : 'Patient')
  const chatPath = role === 'doctor' ? `/doctor/chat/${numericAppointmentId}` : `/chat/${numericAppointmentId}`

  useEffect(() => {
    if (!isValidAppointmentId) {
      setLoading(false)
      setError('Invalid appointment id')
      return
    }

    const loadAppointment = async () => {
      setLoading(true)
      setError('')

      try {
        const response =
          role === 'doctor' ? await getDoctorAppointmentsApi() : await getPatientAppointmentsApi()
        const appointmentList = response.data || []
        const nextAppointment = appointmentList.find((item) => item.id === numericAppointmentId)

        if (!nextAppointment) {
          setAppointment(null)
          setError('Appointment not found')
          return
        }

        setAppointment(nextAppointment)

        const messagesResponse = await getMessagesApi(numericAppointmentId)
        setMessages(messagesResponse.data || [])
        setChatContext(messagesResponse.context || null)
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load consultation')
      } finally {
        setLoading(false)
      }
    }

    loadAppointment()
  }, [isValidAppointmentId, numericAppointmentId, role])

  useEffect(() => {
    if (hasFetchedReportsRef.current) return
    hasFetchedReportsRef.current = true

    if (role !== 'patient') {
      setReports([])
      return
    }

    const loadReports = async () => {
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

    loadReports()
  }, [])

  useEffect(() => {
    if (!socket || !isValidAppointmentId) return

    const onNewMessage = (message) => {
      if (message.appointmentId !== numericAppointmentId) return
      setMessages((current) => [...current, message])
    }

    socket.emit('joinRoom', { appointmentId: numericAppointmentId }, (response) => {
      if (!response?.ok) {
        setError(response?.message || 'Unable to join consultation room')
        return
      }
      setIsJoined(true)
    })

    socket.on('newMessage', onNewMessage)

    return () => {
      socket.off('newMessage', onNewMessage)
      setIsJoined(false)
    }
  }, [socket, isValidAppointmentId, numericAppointmentId])

  useEffect(() => {
    const intervalId = setInterval(() => setSessionNow(Date.now()), 30000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let mediaStream = null

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError('Camera preview is not supported in this browser.')
        return
      }

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream
        }
      } catch (_error) {
        setMediaError('Camera and microphone access were not granted.')
      }
    }

    startCamera()

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    if (!feedRef.current) return
    feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (showReportPicker && reports.length > 0 && !selectedReportKey) {
      setSelectedReportKey(getReportKey(reports[0]))
    }
  }, [reports, selectedReportKey, showReportPicker])

  const handleSend = (event) => {
    event.preventDefault()
    if (!socket || !isJoined || !text.trim() || sending) return

    const blockedForDoctor =
      role === 'doctor' && chatContext?.appointmentType === 'online' && chatContext?.chatStatus !== 'accepted'

    if (blockedForDoctor) {
      setError('Accept chat request before replying')
      return
    }

    setSending(true)
    setError('')

    socket.emit(
      'sendMessage',
      {
        appointmentId: numericAppointmentId,
        message: text,
      },
      (response) => {
        if (!response?.ok) {
          setError(response?.message || 'Failed to send message')
        } else {
          setText('')
        }
        setSending(false)
      },
    )
  }

  const handleSubmitRecentReport = async () => {
    if (!selectedReport || !socket || !isJoined) {
      setError('Please choose a report to submit')
      return
    }

    setSubmittingReport(true)
    setError('')

    socket.emit(
      'sendMessage',
      {
        appointmentId: numericAppointmentId,
        message: buildReportMessage(selectedReport),
      },
      (response) => {
        if (!response?.ok) {
          setError(response?.message || 'Failed to submit report')
        } else {
          toast.success('Report submitted to doctor')
          setShowReportPicker(false)
        }
        setSubmittingReport(false)
      },
    )
  }

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
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <header className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(role === 'doctor' ? '/doctor/dashboard' : '/appointments')}
              aria-label="Back"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <FiArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Video Consultation</h1>
              <p className="text-sm text-slate-500">Appointment #{numericAppointmentId} • {appointmentDateLabel}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className={`rounded-full px-3 py-1 font-medium ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isConnected ? 'Connected' : 'Connecting'}
            </span>
            {connectionError ? <span className="text-red-600">{connectionError}</span> : null}
            {appointment ? (
              <span className={`rounded-full px-3 py-1 font-medium ${isVideoActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {isVideoActive ? 'Video session active' : 'Waiting for appointment window'}
              </span>
            ) : null}
          </div>
        </header>

        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
          </div>
        ) : appointment ? (
          <section className="grid gap-4 xl:grid-cols-12">
            <div className="space-y-4 xl:col-span-7">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                {!isVideoActive ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    The live video session is available only during the appointment hour.
                  </div>
                ) : null}

                {mediaError ? (
                  <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {mediaError}
                  </div>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="overflow-hidden rounded-3xl border border-cyan-200 bg-linear-to-br from-cyan-50 via-sky-50 to-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Doctor</p>
                        <h2 className="text-xl font-semibold text-slate-900">{doctorName}</h2>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Online
                      </span>
                    </div>
                    <div className="flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {role === 'doctor' && !cameraOff && !mediaError ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-cyan-100 bg-cyan-50 text-4xl font-bold text-cyan-700">
                            {doctorName?.charAt(0)?.toUpperCase() || 'D'}
                          </div>
                          <p className="text-sm text-cyan-700">Doctor video feed placeholder</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-blue-200 bg-linear-to-br from-blue-50 via-indigo-50 to-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-blue-700">Patient</p>
                        <h2 className="text-xl font-semibold text-slate-900">{patientName}</h2>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        You
                      </span>
                    </div>
                    <div className="flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {role === 'patient' && !cameraOff && !mediaError ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-50 text-4xl font-bold text-blue-700">
                            {patientName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <p className="text-sm text-blue-700">Patient video feed placeholder</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMuted((current) => !current)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${muted ? 'bg-red-500 text-white hover:bg-red-600' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {muted ? <FiMicOff className="h-4 w-4" /> : <FiMic className="h-4 w-4" />}
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraOff((current) => !current)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${cameraOff ? 'bg-red-500 text-white hover:bg-red-600' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {cameraOff ? <FiCameraOff className="h-4 w-4" /> : <FiCamera className="h-4 w-4" />}
                    {cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  </button>
                  {role === 'patient' ? (
                    <button
                      type="button"
                      onClick={() => setShowReportPicker(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      <FiFileText className="h-4 w-4" />
                      Submit Recent Report
                    </button>
                  ) : null}
                  <Link
                    to={chatPath}
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                  >
                    <FiPaperclip className="h-4 w-4" />
                    Open Chat Only
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate(role === 'doctor' ? '/doctor/dashboard' : '/appointments')}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                  >
                    <FiPhoneOff className="h-4 w-4" />
                    End Call
                  </button>
                </div>
              </div>
            </div>

            <aside className="xl:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Call Chat</h2>
                    <p className="text-sm text-slate-500">
                      {role === 'doctor' ? 'Message the patient during the consultation.' : 'Chat with your doctor here.'}
                    </p>
                  </div>
                  {role === 'patient' ? (
                    <button
                      type="button"
                      onClick={() => setShowReportPicker(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <FiPaperclip className="h-4 w-4" />
                      Submit Recent Report
                    </button>
                  ) : null}
                </div>

                <div ref={feedRef} className="h-[56vh] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No messages yet. Start the consultation conversation.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSend} className="mt-3 flex gap-2">
                  <input
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Write a message..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !isJoined || sending || !text.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiSend className="h-4 w-4" />
                    Send
                  </button>
                </form>
              </div>
            </aside>
          </section>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-600">
            <p>{error || 'Consultation not available.'}</p>
          </div>
        )}
      </main>

      {showReportPicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Submit Recent Report to Doctor</h3>
                <p className="text-sm text-slate-500">Choose one report from your saved library.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportPicker(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
              {loadingReports ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Loading saved reports...
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const info = formatGeneratedAt(report.generatedAt)
                    const reportKey = getReportKey(report)
                    const isSelected = selectedReportKey === reportKey

                    return (
                      <label
                        key={reportKey}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <input
                          type="radio"
                          name="report"
                          value={reportKey}
                          checked={isSelected}
                          onChange={() => setSelectedReportKey(reportKey)}
                          className="mt-1 h-4 w-4 accent-violet-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-900">{report?.diagnosis?.diseaseName || 'Report'}</span>
                            <span>•</span>
                            <span>{info.date}</span>
                            <span>•</span>
                            <span>{info.time}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            Severity: {report?.diagnosis?.severity || '--'} • Category: {report?.diagnosis?.category || '--'}
                          </p>
                          <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                            {report?.summary || 'Summary not available.'}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  No saved reports found in your library.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowReportPicker(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRecentReport}
                disabled={!selectedReport || submittingReport || reports.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiFileText className="h-4 w-4" />
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default VideoConsultation