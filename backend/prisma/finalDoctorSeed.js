require('dotenv').config()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const doctors = [
  { name: 'Dr. Amit Tiwari', email: 'amit.tiwari@medisense.com', specialization: 'General Physician', education: 'MBBS', phone: '9899000011' },
  { name: 'Dr. Saurabh Mishra', email: 'saurabh.mishra@medisense.com', specialization: 'General Physician', education: 'MBBS', phone: '9899000012' },
  { name: 'Dr. Nikhil Sharma', email: 'nikhil.sharma@medisense.com', specialization: 'General Physician', education: 'MBBS', phone: '9899000013' },
  { name: 'Dr. Pooja Singh', email: 'pooja.singh@medisense.com', specialization: 'ENT Specialist', education: 'MBBS, MS ENT', phone: '9899000014' },
  { name: 'Dr. Rahul Verma', email: 'rahul.verma@medisense.com', specialization: 'ENT Specialist', education: 'MBBS, MS ENT', phone: '9899000015' },
  { name: 'Dr. Neeraj Patel', email: 'neeraj.patel@medisense.com', specialization: 'Dermatologist', education: 'MBBS, MD Dermatology', phone: '9899000016' },
  { name: 'Dr. Meena Joshi', email: 'meena.joshi@medisense.com', specialization: 'Dermatologist', education: 'MBBS, MD Dermatology', phone: '9899000017' },
  { name: 'Dr. Arvind Kumar', email: 'arvind.kumar@medisense.com', specialization: 'Orthopedic', education: 'MBBS, MS Orthopedics', phone: '9899000018' },
  { name: 'Dr. Deepak Yadav', email: 'deepak.yadav@medisense.com', specialization: 'Orthopedic', education: 'MBBS, MS Orthopedics', phone: '9899000019' },
  { name: 'Dr. Shalini Gupta', email: 'shalini.gupta@medisense.com', specialization: 'Pediatrician', education: 'MBBS, MD Pediatrics', phone: '9899000020' },
]

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00',
]

function randomExperience() {
  return Math.floor(Math.random() * (10 - 2 + 1)) + 2
}

function randomAge() {
  return Math.floor(Math.random() * (60 - 32 + 1)) + 32
}

function createDailyAvailability() {
  const slots = [...timeSlots]
  const availableCount = Math.max(5, Math.floor(Math.random() * 4) + 5)
  const shuffled = [...slots].sort(() => Math.random() - 0.5)
  const availableSlots = new Set(shuffled.slice(0, availableCount))

  return slots.map((timeSlot) => ({
    timeSlot,
    isAvailable: availableSlots.has(timeSlot),
  }))
}

async function createTimetableForDoctor(doctorProfile) {
  for (const day of days) {
    const daySlots = createDailyAvailability()
    const availableSlots = daySlots.filter((slot) => slot.isAvailable)

    if (availableSlots.length === 0) {
      daySlots[0].isAvailable = true
    }

    for (const slot of daySlots) {
      try {
        await prisma.timetable.create({
          data: {
            doctorId: doctorProfile.id,
            day,
            timeSlot: slot.timeSlot,
            isAvailable: slot.isAvailable,
          },
        })
      } catch (error) {
        console.error(`Timetable creation failed for ${doctorProfile.fullName} on ${day} ${slot.timeSlot}:`, error.message)
        continue
      }
    }
  }

  console.log(`Timetable created for ${doctorProfile.fullName}`)
}

async function main() {
  const hashedPassword = await bcrypt.hash('Doctor@123', 10)

  for (const doctor of doctors) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: doctor.email } })

      let user = existingUser

      if (!existingUser) {
        user = await prisma.user.create({
          data: {
            name: doctor.name,
            email: doctor.email,
            password: hashedPassword,
            role: 'doctor',
            isVerified: false,
          },
        })
        console.log(`Doctor added: ${doctor.name}`)
      } else {
        console.log(`Doctor skipped (already exists): ${doctor.name}`)
      }

      const doctorProfile = await prisma.doctorProfile.upsert({
        where: { userId: user.id },
        update: {
          fullName: doctor.name,
          specialization: doctor.specialization,
          education: doctor.education,
          phone: doctor.phone,
          experience: randomExperience(),
          isVerified: false,
          verified: false,
          age: randomAge(),
        },
        create: {
          userId: user.id,
          fullName: doctor.name,
          specialization: doctor.specialization,
          education: doctor.education,
          phone: doctor.phone,
          experience: randomExperience(),
          hospitalName: null,
          availableTimings: null,
          consultationFee: null,
          profileImage: null,
          weeklyAvailability: null,
          isVerified: false,
          verified: false,
          age: randomAge(),
        },
      })

      console.log(`Age updated: ${doctor.name}`)

      await prisma.timetable.deleteMany({
        where: { doctorId: doctorProfile.id },
      })

      await createTimetableForDoctor(doctorProfile)
    } catch (error) {
      console.error(`Error processing doctor ${doctor.email}:`, error.message)
      continue
    }
  }

  const allDoctorUsers = await prisma.user.findMany({
    where: { role: 'doctor' },
    select: {
      id: true,
      email: true,
      name: true,
      doctorProfile: {
        select: {
          id: true,
        },
      },
    },
  })

  for (const doctorUser of allDoctorUsers) {
    try {
      if (!doctorUser.doctorProfile) {
        continue
      }

      const age = randomAge()

      await prisma.doctorProfile.update({
        where: { id: doctorUser.doctorProfile.id },
        data: { age },
      })

      console.log(`Age updated: ${doctorUser.name}`)
    } catch (error) {
      console.error(`Failed to update age for ${doctorUser.email}:`, error.message)
      continue
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
