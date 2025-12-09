/**
 * Script to add default UPSC exam reminders for all existing users
 * Run with: npx tsx scripts/add-default-reminders.ts
 */

import { prisma } from '../lib/prisma'

async function main() {
  console.log('Adding default UPSC reminders for all users...')

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  })

  console.log(`Found ${users.length} users`)

  const prelimsDate = new Date('2026-05-24T09:00:00') // May 24, 2026 at 9 AM
  const mainsDate = new Date('2026-08-21T09:00:00') // August 21, 2026 at 9 AM

  let added = 0
  let skipped = 0

  for (const user of users) {
    // Check if reminders already exist
    const existingReminders = await prisma.reminder.findMany({
      where: {
        userId: user.id,
        title: {
          in: ['UPSC Prelims Exam', 'UPSC Mains Exam'],
        },
      },
    })

    if (existingReminders.length === 0) {
      await prisma.reminder.createMany({
        data: [
          {
            userId: user.id,
            title: 'UPSC Prelims Exam',
            description: 'UPSC Civil Services Preliminary Examination',
            date: prelimsDate,
          },
          {
            userId: user.id,
            title: 'UPSC Mains Exam',
            description: 'UPSC Civil Services Main Examination',
            date: mainsDate,
          },
        ],
      })
      added++
      console.log(`✓ Added reminders for user: ${user.email}`)
    } else {
      skipped++
      console.log(`⊘ Skipped user ${user.email} (reminders already exist)`)
    }
  }

  console.log(`\nCompleted!`)
  console.log(`- Added reminders for ${added} users`)
  console.log(`- Skipped ${skipped} users (already have reminders)`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

