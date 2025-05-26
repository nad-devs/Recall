import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email"
import { prisma } from "@/lib/prisma"

// Build providers array conditionally based on available environment variables
const providers = []

// Add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
}

// Add GitHub provider if credentials are available
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }))
}

// Add Email provider if email server is configured
if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) {
  providers.push(EmailProvider({
    server: {
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM,
  }))
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Update last active timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        })
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Track sign-in analytics
      if (user.email) {
        await prisma.analytics.create({
          data: {
            userId: user.id,
            event: "user_sign_in",
            properties: JSON.stringify({
              provider: account?.provider,
              isNewUser: !user.id
            })
          }
        })
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "database",
  },
})

export { handler as GET, handler as POST } 