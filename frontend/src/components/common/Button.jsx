function Button({ type = 'button', children, className = '', ...props }) {
  return (
    <button
      type={type}
      className={`w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
