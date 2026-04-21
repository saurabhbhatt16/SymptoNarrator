import { FiDownload } from "react-icons/fi";

function ReportCard({ report, onDownloadPdf }) {
  if (!report) return null;

  const prevalence = String(report.diagnosis?.prevalence || "").trim();
  const showPrevalence =
    Boolean(prevalence) && prevalence.toLowerCase() !== "not specified";
  const recoveryText =
    report.recovery?.estimatedRange ||
    (report.recovery?.minDays != null && report.recovery?.maxDays != null
      ? `${report.recovery.minDays} - ${report.recovery.maxDays} days`
      : "");

  return (
    <section
      id="patient-report-card"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
            Generated Patient Report
          </h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
            Clinical summary generated from symptom analysis
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
          aria-label="Download report PDF"
        >
          <FiDownload size={16} />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Patient Details
          </p>
          <p className="mt-2 text-sm text-slate-800">
            <span className="font-semibold">Name:</span>{" "}
            {report.patient?.name || "--"}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-semibold">Age:</span>{" "}
            {report.patient?.age ?? "--"}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-semibold">Gender:</span>{" "}
            {report.patient?.gender || "--"}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-semibold">Phone:</span>{" "}
            {report.patient?.phone || "--"}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Form Details
          </p>
          <p className="mt-2 text-sm text-slate-800">
            <span className="font-semibold">Symptoms:</span>{" "}
            {report.form?.symptoms || "--"}
          </p>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-semibold">Duration:</span>{" "}
            {report.form?.durationDays ?? "--"} day(s)
          </p>
          <p className="mt-1 text-sm text-slate-800">
            <span className="font-semibold">Previous Illness:</span>{" "}
            {report.form?.previousIllness || "--"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs uppercase tracking-wide text-blue-700">
          Diagnosis
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">
          {report.diagnosis?.diseaseName || "--"}
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Specialist Doctor: {report.diagnosis?.specialistDoctor || "--"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            Severity: {report.diagnosis?.severity || "--"}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            Category: {report.diagnosis?.category || "--"}
          </span>
          {showPrevalence ? (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
              Prevalence: {prevalence}
            </span>
          ) : null}
        </div>
        {recoveryText ? (
          <p className="mt-2 text-sm text-slate-700">
            Recovery Window: {recoveryText}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs uppercase tracking-wide text-emerald-700">
          Treatment Plan
        </p>
        <div className="mt-2 space-y-1">
          {(report.treatmentPlan || []).length > 0 ? (
            report.treatmentPlan.map((line) => (
              <p key={line} className="text-sm text-emerald-900">
                • {line}
              </p>
            ))
          ) : (
            <p className="text-sm text-emerald-900">
              No treatment plan available.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
        <p className="text-xs uppercase tracking-wide text-sky-700">
          Suggested Medicines
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(report.medicines || []).length > 0 ? (
            report.medicines.map((medicine) => (
              <span
                key={medicine}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {medicine}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-700">
              No suggested medicines available.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Summary
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
          {report.summary || "Summary not available."}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Translated Summary
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-800">
          {report.translatedSummary ||
            report.translated_summary ||
            report.summary ||
            "Summary not available."}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs uppercase tracking-wide font-semibold text-amber-900">
          ⚠️ Medical Disclaimer
        </p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          {report.disclaimer ||
            "This report is generated by an AI system and is intended for informational purposes only. It should not be considered a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment."}
        </p>
      </div>
    </section>
  );
}

export default ReportCard;
