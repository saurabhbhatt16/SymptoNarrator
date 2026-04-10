const REPORT_LIBRARY_STORAGE_KEY = 'reportLibrary'

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '-')
}

function getPatientKeys(patient) {
  const idToken = normalizeToken(patient?.id)
  const nameToken = normalizeToken(patient?.name || patient?.fullName)

  const primary = idToken ? `id:${idToken}` : `name:${nameToken || 'unknown-patient'}`
  const aliases = []

  if (nameToken) {
    aliases.push(`name:${nameToken}`)
  }

  return { primary, aliases }
}

function readLibraryRoot() {
  try {
    const raw = localStorage.getItem(REPORT_LIBRARY_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (_error) {
    return {}
  }
}

function writeLibraryRoot(data) {
  localStorage.setItem(REPORT_LIBRARY_STORAGE_KEY, JSON.stringify(data))
}

export function saveReportToLibrary(patientName, report) {
  const patient = typeof patientName === 'object' ? patientName : { name: patientName }
  const root = readLibraryRoot()
  const { primary, aliases } = getPatientKeys(patient)
  const generatedAt = report?.generatedAt || new Date().toISOString()

  if (!root[primary]) {
    root[primary] = {
      patientName: patient?.name || patient?.fullName || 'Unknown Patient',
      patientId: patient?.id || null,
      reports: {},
    }
  }

  root[primary].reports[generatedAt] = {
    ...report,
    generatedAt,
  }

  // Keep aliases mapped to the same report set for backward compatibility.
  aliases.forEach((aliasKey) => {
    if (!root[aliasKey]) {
      root[aliasKey] = {
        patientName: patient?.name || patient?.fullName || 'Unknown Patient',
        patientId: patient?.id || null,
        reports: {},
      }
    }
    root[aliasKey].reports = {
      ...(root[aliasKey].reports || {}),
      [generatedAt]: {
        ...report,
        generatedAt,
      },
    }
  })

  writeLibraryRoot(root)
}

export function getReportsFromLibrary(patientName) {
  const patient = typeof patientName === 'object' ? patientName : { name: patientName }
  const root = readLibraryRoot()
  const { primary, aliases } = getPatientKeys(patient)
  const allKeys = [primary, ...aliases]

  const mergedReports = {}

  allKeys.forEach((key) => {
    const node = root[key]
    if (node && node.reports && typeof node.reports === 'object') {
      Object.entries(node.reports).forEach(([ts, report]) => {
        mergedReports[ts] = {
          ...report,
          generatedAt: report?.generatedAt || ts,
        }
      })
    }
  })

  if (Object.keys(mergedReports).length === 0) {
    return []
  }

  return Object.values(mergedReports)
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
}
