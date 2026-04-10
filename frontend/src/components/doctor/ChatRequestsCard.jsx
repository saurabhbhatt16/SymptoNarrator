function ChatRequestsCard({ requests, onAccept, onOpenChat, actionLoadingId }) {
  const hasData = requests.length > 0

  return (
    <section className="w-full max-w-full overflow-hidden rounded-xl bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-800">Chat Requests</h3>
        <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">{requests.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {!hasData ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            No pending chat requests
          </div>
        ) : (
          requests.map((request) => {
            const appointmentDate = new Date(request.date).toLocaleString()
            const loading = actionLoadingId === request.id

            return (
              <article key={request.id} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-slate-800">{request.patient?.name || 'Patient'}</h4>
                    <div className="mt-1 space-y-1 text-sm text-slate-600">
                      <p>Date/Time: {appointmentDate}</p>
                      <p>Symptoms: {request.patient?.patientProfile?.symptoms || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onAccept(request.id)}
                      disabled={loading}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Accepting...' : 'Accept Chat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat(request.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}

export default ChatRequestsCard
