const prisma = require('../config/prisma')

const FEMALE_HINTS = [
  'neha', 'kavya', 'priya', 'meera', 'pooja', 'ananya', 'isha', 'shreya', 'sneha', 'ritika',
  'anjali', 'rhea', 'diya', 'aisha', 'nisha', 'sonam', 'swati', 'kiran', 'kajal', 'payal',
]

const MALE_HINTS = [
  'aarav', 'reyansh', 'kabir', 'karan', 'rohan', 'ishaan', 'arjun', 'rahul', 'vikas', 'rajesh',
  'kunal', 'manish', 'saurabh', 'aditya', 'amit', 'sumit', 'vivek', 'ankit', 'yash', 'akash',
]

function inferGenderFromName(name) {
  const normalized = String(name || '').toLowerCase().replace(/^dr\.?\s+/, '').trim()
  const first = normalized.split(/\s+/)[0] || ''

  if (FEMALE_HINTS.includes(first)) return 'Female'
  if (MALE_HINTS.includes(first)) return 'Male'

  // Fallback heuristic by common suffixes in first names.
  if (/(a|i|ya|ita|isha|ika|riya|y[a]?)$/.test(first) && !/(raj|deep|preet)$/.test(first)) {
    return 'Female'
  }

  return 'Male'
}

async function main() {
  const doctors = await prisma.doctorProfile.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  })

  let updated = 0
  for (const doctor of doctors) {
    const sourceName = doctor.user?.name || doctor.fullName || ''
    const nextGender = inferGenderFromName(sourceName)

    await prisma.$executeRawUnsafe(
      'UPDATE "DoctorProfile" SET "gender" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      nextGender,
      doctor.id,
    )
    updated += 1
  }

  console.log(`Updated gender for ${updated} doctor profiles.`)
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
