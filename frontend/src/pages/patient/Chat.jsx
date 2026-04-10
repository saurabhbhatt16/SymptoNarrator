import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { FiArrowLeft } from 'react-icons/fi'
import ChatBubble from '../../components/ChatBubble'
import useSocket from '../../hooks/useSocket'
import { getMessagesApi } from '../../services/message.service'
import { acceptAppointmentChatApi, requestAppointmentChatApi } from '../../services/appointment.service'

function Chat() {
  const { appointmentId } = useParams()
  const numericAppointmentId = Number(appointmentId)
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [chatContext, setChatContext] = useState(null)
  const [acceptingChat, setAcceptingChat] = useState(false)

  const { socket, isConnected, connectionError } = useSocket(token)
  const feedRef = useRef(null)

  const isValidAppointmentId = useMemo(
    () => Number.isInteger(numericAppointmentId) && numericAppointmentId > 0,
    [numericAppointmentId],
  )

  useEffect(() => {
    if (!isValidAppointmentId) {
      setLoading(false)
      setError('Invalid appointment id')
      return
    }

    const loadMessages = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getMessagesApi(numericAppointmentId)
        setMessages(response.data || [])
        setChatContext(response.context || null)
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [isValidAppointmentId, numericAppointmentId])

  useEffect(() => {
    if (!socket || !isValidAppointmentId) return

    const onNewMessage = (message) => {
      if (message.appointmentId !== numericAppointmentId) return
      setMessages((current) => [...current, message])
    }

    socket.emit('joinRoom', { appointmentId: numericAppointmentId }, (response) => {
      if (!response?.ok) {
        setError(response?.message || 'Unable to join chat room')
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
    if (!feedRef.current) return
    feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [messages])

  const handleSend = (event) => {
    event.preventDefault()
    if (!socket || !isJoined || !text.trim() || sending) return

    const role = user?.role
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

  const role = user?.role
  const doctorName = chatContext?.doctor?.fullName || 'Doctor'
  const canDoctorReply = !(role === 'doctor' && chatContext?.appointmentType === 'online' && chatContext?.chatStatus !== 'accepted')

  const handleRequestChatAsPatient = async () => {
    try {
      await requestAppointmentChatApi(numericAppointmentId)
      const response = await getMessagesApi(numericAppointmentId)
      setChatContext(response.context || null)
      toast.success('Chat request sent to doctor')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to send chat request')
    }
  }

  const handleAcceptChatAsDoctor = async () => {
    try {
      setAcceptingChat(true)
      await acceptAppointmentChatApi(numericAppointmentId)
      const response = await getMessagesApi(numericAppointmentId)
      setChatContext(response.context || null)
      toast.success('Chat request accepted')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to accept chat request')
    } finally {
      setAcceptingChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <header className="rounded-2xl bg-white p-5 shadow-md">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')}
                aria-label="Back to dashboard"
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
              >
                <FiArrowLeft className="h-4 w-4" />
              </button>

              <div>
              <h1 className="text-xl font-semibold text-slate-800">Appointment Chat</h1>
              <p className="mt-1 text-sm text-slate-500">
                {role === 'doctor' ? `Chatting with patient` : `Chatting with doctor ${doctorName}`}
              </p>
              </div>
            </div>
            <div className="flex gap-2">
              {role === 'patient' ? (
                <Link
                  to="/appointments"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  My Appointments
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/doctor/dashboard')}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Doctor Dashboard
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            <span className={`rounded-full px-3 py-1 font-medium ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {isConnected ? 'Connected' : 'Connecting'}
            </span>
            {connectionError ? <span className="text-red-500">{connectionError}</span> : null}
            {!isJoined && isConnected ? <span className="text-slate-500">Joining room...</span> : null}
            {chatContext?.appointmentType === 'online' ? (
              <span className={`rounded-full px-3 py-1 font-medium ${chatContext?.chatStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {chatContext?.chatStatus === 'accepted' ? 'Chat accepted' : 'Waiting for doctor approval'}
              </span>
            ) : null}
          </div>

          {chatContext?.appointmentType === 'online' && role === 'patient' && chatContext?.chatStatus === 'none' ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleRequestChatAsPatient}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Send Chat Request
              </button>
            </div>
          ) : null}

          {chatContext?.appointmentType === 'online' && role === 'doctor' && chatContext?.chatStatus !== 'accepted' ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAcceptChatAsDoctor}
                disabled={acceptingChat}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptingChat ? 'Accepting...' : 'Accept Chat Request'}
              </button>
            </div>
          ) : null}
        </header>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

        <section className="mt-4 rounded-2xl bg-slate-100 p-3 shadow-inner sm:p-4">
          <div ref={feedRef} className="h-[52vh] overflow-y-auto rounded-xl bg-slate-50 p-3 sm:p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No messages yet.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} isOwn={message.senderId === user?.id} />
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="mt-3 flex gap-2 sm:gap-3">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your message"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
            <button
              type="submit"
              disabled={!isConnected || !isJoined || sending || !text.trim() || !canDoctorReply}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default Chat
