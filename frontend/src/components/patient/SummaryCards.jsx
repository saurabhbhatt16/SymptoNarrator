function SummaryCards({ stats, onCardClick }) {
  const lastPrediction = stats.lastPredictionData || null

  const normalizeDiseaseLabel = (value) => {
    const text = String(value || '').trim()
    if (!text) return 'No prediction yet'
    if (/^possible\s+/i.test(text)) return text
    return `Possible ${text}`
  }

  const getPredictionDateParts = (value) => {
    const date = value ? new Date(value) : null
    if (!date || Number.isNaN(date.getTime())) {
      return {
        day: '--',
        date: '--',
        time: '--',
      }
    }

    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      date: date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  }

  const diseaseLabel = normalizeDiseaseLabel(lastPrediction?.diagnosis?.diseaseName || stats.lastPrediction)
  const predictionDate = getPredictionDateParts(lastPrediction?.generatedAt)

  const cards = [
    {
      key: 'prediction',
      title: 'Last Prediction',
      value: diseaseLabel,
      tone: 'bg-purple-50 text-purple-700',
      details: stats.predictionDetails,
    },
  ]

  return (
    <section className="space-y-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onCardClick(card)}
          className={`w-full rounded-xl p-4 text-left shadow-lg transition hover:-translate-y-0.5 ${card.tone}`}
        >
          <p className="text-xs uppercase tracking-wide">{card.title}</p>
          <p className="mt-2 text-xl font-semibold">{card.value}</p>
          {card.key === 'prediction' && lastPrediction ? (
            <div className="mt-3 space-y-1 text-sm">
              <p><strong>Day:</strong> {predictionDate.day}</p>
              <p><strong>Date:</strong> {predictionDate.date}</p>
              <p><strong>Time:</strong> {predictionDate.time}</p>
            </div>
          ) : null}
        </button>
      ))}
    </section>
  )
}

export default SummaryCards
