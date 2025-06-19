import NextAuth, { NextAuthOptions } from "next-auth"
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

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Temporarily disabled
  providers,
  session: {
    strategy: "jwt", // Pure JWT, no database
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
      
      // If this is a new sign-in with Google OAuth
      if (user && account?.provider === 'google') {
        console.log('🔍 New Google OAuth sign-in - checking for existing user')
        
        try {
          // Check if there's an existing user with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email!.toLowerCase() }
          })
          
          if (existingUser) {
            console.log('✅ Found existing user - using existing user data:', {
              existingId: existingUser.id,
              existingName: existingUser.name,
              oauthId: user.id
            })
            
            // Use the existing user's database ID instead of the OAuth ID
            token.userId = existingUser.id
            token.email = existingUser.email
            token.name = existingUser.name || user.name
            token.picture = user.image // Use OAuth profile picture
            
            console.log('🔄 Set token to use existing user ID:', existingUser.id)
          } else {
            console.log('ℹ️ No existing user found, using OAuth user data')
            token.userId = user.id
          }
        } catch (error) {
          console.error('❌ Error checking for existing user:', error)
          // Fallback to OAuth user data
          token.userId = user.id
        }
      } else if (user) {
        // First-time token creation
        token.userId = user.id
        console.log('🔄 Setting token.userId to:', user.id)
      }
      
      console.log('✅ JWT callback completed with userId:', token.userId)
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
      console.log('🔄 Sign-in callback triggered (Pure JWT mode):', {
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
      
      // For pure JWT mode, just allow all valid OAuth sign-ins
      if (user.email && account?.provider === 'google') {
        console.log('✅ Pure JWT mode - allowing Google OAuth sign-in for:', user.email)
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
        session: message.session,
        token: message.token,
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
}

const handler = NextAuth(authOptions)

console.log('✅ NextAuth configuration complete')

export { handler as GET, handler as POST } 