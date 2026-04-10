require('dotenv').config()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@gmail.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345'
  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      name: 'Admin',
      email,
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log(`Seeded admin user: ${email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })