const prisma = require('../config/prisma')

function toSafeGeneratedAt(value) {
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function toOwnedReportData(userId, report) {
  const payload = report && typeof report === 'object' ? { ...report } : {}
  const existingPatient = payload.patient && typeof payload.patient === 'object' ? payload.patient : {}

  payload.patient = {
    ...existingPatient,
    id: userId,
  }

  payload.ownerPatientId = userId
  return payload
}

async function getReportsByUserId(userId) {
  const patientProfile = await prisma.patientProfile.findUnique({
    where: { userId },
    select: {
      fullName: true,
      age: true,
      gender: true,
    },
  })

  const rows = await prisma.report.findMany({
    where: { patientId: userId },
    orderBy: [{ generatedAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      reportData: true,
      generatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return rows.map((row) => {
    const payload = row.reportData && typeof row.reportData === 'object' ? row.reportData : {}
    const payloadPatient = payload.patient && typeof payload.patient === 'object' ? payload.patient : {}

    return {
      ...payload,
      patient: {
        ...payloadPatient,
        id: userId,
        name: payloadPatient?.name || patientProfile?.fullName || '--',
        age: payloadPatient?.age ?? patientProfile?.age ?? null,
        gender: payloadPatient?.gender || patientProfile?.gender || '--',
      },
      id: row.id,
      reportId: row.id,
      patientId: row.patientId,
      generatedAt: payload.generatedAt || row.generatedAt?.toISOString?.() || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })
}

async function createReportForUserId(userId, report) {
  const ownedPayload = toOwnedReportData(userId, report)

  const row = await prisma.report.create({
    data: {
      patientId: userId,
      reportData: ownedPayload,
      summary: typeof ownedPayload?.summary === 'string' ? ownedPayload.summary : null,
      generatedAt: toSafeGeneratedAt(ownedPayload?.generatedAt),
    },
    select: {
      id: true,
      patientId: true,
      reportData: true,
      generatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const payload = row.reportData && typeof row.reportData === 'object' ? row.reportData : {}

  return {
    ...payload,
    id: row.id,
    reportId: row.id,
    patientId: row.patientId,
    generatedAt: payload.generatedAt || row.generatedAt?.toISOString?.() || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

module.exports = {
  getReportsByUserId,
  createReportForUserId,
}
