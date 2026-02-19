import * as dotenv from 'dotenv'
import { auth } from '../lib/auth'
import { prisma } from '../lib/prisma'

dotenv.config()


async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...')
    
    const adminEmail = 'admin@medistore.com'
    const adminPassword = 'Admin@123'
    const adminName = 'Admin User'

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingUser) {
      const admin = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: 'ADMIN',
          emailVerified: true,
          status: 'ACTIVE'
        }
      })
      console.log('Existing user upgraded to admin:', admin.email)
      return
    }

    const createdUser = await auth.api.signUpEmail({
      body: {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'ADMIN',
        phone: '',
        status: 'ACTIVE'
      },
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
    await prisma.user.update({
      where: { id: createdUser.user.id },
      data: {
        emailVerified: true
      }
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAdmin()