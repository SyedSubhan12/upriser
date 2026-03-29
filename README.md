# ExamsValley - Educational Management Platform

## 📚 Introduction

**ExamsValley** is a comprehensive educational management platform designed to streamline learning, teaching, and administration across multiple educational boards. The platform provides role-based access for students, teachers, and administrators, enabling efficient content management, assessment, and progress tracking.

### Key Features

- 🎓 **Multi-Board Support** - CBSE, ICSE, State Boards, and more
- 👥 **Role-Based Access Control** - Student, Teacher, Admin roles
- 📖 **Study Materials Management** - Upload, organize, and access learning resources
- 📝 **Quiz & Assessment System** - Create, attempt, and grade quizzes
- 📊 **Analytics Dashboard** - Track performance and engagement metrics
- 🔔 **Announcements** - Broadcast important updates
- 📋 **Assignment Management** - Create, submit, and grade assignments
- 🔐 **Secure Authentication** - Email/password and Google OAuth support

---

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation

#### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Passport.js (Local & Google OAuth)
- **Session Management**: express-session with PostgreSQL store
- **Validation**: Zod schemas

#### Development
- **Package Manager**: npm
- **TypeScript**: Strict mode enabled
- **Hot Reload**: Vite HMR for frontend, tsx watch for backend

---

## 📁 Project Structure

```
ExamsValley/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── api/              # API client functions
│   │   ├── components/       # Reusable UI components
│   │   │   ├── layout/       # Layout components (headers, sidebars)
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── context/          # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   ├── layouts/          # Page layouts (Student, Teacher, Admin)
│   │   ├── lib/              # Utility functions
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # Admin panel pages
│   │   │   ├── student/      # Student dashboard pages
│   │   │   ├── teacher/      # Teacher dashboard pages
│   │   │   └── public/       # Public pages (login, register)
│   │   ├── App.tsx           # Main app component with routing
│   │   └── main.tsx          # App entry point
│   └── index.html
│
├── server/                    # Backend Express application
│   ├── admin-routes.ts       # Admin-specific API routes
│   ├── auth.ts               # Passport authentication config
│   ├── index.ts              # Server entry point
│   ├── middleware/           # Express middleware
│   │   └── rbac.ts           # Role-based access control
│   ├── role-manager.ts       # Role hierarchy management
│   ├── routes.ts             # Main API routes
│   ├── seed-admin.ts         # Database seeding script
│   └── storage.ts            # Database access layer
│
├── shared/                    # Shared code between client & server
│   └── schema.ts             # Database schema & Zod validators
│
├── db/                        # Database migrations
│   └── migrations/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## 🎭 User Roles & Permissions

### Role Hierarchy

```
Admin > Teacher > Student
```

### Student Role
**Permissions:**
- View assigned study materials
- Attempt quizzes and view results
- Submit assignments
- View announcements
- Update own profile
- Track own progress

**Access:**
- `/student/*` routes
- Read-only access to materials, quizzes, assignments

### Teacher Role
**Permissions:**
- All student permissions, plus:
- Create and manage study materials
- Create and grade quizzes
- Create and grade assignments
- Post announcements
- View student submissions and results

**Access:**
- `/teacher/*` routes
- `/student/*` routes (can view student perspective)
- Create/Update/Delete own content

### Admin Role
**Permissions:**
- All teacher permissions, plus:
- Manage users (create, edit, activate/deactivate)
- Manage boards and subjects
- Moderate all content
- View platform analytics
- Configure system settings
- Access all user data

**Access:**
- `/admin/*` routes
- Full CRUD on all resources
- System configuration

---

## 🔐 Authentication & Security

### Authentication Methods

1. **Email/Password** (Local Strategy)
   - User registration with email verification
   - Secure password storage (hashed)
   - Session-based authentication

2. **Google OAuth 2.0**
   - Single Sign-On (SSO)
   - Automatic account creation
   - Profile data sync

### Session Management

- **Storage**: PostgreSQL-backed sessions
- **Cookie**: `connect.sid` (HTTP-only, secure in production)
- **Expiration**: Configurable session timeout
- **Polling**: Frontend checks auth status every 10 seconds

### Security Features

- ✅ **RBAC Middleware** - Route protection by role
- ✅ **Session Validation** - Active user check on every request
- ✅ **Auto-Logout** - Deactivated users logged out within 10 seconds
- ✅ **CORS Protection** - Configured for production
- ✅ **Input Validation** - Zod schemas on all endpoints
- ✅ **SQL Injection Prevention** - Drizzle ORM parameterized queries

---

## 🗄️ Database Schema

### Core Tables

#### `users`
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string | null
  name: string
  googleId: string | null
  authProvider: 'local' | 'google'
  role: 'student' | 'teacher' | 'admin'
  avatar: string | null
  boardIds: string[] | null
  subjectIds: string[] | null
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
  lastLoginAt: timestamp | null
}
```

#### `boards`
```typescript
{
  id: string (UUID)
  name: string
  code: string (unique)
  description: string | null
  logo: string | null
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `subjects`
```typescript
{
  id: string (UUID)
  name: string
  code: string
  boardId: string (FK -> boards)
  description: string | null
  icon: string | null
  isActive: boolean
  createdAt: timestamp
}
```

#### `topics`
```typescript
{
  id: string (UUID)
  name: string
  subjectId: string (FK -> subjects)
  parentId: string | null (self-referential)
  order: number
  description: string | null
  isActive: boolean
  createdAt: timestamp
}
```

#### `materials`
```typescript
{
  id: string (UUID)
  title: string
  description: string | null
  type: 'notes' | 'video' | 'document' | 'link'
  content: string
  boardId: string (FK)
  subjectId: string (FK)
  topicId: string (FK)
  teacherId: string (FK -> users)
  status: 'pending' | 'approved' | 'rejected'
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### `quizzes`
```typescript
{
  id: string (UUID)
  title: string
  description: string | null
  type: 'practice' | 'assessment'
  boardId: string (FK)
  subjectId: string (FK)
  topicId: string (FK)
  teacherId: string (FK)
  timeLimit: number | null (minutes)
  passingScore: number
  isActive: boolean
  createdAt: timestamp
}
```

#### `questions`
```typescript
{
  id: string (UUID)
  quizId: string (FK)
  question: string
  type: 'mcq' | 'true-false' | 'short-answer'
  options: string[] | null
  correctAnswer: string
  points: number
  order: number
}
```

#### `quiz_attempts`
```typescript
{
  id: string (UUID)
  quizId: string (FK)
  userId: string (FK)
  answers: Record<string, string>
  score: number
  totalPoints: number
  startedAt: timestamp
  completedAt: timestamp | null
}
```

#### `assignments`
```typescript
{
  id: string (UUID)
  title: string
  description: string
  boardId: string (FK)
  subjectId: string (FK)
  teacherId: string (FK)
  dueDate: timestamp
  maxPoints: number
  createdAt: timestamp
}
```

#### `submissions`
```typescript
{
  id: string (UUID)
  assignmentId: string (FK)
  studentId: string (FK)
  content: string
  attachments: string[] | null
  score: number | null
  feedback: string | null
  submittedAt: timestamp
  gradedAt: timestamp | null
}
```

#### `announcements`
```typescript
{
  id: string (UUID)
  title: string
  content: string
  authorId: string (FK -> users)
  boardId: string | null (FK)
  subjectId: string | null (FK)
  priority: 'low' | 'medium' | 'high'
  createdAt: timestamp
}
```

#### `system_events`
```typescript
{
  id: string (UUID)
  type: string
  message: string
  metadata: Record<string, any> | null
  createdAt: timestamp
}
```

---

## 📡 API Documentation

### Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com
```

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "student"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "isActive": true
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student"
}
```

#### GET `/api/auth/me`
Get current authenticated user.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "student",
  "isActive": true
}
```

**Response:** `403 Forbidden` (if account deactivated)
```json
{
  "error": "Account disabled",
  "message": "Your account has been disabled. Please contact an administrator."
}
```

#### POST `/api/auth/logout`
Logout current user.

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/google`
Initiate Google OAuth flow.

**Redirects to:** Google OAuth consent screen

#### GET `/api/auth/google/callback`
Google OAuth callback handler.

**Redirects to:** `/student/dashboard` on success

---

### Admin API Endpoints

All admin endpoints require authentication and admin role.

**Headers Required:**
```
Cookie: connect.sid=<session-id>
```

#### Boards Management

##### GET `/api/admin/boards`
List all boards.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "CBSE",
    "code": "CBSE",
    "description": "Central Board of Secondary Education",
    "isActive": true,
    "createdAt": "2025-12-10T00:00:00Z"
  }
]
```

##### POST `/api/admin/boards`
Create a new board.

**Request Body:**
```json
{
  "name": "ICSE",
  "code": "ICSE",
  "description": "Indian Certificate of Secondary Education",
  "isActive": true
}
```

**Response:** `201 Created`

##### PATCH `/api/admin/boards/:id`
Update a board.

**Request Body:**
```json
{
  "name": "Updated Name",
  "isActive": false
}
```

**Response:** `200 OK`

##### DELETE `/api/admin/boards/:id`
Deactivate a board (soft delete).

**Response:** `200 OK`

#### Users Management

##### GET `/api/admin/users`
List all users with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20)
- `role` (string: 'student' | 'teacher' | 'admin')
- `status` (string: 'ACTIVE' | 'INACTIVE')

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "avatar": null,
      "status": "ACTIVE",
      "createdAt": "2025-12-10T00:00:00Z",
      "lastLoginAt": "2025-12-10T01:00:00Z",
      "boardIds": ["board-uuid"],
      "subjectIds": ["subject-uuid"]
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

##### GET `/api/admin/users/:id`
Get a single user by ID.

**Response:** `200 OK`

##### POST `/api/admin/users`
Create a new user.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "teacher",
  "boardId": "board-uuid",
  "status": "ACTIVE"
}
```

**Response:** `201 Created`

##### PATCH `/api/admin/users/:id`
Update a user.

**Request Body:**
```json
{
  "role": "teacher",
  "status": "INACTIVE"
}
```

**Response:** `200 OK`

**Note:** Deactivating a user will log them out within 10 seconds.

##### DELETE `/api/admin/users/:id`
Deactivate a user (soft delete).

**Response:** `200 OK`

#### Content Moderation

##### GET `/api/admin/materials`
List all materials for moderation.

**Query Parameters:**
- `status` (string: 'PENDING' | 'APPROVED' | 'REJECTED')

**Response:** `200 OK`

##### PATCH `/api/admin/materials/:id`
Approve or reject a material.

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Response:** `200 OK`

#### Analytics

##### GET `/api/admin/overview`
Get platform overview statistics.

**Response:** `200 OK`
```json
{
  "stats": {
    "totalStudents": 150,
    "totalTeachers": 25,
    "totalBoards": 5,
    "totalMaterials": 320,
    "dailyActiveUsers": 45,
    "pendingMaterials": 12
  },
  "recentEvents": [
    {
      "id": "uuid",
      "type": "NEW_BOARD",
      "message": "Board CBSE was created",
      "createdAt": "2025-12-10T00:00:00Z"
    }
  ]
}
```

---

### Public API Endpoints

#### GET `/api/boards`
List all active boards.

**Response:** `200 OK`

#### GET `/api/subjects`
List subjects.

**Query Parameters:**
- `boardId` (string, optional)

**Response:** `200 OK`

#### GET `/api/topics`
List topics.

**Query Parameters:**
- `subjectId` (string, required)

**Response:** `200 OK`

#### GET `/api/materials`
List study materials.

**Query Parameters:**
- `boardId` (string)
- `subjectId` (string)
- `topicId` (string)
- `type` (string)
- `status` (string)

**Response:** `200 OK`

#### GET `/api/quizzes`
List quizzes.

**Query Parameters:**
- `boardId`, `subjectId`, `topicId`, `type`

**Response:** `200 OK`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ExamsValley.git
cd ExamsValley
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ExamsValley

# Session
SESSION_SECRET=your-super-secret-session-key-change-this

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Server
PORT=5000
NODE_ENV=development
```

4. **Set up the database**

```bash
# Run migrations
npm run db:push

# Seed admin user
npm run seed:admin
```

Default admin credentials:
- Email: `admin@ExamsValley.com`
- Password: `admin123`

5. **Start the development server**

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (frontend + backend)
npm run dev:server       # Start backend only
npm run dev:client       # Start frontend only

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)
npm run seed:admin       # Create admin user

# Build
npm run build            # Build for production
npm run start            # Start production server

# Type Checking
npm run check            # Run TypeScript type checking
```

### Project Commands

```bash
# Add a new shadcn/ui component
npx shadcn-ui@latest add <component-name>

# Generate database migration
npm run db:generate

# Apply migrations
npm run db:migrate
```

---

## 📦 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables (Production)

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<strong-random-secret>
NODE_ENV=production
PORT=5000
```

### Deployment Platforms

- **Recommended**: Railway, Render, Fly.io
- **Database**: Neon, Supabase, or managed PostgreSQL
- **Static Assets**: Serve via CDN (Cloudflare, AWS CloudFront)

---

## 🔧 Configuration

### Role Hierarchy

Defined in `server/role-manager.ts`:

```typescript
const roleHierarchy = {
  admin: 3,
  teacher: 2,
  student: 1,
};
```

### Session Configuration

In `server/index.ts`:

```typescript
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
}
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- **Syed Subhan** - Initial development

---

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/ExamsValley/issues)
- Email: support@ExamsValley.com

---

**Built with ❤️ for education**
