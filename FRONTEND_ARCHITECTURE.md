# Frontend Architecture Documentation

This document provides a comprehensive overview of the Recall frontend application built with Next.js 15, TypeScript, and modern React patterns.

## 🏗 Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **UI Framework**: Tailwind CSS 4 + Radix UI
- **State Management**: Redux Toolkit + React Context
- **Authentication**: NextAuth.js 4
- **Database ORM**: Prisma 6
- **Form Handling**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Project Structure

```
app/
├── analyze/                  # Analysis workflow pages
│   └── page.tsx             # Main analysis interface
├── concepts/                # Concept management
│   ├── page.tsx            # Concept list view
│   └── [conceptId]/        # Individual concept pages
├── conversations/           # Conversation history
│   ├── page.tsx            # Conversation list
│   └── [id]/               # Individual conversation view
├── dashboard/              # User dashboard
│   └── page.tsx           # Main dashboard
├── auth/                   # Authentication pages
│   ├── signin/            # Sign in page
│   └── callback/          # OAuth callbacks
├── api/                    # Next.js API routes
│   ├── concepts/          # Concept CRUD operations
│   ├── conversations/     # Conversation management
│   ├── extract-concepts/  # Python service integration
│   ├── auth/              # NextAuth configuration
│   └── [...]/             # Other API endpoints
├── admin/                  # Admin panel (role-restricted)
├── settings/              # User settings
├── layout.tsx             # Root layout
├── page.tsx               # Landing page
├── globals.css            # Global styles
└── actions.ts             # Server actions

components/
├── ui/                     # Reusable UI components (shadcn/ui)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── toast.tsx
│   ├── tabs.tsx
│   └── [...]/
├── concept/               # Concept-specific components
│   ├── ConceptCard.tsx    # Individual concept display
│   ├── ConceptList.tsx    # List of concepts
│   ├── ConceptForm.tsx    # Create/edit concept form
│   └── ConceptSearch.tsx  # Search functionality
├── conversation/          # Conversation components
│   ├── ConversationCard.tsx
│   ├── ConversationList.tsx
│   └── ConversationForm.tsx
├── analysis/              # Analysis workflow components
│   ├── AnalysisInterface.tsx
│   ├── ConceptExtraction.tsx
│   ├── ConceptMatching.tsx
│   └── ProgressIndicator.tsx
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Navigation.tsx
│   └── Footer.tsx
└── modals/                # Modal dialogs
    ├── UserInfoModal.tsx
    ├── ApiKeyModal.tsx
    └── ConceptMatchModal.tsx

hooks/
├── useAnalyzePage.ts      # Main analysis workflow logic
├── useAutoAnalysis.ts     # Auto-analysis features
├── useConcepts.ts         # Concept management
├── useConversations.ts    # Conversation handling
├── useAuth.ts             # Authentication state
└── useToast.ts            # Toast notifications

lib/
├── auth.ts                # Authentication configuration
├── prisma.ts              # Database client
├── openai.ts              # OpenAI integration
├── utils.ts               # Utility functions
├── validations.ts         # Zod schemas
├── constants.ts           # Application constants
├── types/                 # TypeScript type definitions
│   ├── conversation.ts    # Conversation types
│   ├── concept.ts         # Concept types
│   └── user.ts            # User types
└── utils/                 # Utility modules
    ├── conversation.ts    # Conversation utilities
    ├── auth-utils.ts      # Authentication helpers
    └── format.ts          # Formatting utilities

contexts/
├── AuthContext.tsx        # Authentication context
├── ConceptContext.tsx     # Concept state management
└── ThemeContext.tsx       # Theme switching

store/
├── index.ts               # Redux store configuration
├── slices/                # Redux slices
│   ├── authSlice.ts      # Authentication state
│   ├── conceptSlice.ts   # Concept state
│   └── uiSlice.ts        # UI state
└── middleware.ts          # Redux middleware
```

## 🔄 Core Workflows

### 1. Conversation Analysis Workflow

The analysis workflow is the core feature of Recall, handling the extraction of concepts from text.

#### Components Involved:
- `app/analyze/page.tsx` - Main analysis interface
- `hooks/useAnalyzePage.ts` - Analysis state management
- `hooks/useAutoAnalysis.ts` - Auto-analysis features
- `components/analysis/` - Analysis-specific components

#### Flow:
1. **Text Input**: User pastes conversation/notes
2. **Analysis Trigger**: `handleAnalyze()` in `useAnalyzePage`
3. **API Call**: Request to `/api/extract-concepts`
4. **Python Service**: Forwards to backend Python service
5. **Concept Extraction**: AI processes text and returns structured concepts
6. **Concept Matching**: Check for existing similar concepts
7. **User Review**: Display extracted concepts for confirmation
8. **Save/Update**: Store concepts and conversation in database

```typescript
// Example from useAnalyzePage.ts
const handleAnalyze = async () => {
  setIsAnalyzing(true)
  
  try {
    const response = await makeAuthenticatedRequest('/api/extract-concepts', {
      method: 'POST',
      body: JSON.stringify({ 
        conversation_text: conversationText,
        customApiKey: currentUsageData.customApiKey
      }),
    })
    
    const data = await response.json()
    const analysis = mapBackendResponseToAnalysis(data)
    setAnalysisResult(analysis)
    
    // Check for concept matches
    const matches = await checkForExistingConcepts(analysis.concepts)
    if (matches.length > 0) {
      setConceptMatches(matches)
      setShowConceptMatchDialog(true)
    }
  } catch (error) {
    // Error handling
  }
}
```

### 2. Concept Management System

#### Key Components:
- `app/concepts/page.tsx` - Concept listing
- `app/concept/[id]/page.tsx` - Individual concept view
- `components/concept/` - Concept-related components
- `hooks/useConcepts.ts` - Concept state management

#### Features:
- **CRUD Operations**: Create, read, update, delete concepts
- **Search & Filter**: Find concepts by title, category, or content
- **Relationship Management**: Link related concepts
- **Category Management**: Organize concepts into categories
- **Progress Tracking**: Monitor learning progress per concept

### 3. Authentication & User Management

#### Implementation:
- **NextAuth.js**: OAuth providers (Google, GitHub) + email/password
- **Session Management**: Server-side sessions with JWT
- **Route Protection**: Middleware-based authentication
- **User Context**: React context for user state

```typescript
// middleware.ts - Route protection
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token && protectedRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  return NextResponse.next()
}
```

## 🎨 UI/UX Architecture

### Design System

#### Component Library: Radix UI + Custom Components
- **Consistent**: All components follow the same design patterns
- **Accessible**: Built-in accessibility features
- **Customizable**: Tailwind CSS for styling flexibility
- **Responsive**: Mobile-first design approach

#### Theme System:
```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        },
        // Custom color palette
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    }
  }
}
```

### Responsive Design

#### Breakpoint Strategy:
- **Mobile First**: Base styles for mobile
- **Progressive Enhancement**: Add features for larger screens
- **Flexible Grid**: CSS Grid and Flexbox for layouts
- **Dynamic Components**: Components adapt to screen size

## 🔧 State Management

### Redux Toolkit Implementation

#### Store Structure:
```typescript
// store/index.ts
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    concepts: conceptSlice.reducer,
    conversations: conversationSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})
```

#### Key Slices:

**Auth Slice**: User authentication state
```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
```

**Concept Slice**: Concept management state
```typescript
interface ConceptState {
  concepts: Concept[]
  selectedConcept: Concept | null
  filters: ConceptFilters
  isLoading: boolean
  searchQuery: string
}
```

### React Context Usage

#### Strategic Context Usage:
- **Theme Context**: Light/dark mode switching
- **Auth Context**: User session management (supplementing Redux)
- **Toast Context**: Global notification system

## 📱 API Integration

### Frontend API Routes (Next.js)

#### Concept Management:
```typescript
// app/api/concepts/route.ts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const concepts = await prisma.concept.findMany({
    where: { userId: session.user.id },
    include: { conversation: true, codeSnippets: true }
  })
  
  return Response.json({ concepts })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await request.json()
  const concept = await prisma.concept.create({
    data: { ...body, userId: session.user.id }
  })
  
  return Response.json({ concept })
}
```

### External API Integration

#### Python Backend Service:
```typescript
// lib/utils/api.ts
export async function makeAuthenticatedRequest(url: string, options: RequestInit) {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response
}
```

## 🧪 Testing Strategy

### Testing Approach:
- **Unit Tests**: Individual component and hook testing
- **Integration Tests**: API route testing
- **E2E Tests**: Critical user workflows
- **Manual Testing**: UI/UX validation

### Testing Tools:
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking

## 🚀 Performance Optimization

### Next.js Optimizations:
- **Static Generation**: Pre-render pages where possible
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Bundle Analysis**: Monitor bundle size

### React Optimizations:
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive computation caching
- **Lazy Loading**: Dynamic imports for heavy components
- **Virtualization**: Large list handling

### Database Optimizations:
- **Prisma Relations**: Efficient data fetching
- **Pagination**: Limit data per request
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: Efficient database connections

## 🔒 Security Implementation

### Authentication Security:
- **CSRF Protection**: Built-in Next.js protection
- **Session Security**: HttpOnly cookies
- **Input Validation**: Zod schema validation
- **SQL Injection**: Prisma prevents SQL injection

### API Security:
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Controlled cross-origin requests
- **Environment Variables**: Secure secret management
- **Error Handling**: No sensitive data in error messages

## 📚 Development Guidelines

### Code Organization:
- **Consistent File Naming**: PascalCase for components, camelCase for utilities
- **Component Structure**: Props interface, component, default export
- **Hook Patterns**: Custom hooks for reusable logic
- **Type Safety**: Comprehensive TypeScript usage

### Best Practices:
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Favor component composition
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels and keyboard navigation

### Documentation Standards:
- **JSDoc Comments**: Function and component documentation
- **README Files**: Component usage examples
- **Type Definitions**: Clear interface definitions
- **Changelog**: Track important changes

## 🔄 Build and Deployment

### Build Process:
```bash
# Development
npm run dev              # Start development server

# Production Build
npm run build           # Build optimized production bundle
npm run start           # Start production server

# Database Operations
npm run db:migrate      # Run database migrations
npm run db:generate     # Generate Prisma client
npm run db:studio       # Database management UI
```

### Environment Configuration:
```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
PYTHON_SERVICE_URL="http://localhost:8000"
```

### Deployment Targets:
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative hosting option
- **Docker**: Containerized deployment
- **Traditional VPS**: Self-hosted deployment

This architecture provides a scalable, maintainable foundation for the Recall application while following modern React and Next.js best practices. 