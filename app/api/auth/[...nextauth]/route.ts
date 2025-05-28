import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "@/lib/prisma"

console.log('🔧 NextAuth configuration loading...')

// Build providers array conditionally based on available environment variables
const providers = []

// Add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Google OAuth credentials found, adding Google provider')
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }))
} else {
  console.warn('❌ Google OAuth credentials missing:')
  console.warn('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
  console.warn('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
}

// Add GitHub provider if credentials are available
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  console.log('✅ GitHub OAuth credentials found, adding GitHub provider')
  providers.push(GitHubProvider({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }))
} else {
  console.log('ℹ️ GitHub OAuth credentials not configured (optional)')
}

console.log(`📋 Total providers configured: ${providers.length}`)

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      console.log('🔄 Session callback triggered for user:', user?.id)
      if (session.user) {
        session.user.id = user.id
        
        try {
          // Update last active timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() }
          })
          console.log('✅ User last active timestamp updated')
        } catch (error) {
          console.error('❌ Error updating user last active timestamp:', error)
        }
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log('🔄 Sign-in callback triggered:', {
        userId: user?.id,
        email: user?.email,
        provider: account?.provider
      })
      
      try {
        // Check if there's an existing email-based account with the same email
        if (user.email && account?.provider === 'google') {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() }
          })
          
          if (existingUser) {
            // This is an existing account, merge it with OAuth
            console.log('🔄 Merging existing account with OAuth for:', user.email)
            
            // Update the existing user to include OAuth data
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                image: user.image,
                lastActiveAt: new Date()
              }
            })
            
            console.log('✅ Account merge completed')
          }
        }
        
        // Track sign-in analytics
        if (user.email) {
          await prisma.analytics.create({
            data: {
              userId: user.id,
              event: "user_sign_in",
              properties: JSON.stringify({
                provider: account?.provider,
                isNewUser: !user.id,
                email: user.email
              })
            }
          })
          console.log('✅ Sign-in analytics recorded')
        }
      } catch (error) {
        console.error('❌ Error in sign-in callback:', error)
        // Don't block sign-in if analytics or merge fails
      }
      
      console.log('✅ Sign-in approved for user:', user?.email)
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl })
      
      // Always redirect to dashboard after successful authentication
      const dashboardUrl = `${baseUrl}/dashboard`
      console.log('✅ Redirecting to dashboard:', dashboardUrl)
      return dashboardUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn(message) {
      console.log('📧 NextAuth signIn event:', message)
    },
    async signOut(message) {
      console.log('📧 NextAuth signOut event:', message)
    },
    async createUser(message) {
      console.log('📧 NextAuth createUser event:', message)
    },
    async session(message) {
      console.log('📧 NextAuth session event:', message)
    }
  },
  debug: process.env.NODE_ENV === 'development',
})

console.log('✅ NextAuth configuration complete')

export { handler as GET, handler as POST } 