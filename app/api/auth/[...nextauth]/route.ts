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
    strategy: "jwt", // Temporarily switch to JWT to test
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('🔄 JWT callback triggered:', {
        tokenExists: !!token,
        userExists: !!user,
        accountExists: !!account,
        userEmail: user?.email || token?.email,
        userId: user?.id || token?.sub
      })
      
      // Include user ID in the token
      if (user) {
        token.userId = user.id
        console.log('🔄 Setting token.userId to:', user.id)
      }
      
      console.log('✅ JWT callback completed')
      return token
    },
    async session({ session, token }) {
      console.log('🔄 Session callback triggered (JWT mode)')
      console.log('🔄 Session data received:', {
        sessionExists: !!session,
        tokenExists: !!token,
        sessionUserEmail: session?.user?.email,
        tokenEmail: token?.email,
        tokenUserId: token?.userId
      })
      
      try {
        if (session.user && token) {
          session.user.id = token.userId as string || token.sub as string
          console.log('🔄 Setting session.user.id to:', session.user.id)
        }
        
        console.log('✅ Session callback completed successfully (JWT mode)')
        console.log('✅ Final session object:', {
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          expires: session?.expires
        })
        return session
      } catch (sessionError) {
        console.error('❌ CRITICAL: Session callback failed (JWT mode):', sessionError)
        
        // Return a minimal session to prevent complete failure
        return {
          user: {
            id: token?.userId as string || token?.sub as string || 'unknown',
            email: token?.email as string || session?.user?.email || 'unknown',
            name: token?.name as string || session?.user?.name || 'User'
          },
          expires: session?.expires || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    },
    async signIn({ user, account, profile }) {
      console.log('🔄 Sign-in callback triggered:', {
        userId: user?.id,
        email: user?.email,
        provider: account?.provider,
        accountType: account?.type,
        timestamp: new Date().toISOString()
      })
      
      console.log('🔍 Sign-in callback full details:', {
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        } : 'None',
        account: account ? {
          provider: account.provider,
          type: account.type,
          providerAccountId: account.providerAccountId
        } : 'None',
        profile: profile ? 'Present' : 'None'
      })
      
      try {
        // Special handling for arjunnadar2003@gmail.com to debug the issue
        if (user.email === 'arjunnadar2003@gmail.com') {
          console.log('🎯 SPECIAL DEBUG - Processing arjunnadar2003@gmail.com login')
        }
        
        // For Google OAuth, check if user already exists
        if (user.email && account?.provider === 'google') {
          console.log('🔍 Checking for existing user with email:', user.email)
          
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
            include: {
              accounts: true
            }
          })
          
          if (existingUser) {
            console.log('✅ Found existing user - will use existing account:', {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              accountCount: existingUser.accounts.length
            })
            
            // Just allow sign-in - let NextAuth handle the OAuth account linkage
            console.log('✅ Allowing sign-in to use existing user account')
            return true
          } else {
            console.log('ℹ️ No existing user found, will create new OAuth user')
          }
        }
        
        console.log('✅ Sign-in approved for user:', user?.email)
        return true
        
      } catch (error) {
        console.error('❌ Error in sign-in callback:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          userEmail: user?.email,
          provider: account?.provider,
          timestamp: new Date().toISOString()
        })
        
        // Don't block sign-in
        console.log('⚠️ Allowing sign-in despite error (to prevent blocking)')
        return true
      }
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
      console.log('📧 NextAuth signIn EVENT:', {
        user: message.user ? {
          id: message.user.id,
          email: message.user.email,
          name: message.user.name
        } : 'None',
        account: message.account ? {
          provider: message.account.provider,
          type: message.account.type
        } : 'None',
        timestamp: new Date().toISOString()
      })
    },
    async signOut(message) {
      console.log('📧 NextAuth signOut EVENT:', {
        user: message.user ? {
          id: message.user.id,
          email: message.user.email
        } : 'None',
        timestamp: new Date().toISOString()
      })
    },
    async createUser(message) {
      console.log('📧 NextAuth createUser EVENT:', {
        user: message.user ? {
          id: message.user.id,
          email: message.user.email,
          name: message.user.name
        } : 'None',
        timestamp: new Date().toISOString()
      })
    },
    async session(message) {
      console.log('📧 NextAuth session EVENT:', {
        session: message.session ? {
          expires: message.session.expires,
          hasUser: !!message.session.user
        } : 'None',
        token: message.token ? 'Present' : 'None',
        timestamp: new Date().toISOString()
      })
    },
    async linkAccount(message) {
      console.log('📧 NextAuth linkAccount EVENT:', {
        account: message.account ? {
          provider: message.account.provider,
          type: message.account.type,
          providerAccountId: message.account.providerAccountId
        } : 'None',
        profile: message.profile ? 'Present' : 'None',
        timestamp: new Date().toISOString()
      })
    }
  },
  debug: process.env.NODE_ENV === 'development',
})

console.log('✅ NextAuth configuration complete')

export { handler as GET, handler as POST } 