import { FiFileText } from "react-icons/fi";

function SummaryCards({ stats, onCardClick }) {
  const lastPrediction = stats.lastPredictionData || null;
  const hasPrediction = Boolean(lastPrediction);

  const normalizeDiseaseLabel = (value) => {
    const text = String(value || "").trim();
    if (
      !text ||
      /^no prediction yet$/i.test(text) ||
      /^no previous predictions$/i.test(text)
    ) {
      return "No previous predictions";
    }
    if (/^possible\s+/i.test(text)) return text;
    return `Possible ${text}`;
  };

  const getPredictionDateParts = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      return {
        day: "--",
        date: "--",
        time: "--",
      };
    }

    return {
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
      date: date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const diseaseLabel = normalizeDiseaseLabel(
    lastPrediction?.diagnosis?.diseaseName || stats.lastPrediction,
  );
  const predictionDate = getPredictionDateParts(lastPrediction?.generatedAt);

  const cards = [
    {
      key: "prediction",
      title: "Report Library",
      value: diseaseLabel,
      tone: "border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:shadow-lg",
      details: stats.predictionDetails,
    },
  ];

  return (
    <section className="space-y-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onCardClick(card)}
          className={`group w-full rounded-lg border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 sm:p-6 ${card.tone}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-900 sm:text-lg">
                {card.title}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600 sm:text-base">
                {hasPrediction ? card.value : "No previous predictions"}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-transform group-hover:scale-110">
              <FiFileText className="h-6 w-6" />
            </div>
          </div>
          {card.key === "prediction" ? (
            hasPrediction ? (
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <p>
                  <strong>Disease:</strong>{" "}
                  {lastPrediction?.diagnosis?.diseaseName ||
                    lastPrediction?.disease ||
                    "--"}
                </p>
                <p>
                  <strong>Severity:</strong>{" "}
                  {lastPrediction?.diagnosis?.severity || "--"}
                </p>
                <p>
                  <strong>Category:</strong>{" "}
                  {lastPrediction?.diagnosis?.category || "--"}
                </p>
                <p>
                  <strong>Day:</strong> {predictionDate.day}
                </p>
                <p>
                  <strong>Date:</strong> {predictionDate.date}
                </p>
                <p>
                  <strong>Time:</strong> {predictionDate.time}
                </p>
              </div>
            ) : (
              <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                No previous predictions
              </div>
            )
          ) : null}
        </button>
      ))}
    </section>
  );
}

export default SummaryCards;
