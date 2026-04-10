function ChatBubble({ message, isOwn }) {
  const containerClass = isOwn ? 'justify-end' : 'justify-start'
  const bubbleClass = isOwn
    ? 'bg-sky-600 text-white rounded-2xl rounded-br-md'
    : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-bl-md'

  return (
    <div className={`flex w-full ${containerClass}`}>
      <div className={`max-w-[85%] px-4 py-2 shadow-sm ${bubbleClass}`}>
        <p className="wrap-break-word text-sm leading-relaxed">{message.message}</p>
        <p className={`mt-1 text-[11px] ${isOwn ? 'text-sky-100' : 'text-slate-400'}`}>
          {new Date(message.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

export default ChatBubble
