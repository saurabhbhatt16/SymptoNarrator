const axios = require('axios')
const prisma = require('../config/prisma')

// Flask AI Service Base URL - defaults to localhost:8000
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

/**
 * Call Flask AI Service to generate health report
 */
async function analyzeSymptoms({ symptoms, days, user }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/analyze`,
      {
        symptoms,
        days: parseInt(days) || 1,
        user,
      },
      { timeout: 15000 }
    )
    return response.data
  } catch (error) {
    // Fallback if Flask service is down
    console.error('Flask AI Service error:', error.message)
    throw new Error('AI analysis service temporarily unavailable. Please try again later.')
  }
}

/**
 * Call Flask AI Service to predict disease
 */
async function predictDisease({ symptoms }) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/predict`,
      { symptoms },
      { timeout: 10000 }
    )
    return response.data
  } catch (error) {
    console.error('Flask predict service error:', error.message)
    throw new Error('Disease prediction service temporarily unavailable.')
  }
}

/**
 * Get specialist doctor for a disease
 */
async function getSpecialistForDisease(diseaseName) {
  try {
    const response = await axios.get(
      `${AI_SERVICE_URL}/api/specialist/${encodeURIComponent(diseaseName)}`,
      { timeout: 5000 }
    )
    return response.data.specialist
  } catch (error) {
    console.error('Specialist lookup error:', error.message)
    return null
  }
}

/**
 * Get available doctors filtered by specialist
 */
async function getDoctorsBySpecialist(specialistName) {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      where: {
        specialization: {
          contains: specialistName,
          mode: 'insensitive',
        },
        isVerified: true,
      },
      select: {
        userId: true,
        fullName: true,
        specialization: true,
        consultationFee: true,
        hospitalName: true,
        user: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        consultationFee: 'asc',
      },
    })

    return doctors.map((doc) => ({
      doctorId: doc.userId,
      name: doc.fullName,
      specialization: doc.specialization,
      hospital: doc.hospitalName,
      consultationFee: doc.consultationFee,
      email: doc.user?.email,
    }))
  } catch (error) {
    console.error('Doctor lookup error:', error.message)
    return []
  }
}

function buildDetailedSummary({ report, symptoms, days, user }) {
  const patientName = user?.name || 'the patient'
  const patientAge = user?.age ?? 'unknown age'
  const patientGender = user?.gender || 'unknown gender'
  const diseaseName = report?.diagnosis?.disease_name || 'a general health condition'
  const category = report?.diagnosis?.category || 'General'
  const prevalence = String(report?.diagnosis?.prevalence || '').trim()
  const hasPrevalence = prevalence && prevalence.toLowerCase() !== 'not specified'
  const severity = report?.severity?.level || 'Moderate'
  const minDays = report?.recovery?.min_days ?? '--'
  const maxDays = report?.recovery?.max_days ?? '--'
  const specialist = report?.specialist_required || 'General Physician'
  const recommendation = report?.severity?.recommendation || 'Follow up with a doctor for personalized care.'

  return (
    `${patientName} (${patientAge}, ${patientGender}) reported symptoms: ${symptoms} for ${days} day(s). ` +
    `The closest disease pattern is ${diseaseName}, which falls under the ${category} category. ` +
    `${hasPrevalence ? `The disease prevalence is noted as ${prevalence}. ` : ''}` +
    `Current severity is assessed as ${severity}. Based on the matched disease profile, expected recovery may take around ${minDays} to ${maxDays} days depending on treatment adherence and clinical response. ` +
    `Recommended specialist for consultation is ${specialist}. Clinical recommendation: ${recommendation}`
  )
}

/**
 * Generate health report and get matching doctors
 */
async function generateHealthReportWithDoctors({ symptoms, days, user }) {
  try {
    // Get AI analysis from Flask
    const report = await analyzeSymptoms({ symptoms, days, user })

    if (report.status !== 'success') {
      return report
    }

    // Get available doctors for the specialist
    const availableDoctors = await getDoctorsBySpecialist(report.specialist_required)

    // Add doctors to report
    report.available_doctors = availableDoctors
    report.total_doctors_available = availableDoctors.length
    report.summary = buildDetailedSummary({ report, symptoms, days, user })

    return report
  } catch (error) {
    console.error('Health report generation error:', error.message)
    throw error
  }
}

/**
 * Legacy function - evaluate symptoms with basic rules (fallback)
 */
function evaluateSymptoms(message) {
  const rules = [
    {
      keywords: ['fever', 'temperature', 'chills'],
      disease: 'Flu',
      confidence: 78,
      response: 'You may have flu. Stay hydrated, monitor your temperature, and rest well.',
    },
    {
      keywords: ['headache', 'migraine', 'head pain'],
      disease: 'Tension Headache',
      confidence: 72,
      response: 'This sounds like a headache pattern. Take rest, reduce screen exposure, and stay hydrated.',
    },
    {
      keywords: ['cough', 'throat', 'cold'],
      disease: 'Upper Respiratory Infection',
      confidence: 69,
      response: 'Your symptoms may indicate a mild upper respiratory infection. Warm fluids and rest may help.',
    },
    {
      keywords: ['stomach', 'nausea', 'vomit', 'diarrhea'],
      disease: 'Gastroenteritis',
      confidence: 70,
      response: 'You may have a stomach infection. Drink oral rehydration fluids and avoid heavy meals for now.',
    },
    {
      keywords: ['chest pain', 'shortness of breath', 'breathing'],
      disease: 'Urgent Cardio-Respiratory Concern',
      confidence: 84,
      response:
        'Chest pain or breathing difficulty can be serious. Please seek emergency medical care immediately.',
    },
  ]

  for (const rule of rules) {
    const matched = rule.keywords.some((keyword) => message.includes(keyword))
    if (matched) {
      return {
        disease: rule.disease,
        confidence: rule.confidence,
        response: rule.response,
      }
    }
  }

  return {
    disease: 'General Consultation',
    confidence: 55,
    response:
      'I understand your concern. Please share symptom duration, severity, and associated signs for better guidance.',
  }
}

async function generateAiResponse({ message, predictedDisease, confidence }) {
  const base = evaluateSymptoms(message.toLowerCase())

  if (predictedDisease) {
    return {
      response: `Based on your details, this may be related to ${predictedDisease}. ${base.response}`,
      disease: predictedDisease,
      confidence: Number.isFinite(Number(confidence)) ? Number(confidence) : base.confidence,
    }
  }

  return base
}

async function predictSymptoms({ symptoms }) {
  const aiServiceBaseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'

  try {
    const response = await axios.post(`${aiServiceBaseUrl}/api/predict`, { symptoms }, { timeout: 10000 })
    return response.data
  } catch (error) {
    const serviceError = new Error('Unable to predict symptoms right now')
    serviceError.statusCode = 502
    throw serviceError
  }
}

module.exports = {
  generateAiResponse,
  predictSymptoms,
  analyzeSymptoms,
  predictDisease,
  getSpecialistForDisease,
  getDoctorsBySpecialist,
  generateHealthReportWithDoctors,
}
