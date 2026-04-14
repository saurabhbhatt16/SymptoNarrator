import api from './api'

const reportsCacheByScope = new Map()
const inFlightReportsRequestByScope = new Map()

function getActiveReportScopeKey() {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token') || 'no-token'

  let userId = 'anonymous'
  try {
    const rawUser = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (rawUser) {
      const parsed = JSON.parse(rawUser)
      userId = parsed?.id || parsed?.email || parsed?.name || 'anonymous'
    }
  } catch (_error) {
    userId = 'anonymous'
  }

  return `${userId}::${token}`
}

function normalizeSingleReport(report = {}) {
  const diagnosis = report?.diagnosis || {}
  const treatment = report?.treatment || {}
  const recovery = report?.recovery || {}
  const input = report?.input || {}

  const minDays = report?.recovery?.minDays ?? recovery?.min_days ?? null
  const maxDays = report?.recovery?.maxDays ?? recovery?.max_days ?? null

  return {
    ...report,
    patient: report?.patient || {},
    form: report?.form || {
      symptoms: input?.symptoms || '',
      durationDays: input?.duration_days ?? null,
      previousIllness: '',
    },
    diagnosis: {
      ...diagnosis,
      diseaseName: report?.diagnosis?.diseaseName || diagnosis?.disease_name || '--',
      specialistDoctor:
        report?.diagnosis?.specialistDoctor || report?.specialist_required || '--',
      category: report?.diagnosis?.category || diagnosis?.category || '--',
      severity: report?.diagnosis?.severity || report?.severity?.level || '--',
      prevalence: report?.diagnosis?.prevalence || diagnosis?.prevalence || '',
      diseaseType: report?.diagnosis?.diseaseType || diagnosis?.type || '--',
    },
    recovery: {
      minDays,
      maxDays,
      estimatedRange:
        report?.recovery?.estimatedRange ||
        recovery?.estimated_range ||
        (minDays != null && maxDays != null ? `${minDays} - ${maxDays} days` : ''),
    },
    treatmentPlan: Array.isArray(report?.treatmentPlan)
      ? report.treatmentPlan
      : Array.isArray(treatment?.plan)
        ? treatment.plan
        : [],
    medicines: Array.isArray(report?.medicines)
      ? report.medicines
      : Array.isArray(treatment?.medicines)
        ? treatment.medicines
        : [],
    summary: report?.summary || '',
  }
}

function normalizeReportsPayload(payload) {
  const data = Array.isArray(payload?.data) ? payload.data.map((item) => normalizeSingleReport(item)) : []
  return { data }
}

export async function getMyReportsApi(options = {}) {
  const { forceRefresh = false } = options
  const scopeKey = getActiveReportScopeKey()
  const cached = reportsCacheByScope.get(scopeKey)
  const inFlight = inFlightReportsRequestByScope.get(scopeKey)

  if (!forceRefresh && cached) {
    return cached
  }

  if (!forceRefresh && inFlight) {
    return inFlight
  }

  const nextRequest = api
    .get('/api/reports/me')
    .then((response) => {
      const normalized = normalizeReportsPayload(response.data)
      reportsCacheByScope.set(scopeKey, normalized)
      return normalized
    })
    .finally(() => {
      inFlightReportsRequestByScope.delete(scopeKey)
    })

  inFlightReportsRequestByScope.set(scopeKey, nextRequest)
  return nextRequest
}

export async function createMyReportApi(report) {
  const scopeKey = getActiveReportScopeKey()
  const response = await api.post('/api/reports/me', { report })
  const saved = response?.data?.data ? normalizeSingleReport(response.data.data) : null

  if (saved) {
    const scopedCache = reportsCacheByScope.get(scopeKey)
    const current = Array.isArray(scopedCache?.data) ? scopedCache.data : []
    reportsCacheByScope.set(scopeKey, { data: [saved, ...current] })
  }

  return response.data
}

export function clearReportsCache() {
  reportsCacheByScope.clear()
  inFlightReportsRequestByScope.clear()
}