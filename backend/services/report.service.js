const prisma = require('../config/prisma')

function toSafeGeneratedAt(value) {
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

async function getReportsByUserId(userId) {
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

    return {
      ...payload,
      reportId: row.id,
      generatedAt: payload.generatedAt || row.generatedAt?.toISOString?.() || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })
}

async function createReportForUserId(userId, report) {
  const row = await prisma.report.create({
    data: {
      patientId: userId,
      reportData: report,
      summary: typeof report?.summary === 'string' ? report.summary : null,
      generatedAt: toSafeGeneratedAt(report?.generatedAt),
    },
    select: {
      id: true,
      reportData: true,
      generatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const payload = row.reportData && typeof row.reportData === 'object' ? row.reportData : {}

  return {
    ...payload,
    reportId: row.id,
    generatedAt: payload.generatedAt || row.generatedAt?.toISOString?.() || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

module.exports = {
  getReportsByUserId,
  createReportForUserId,
}
