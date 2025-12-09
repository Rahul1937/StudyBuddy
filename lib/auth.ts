import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds (default)
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser && user.id) {
        // Create default UPSC exam reminders for new users
        const prelimsDate = new Date('2026-05-24T09:00:00') // May 24, 2026 at 9 AM
        const mainsDate = new Date('2026-08-21T09:00:00') // August 21, 2026 at 9 AM

        try {
          await prisma.$transaction([
            prisma.reminder.create({
              data: {
                userId: user.id,
                title: 'UPSC Prelims Exam',
                description: 'UPSC Civil Services Preliminary Examination',
                date: prelimsDate,
              },
            }),
            prisma.reminder.create({
              data: {
                userId: user.id,
                title: 'UPSC Mains Exam',
                description: 'UPSC Civil Services Main Examination',
                date: mainsDate,
              },
            }),
          ])
        } catch (error) {
          console.error('Error creating default reminders:', error)
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

