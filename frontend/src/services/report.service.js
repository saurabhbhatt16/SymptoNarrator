import api from './api'

let reportsCache = null
let inFlightReportsRequest = null

function normalizeReportsPayload(payload) {
  const data = Array.isArray(payload?.data) ? payload.data : []
  return { data }
}

export async function getMyReportsApi(options = {}) {
  const { forceRefresh = false } = options

  if (!forceRefresh && reportsCache) {
    return reportsCache
  }

  if (!forceRefresh && inFlightReportsRequest) {
    return inFlightReportsRequest
  }

  inFlightReportsRequest = api
    .get('/api/reports/me')
    .then((response) => {
      const normalized = normalizeReportsPayload(response.data)
      reportsCache = normalized
      return normalized
    })
    .finally(() => {
      inFlightReportsRequest = null
    })

  return inFlightReportsRequest
}

export async function createMyReportApi(report) {
  const response = await api.post('/api/reports/me', { report })
  const saved = response?.data?.data || null

  if (saved) {
    const current = Array.isArray(reportsCache?.data) ? reportsCache.data : []
    reportsCache = { data: [saved, ...current] }
  }

  return response.data
}

export function clearReportsCache() {
  reportsCache = null
  inFlightReportsRequest = null
}