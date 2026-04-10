import { useEffect, useRef, useState } from 'react'
import { FiMic, FiMicOff } from 'react-icons/fi'

function VoiceInput({ onTranscript, disabled }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (transcript && onTranscript) {
        onTranscript(transcript)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [onTranscript])

  const handleClick = () => {
    if (!isSupported || disabled || !recognitionRef.current) return

    if (isRecording) {
      recognitionRef.current.stop()
      return
    }

    recognitionRef.current.start()
  }

  return (
    <button
      type="button"
      disabled={!isSupported || disabled}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      title={isSupported ? 'Speak your message' : 'Speech recognition is not supported in this browser'}
    >
      {isRecording ? <FiMicOff size={16} /> : <FiMic size={16} />}
      {isRecording ? 'Stop' : 'Mic'}
    </button>
  )
}

export default VoiceInput
