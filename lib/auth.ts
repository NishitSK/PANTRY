import NextAuth, { type NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        await connectDB()
        const user = await User.findOne({ email: credentials.email })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return { id: user._id.toString(), email: user.email, name: user.name || null }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.userId = (user as any).id
      return token
    },
    async session({ session, token }) {
      if (token?.userId) (session as any).user.id = token.userId
      return session
    }
  }
}

export async function getSession() {
  return getServerSession(authOptions)
}
