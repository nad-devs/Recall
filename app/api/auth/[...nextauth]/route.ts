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
    authorization: {
      params: {
        prompt: "select_account", // Force account selection
        access_type: "offline",
        response_type: "code"
      }
    }
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
        provider: account?.provider,
        accountType: account?.type,
        timestamp: new Date().toISOString()
      })
      
      let existingUser: any = null
      
      try {
        // Special handling for arjunnadar2003@gmail.com to debug the issue
        if (user.email === 'arjunnadar2003@gmail.com') {
          console.log('🎯 SPECIAL DEBUG - Processing arjunnadar2003@gmail.com login')
        }
        
        // Check if there's an existing email-based account with the same email
        if (user.email && account?.provider === 'google') {
          console.log('🔍 Checking for existing user with email:', user.email)
          
          existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
            include: {
              accounts: true,
              sessions: true
            }
          })
          
          if (existingUser) {
            console.log('🔄 Found existing user:', {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              accountCount: existingUser.accounts.length,
              sessionCount: existingUser.sessions.length,
              createdAt: existingUser.createdAt
            })
            
            // Check if this user already has a Google OAuth account
            const hasGoogleAccount = existingUser.accounts.some((acc: any) => acc.provider === 'google')
            
            if (hasGoogleAccount) {
              console.log('✅ User already has Google OAuth account, allowing sign-in')
              
              // For debug: log the existing Google account details
              const googleAccount = existingUser.accounts.find((acc: any) => acc.provider === 'google')
              console.log('📱 Existing Google account:', {
                provider: googleAccount?.provider,
                providerAccountId: googleAccount?.providerAccountId,
                type: googleAccount?.type
              })
              
              return true
            }
            
            // This is an existing email-based account, merge it with OAuth
            console.log('🔄 Merging existing email-based account with OAuth for:', user.email)
            
            try {
              // Clean up any existing sessions that might conflict
              const deletedSessions = await prisma.session.deleteMany({
                where: { userId: existingUser.id }
              })
              console.log(`🧹 Cleaned up ${deletedSessions.count} existing sessions for user`)
              
              // Update the existing user to include OAuth data
              const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  image: user.image,
                  lastActiveAt: new Date()
                }
              })
              console.log('✅ User updated successfully:', {
                id: updatedUser.id,
                name: updatedUser.name,
                image: updatedUser.image ? 'Set' : 'Not set'
              })
              
              console.log('✅ Account merge completed successfully')
              return true
              
            } catch (mergeError) {
              console.error('❌ Error during account merge:', mergeError)
              console.error('❌ Merge error details:', {
                name: mergeError instanceof Error ? mergeError.name : 'Unknown',
                message: mergeError instanceof Error ? mergeError.message : 'Unknown error',
                stack: mergeError instanceof Error ? mergeError.stack : 'No stack trace',
                userId: existingUser.id,
                userEmail: existingUser.email
              })
              
              // Still allow sign-in, let NextAuth create a new account/session
              console.log('⚠️ Allowing sign-in despite merge error')
              return true
            }
          } else {
            console.log('ℹ️ No existing user found, will create new OAuth user')
            console.log('📝 New user will be created with:', {
              email: user.email,
              name: user.name,
              image: user.image
            })
          }
        }
        
        // Track sign-in analytics (but don't block if it fails)
        try {
          if (user.email) {
            await prisma.analytics.create({
              data: {
                userId: user.id,
                event: "user_sign_in",
                properties: JSON.stringify({
                  provider: account?.provider,
                  isNewUser: !user.id,
                  email: user.email,
                  mergeAttempted: !!existingUser,
                  timestamp: new Date().toISOString()
                })
              }
            })
            console.log('✅ Sign-in analytics recorded')
          }
        } catch (analyticsError) {
          console.error('⚠️ Analytics recording failed (non-blocking):', analyticsError)
        }
        
      } catch (error) {
        console.error('❌ Error in sign-in callback:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          userEmail: user?.email,
          provider: account?.provider,
          timestamp: new Date().toISOString()
        })
        
        // For arjunnadar2003@gmail.com, be extra cautious
        if (user.email === 'arjunnadar2003@gmail.com') {
          console.error('🚨 CRITICAL ERROR for arjunnadar2003@gmail.com:', error)
        }
        
        // Don't block sign-in completely, but log the issue
        console.log('⚠️ Allowing sign-in despite error (to prevent blocking)')
        return true
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