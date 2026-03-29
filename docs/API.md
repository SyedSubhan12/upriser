# ExamsValley API Reference

Complete API documentation for the ExamsValley Educational Management Platform.

## Table of Contents

1. [Authentication](#authentication)
2. [Admin APIs](#admin-apis)
3. [Student APIs](#student-apis)
4. [Teacher APIs](#teacher-apis)
5. [Public APIs](#public-apis)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Base Information

**Base URL:** `http://localhost:5000` (development)

**Content-Type:** `application/json`

**Authentication:** Session-based (cookie: `connect.sid`)

---

## Authentication

### Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Create a new user account.

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "name": "John Student",
  "role": "student"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "student@example.com",
  "name": "John Student",
  "role": "student",
  "authProvider": "local",
  "isActive": true,
  "createdAt": "2025-12-10T00:00:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - Email already exists

---

### Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and create session.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@ExamsValley.com",
  "password": "admin123"
}
```

**Response:** `200 OK`
```json
{
  "id": "622fa070-4829-4015-95a0-4fba9a1bea25",
  "email": "admin@ExamsValley.com",
  "name": "System Administrator",
  "role": "admin",
  "avatar": null,
  "boardIds": null,
  "subjectIds": null,
  "isActive": true,
  "lastLoginAt": "2025-12-10T02:47:41.024Z"
}
```

**Sets Cookie:**
```
Set-Cookie: connect.sid=s%3A...; Path=/; HttpOnly
```

**Errors:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account is disabled

---

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Description:** Get currently authenticated user information.

**Request:**
```http
GET /api/auth/me
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "id": "622fa070-4829-4015-95a0-4fba9a1bea25",
  "email": "admin@ExamsValley.com",
  "name": "System Administrator",
  "role": "admin",
  "avatar": null,
  "isActive": true
}
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Account disabled (session destroyed)

---

### Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Destroy current session and logout user.

**Request:**
```http
POST /api/auth/logout
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Google OAuth

**Endpoint:** `GET /api/auth/google`

**Description:** Initiate Google OAuth 2.0 flow.

**Request:**
```http
GET /api/auth/google
```

**Response:** `302 Redirect` to Google OAuth consent screen

---

**Callback Endpoint:** `GET /api/auth/google/callback`

**Description:** Handle Google OAuth callback.

**Response:** `302 Redirect` to `/student/dashboard` on success

---

## Admin APIs

All admin endpoints require:
- Authentication (session cookie)
- Admin role

### Boards Management

#### List Boards

**Endpoint:** `GET /api/admin/boards`

**Request:**
```http
GET /api/admin/boards
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
[
  {
    "id": "5fe33b2c-d677-423b-896a-2de39e284e68",
    "name": "CBSE",
    "code": "CBSE",
    "description": "Central Board of Secondary Education",
    "isActive": true,
    "createdAt": "2025-12-10T02:16:51.230Z"
  },
  {
    "id": "7adc8537-4c73-43d7-aa56-c8d041188c1a",
    "name": "State Board Maharashtra",
    "code": "MSBSHSE",
    "description": "Maharashtra State Board",
    "isActive": false,
    "createdAt": "2025-12-10T02:30:50.805Z"
  }
]
```

---

#### Create Board

**Endpoint:** `POST /api/admin/boards`

**Request:**
```http
POST /api/admin/boards
Cookie: connect.sid=s%3A...
Content-Type: application/json

{
  "name": "ICSE",
  "code": "ICSE",
  "description": "Indian Certificate of Secondary Education",
  "isActive": true
}
```

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "name": "ICSE",
  "code": "ICSE",
  "description": "Indian Certificate of Secondary Education",
  "logo": null,
  "isActive": true,
  "createdAt": "2025-12-10T03:00:00.000Z",
  "updatedAt": "2025-12-10T03:00:00.000Z"
}
```

**Validation Rules:**
- `name`: Required, string
- `code`: Required, string, unique, 2+ characters
- `description`: Optional, string
- `isActive`: Optional, boolean (default: true)

**Errors:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin or account disabled

---

#### Update Board

**Endpoint:** `PATCH /api/admin/boards/:id`

**Request:**
```http
PATCH /api/admin/boards/5fe33b2c-d677-423b-896a-2de39e284e68
Cookie: connect.sid=s%3A...
Content-Type: application/json

{
  "description": "Updated description",
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "id": "5fe33b2c-d677-423b-896a-2de39e284e68",
  "name": "CBSE",
  "code": "CBSE",
  "description": "Updated description",
  "isActive": false,
  "createdAt": "2025-12-10T02:16:51.230Z",
  "updatedAt": "2025-12-10T03:00:00.000Z"
}
```

**System Event Created:**
```json
{
  "type": "BOARD_DEACTIVATED",
  "message": "Board CBSE was deactivated"
}
```

---

#### Delete Board

**Endpoint:** `DELETE /api/admin/boards/:id`

**Description:** Soft delete (deactivate) a board.

**Request:**
```http
DELETE /api/admin/boards/5fe33b2c-d677-423b-896a-2de39e284e68
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "id": "5fe33b2c-d677-423b-896a-2de39e284e68",
  "name": "CBSE",
  "isActive": false
}
```

---

### Users Management

#### List Users

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)
- `role` (string: 'student' | 'teacher' | 'admin')
- `status` (string: 'ACTIVE' | 'INACTIVE')

**Request:**
```http
GET /api/admin/users?page=1&pageSize=10&role=student&status=ACTIVE
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "user-uuid",
      "name": "John Student",
      "email": "john@example.com",
      "role": "student",
      "avatar": "https://example.com/avatar.jpg",
      "board": {
        "id": "board-uuid",
        "name": "CBSE"
      },
      "status": "ACTIVE",
      "createdAt": "2025-12-09T00:00:00.000Z",
      "lastLoginAt": "2025-12-10T02:00:00.000Z",
      "boardIds": ["board-uuid"],
      "subjectIds": ["subject-uuid-1", "subject-uuid-2"]
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 45
  }
}
```

---

#### Get User Details

**Endpoint:** `GET /api/admin/users/:id`

**Request:**
```http
GET /api/admin/users/622fa070-4829-4015-95a0-4fba9a1bea25
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "id": "622fa070-4829-4015-95a0-4fba9a1bea25",
  "name": "System Administrator",
  "email": "admin@ExamsValley.com",
  "role": "admin",
  "avatar": null,
  "board": null,
  "status": "ACTIVE",
  "createdAt": "2025-12-09T07:42:29.450Z",
  "lastLoginAt": "2025-12-10T02:47:41.024Z",
  "boardIds": [],
  "subjectIds": []
}
```

---

#### Create User

**Endpoint:** `POST /api/admin/users`

**Request:**
```http
POST /api/admin/users
Cookie: connect.sid=s%3A...
Content-Type: application/json

{
  "name": "Jane Teacher",
  "email": "jane@example.com",
  "role": "teacher",
  "boardId": "board-uuid",
  "status": "ACTIVE"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-user-uuid",
  "name": "Jane Teacher",
  "email": "jane@example.com",
  "role": "teacher",
  "status": "ACTIVE",
  "boardIds": ["board-uuid"],
  "createdAt": "2025-12-10T03:00:00.000Z"
}
```

**Note:** A temporary password is auto-generated and should be sent to the user via email (feature to be implemented).

---

#### Update User

**Endpoint:** `PATCH /api/admin/users/:id`

**Request:**
```http
PATCH /api/admin/users/user-uuid
Cookie: connect.sid=s%3A...
Content-Type: application/json

{
  "role": "teacher",
  "status": "INACTIVE"
}
```

**Response:** `200 OK`
```json
{
  "id": "user-uuid",
  "name": "John Student",
  "email": "john@example.com",
  "role": "teacher",
  "status": "INACTIVE",
  "updatedAt": "2025-12-10T03:00:00.000Z"
}
```

**Side Effects:**
- If `status` changed to `INACTIVE`, user is logged out within 10 seconds
- System event created for status/role changes

---

#### Delete User

**Endpoint:** `DELETE /api/admin/users/:id`

**Description:** Soft delete (deactivate) a user.

**Request:**
```http
DELETE /api/admin/users/user-uuid
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "id": "user-uuid",
  "status": "INACTIVE"
}
```

---

### Content Moderation

#### List Materials for Moderation

**Endpoint:** `GET /api/admin/materials`

**Query Parameters:**
- `status` (string: 'PENDING' | 'APPROVED' | 'REJECTED')

**Request:**
```http
GET /api/admin/materials?status=PENDING
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
[
  {
    "id": "material-uuid",
    "title": "Quadratic Equations Notes",
    "description": "Comprehensive notes on quadratic equations",
    "type": "notes",
    "status": "PENDING",
    "teacher": {
      "id": "teacher-uuid",
      "name": "Jane Teacher"
    },
    "board": "CBSE",
    "subject": "Mathematics",
    "topic": "Algebra",
    "createdAt": "2025-12-09T00:00:00.000Z"
  }
]
```

---

#### Approve/Reject Material

**Endpoint:** `PATCH /api/admin/materials/:id`

**Request:**
```http
PATCH /api/admin/materials/material-uuid
Cookie: connect.sid=s%3A...
Content-Type: application/json

{
  "status": "APPROVED"
}
```

**Response:** `200 OK`
```json
{
  "id": "material-uuid",
  "status": "APPROVED",
  "updatedAt": "2025-12-10T03:00:00.000Z"
}
```

---

### Analytics

#### Get Platform Overview

**Endpoint:** `GET /api/admin/overview`

**Request:**
```http
GET /api/admin/overview
Cookie: connect.sid=s%3A...
```

**Response:** `200 OK`
```json
{
  "stats": {
    "totalStudents": 150,
    "totalTeachers": 25,
    "totalBoards": 5,
    "totalMaterials": 320,
    "dailyActiveUsers": 0,
    "pendingMaterials": 12
  },
  "recentEvents": [
    {
      "id": "event-uuid",
      "type": "NEW_BOARD",
      "message": "Board ICSE was created",
      "createdAt": "2025-12-10T02:55:06.860Z"
    },
    {
      "id": "event-uuid-2",
      "type": "USER_ACTIVATED",
      "message": "User John Student was activated",
      "createdAt": "2025-12-10T02:50:00.000Z"
    }
  ]
}
```

---

## Public APIs

### Boards

#### List Active Boards

**Endpoint:** `GET /api/boards`

**Request:**
```http
GET /api/boards
```

**Response:** `200 OK`
```json
[
  {
    "id": "board-uuid",
    "name": "CBSE",
    "code": "CBSE",
    "description": "Central Board of Secondary Education",
    "logo": null,
    "isActive": true
  }
]
```

---

### Subjects

#### List Subjects

**Endpoint:** `GET /api/subjects`

**Query Parameters:**
- `boardId` (string, optional) - Filter by board

**Request:**
```http
GET /api/subjects?boardId=board-uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "subject-uuid",
    "name": "Mathematics",
    "code": "MATH",
    "boardId": "board-uuid",
    "description": "Mathematics for Class 10",
    "icon": null,
    "isActive": true
  }
]
```

---

### Topics

#### List Topics

**Endpoint:** `GET /api/topics`

**Query Parameters:**
- `subjectId` (string, required) - Filter by subject

**Request:**
```http
GET /api/topics?subjectId=subject-uuid
```

**Response:** `200 OK`
```json
[
  {
    "id": "topic-uuid",
    "name": "Algebra",
    "subjectId": "subject-uuid",
    "parentId": null,
    "order": 0,
    "description": "Algebraic expressions and equations",
    "isActive": true
  },
  {
    "id": "topic-uuid-2",
    "name": "Linear Equations",
    "subjectId": "subject-uuid",
    "parentId": "topic-uuid",
    "order": 0,
    "description": "Solving linear equations",
    "isActive": true
  }
]
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Invalid request data or validation failed |
| `401` | Unauthorized | Not authenticated |
| `403` | Forbidden | Authenticated but not authorized (wrong role or account disabled) |
| `404` | Not Found | Resource not found |
| `409` | Conflict | Resource already exists (e.g., duplicate email) |
| `500` | Internal Server Error | Server error |

### Common Error Examples

#### Validation Error
```json
{
  "error": "Validation failed",
  "message": "Invalid input: code must be at least 2 characters"
}
```

#### Authentication Error
```json
{
  "error": "Not authenticated",
  "message": "Please log in to access this resource"
}
```

#### Authorization Error
```json
{
  "error": "Forbidden",
  "message": "This resource requires admin role or higher. Your role: student"
}
```

#### Account Disabled Error
```json
{
  "error": "Account disabled",
  "message": "Your account has been disabled. Please contact an administrator."
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in future versions.

**Planned limits:**
- Authentication endpoints: 5 requests/minute
- Public APIs: 100 requests/minute
- Admin APIs: 200 requests/minute

---

## Webhooks (Future Feature)

Webhooks for real-time notifications will be implemented in v2.0:

- User account changes
- Content approval/rejection
- Quiz submissions
- Assignment submissions

---

## WebSocket Events (Future Feature)

Real-time updates via WebSockets:

- `account-deactivated` - User account disabled
- `new-announcement` - New announcement posted
- `material-approved` - Material approved by admin
- `quiz-graded` - Quiz graded by teacher

---

## Changelog

### Version 1.0.0 (Current)

**Features:**
- User authentication (email/password, Google OAuth)
- Role-based access control (Student, Teacher, Admin)
- Boards, subjects, and topics management
- Study materials CRUD
- Quiz system
- Assignment management
- Admin panel with analytics
- Auto-logout for deactivated users

**Known Limitations:**
- No email notifications
- No file upload support
- No real-time updates (polling-based)
- No rate limiting

---

## Support

For API support:
- Documentation: This file
- Issues: GitHub Issues
- Email: api-support@ExamsValley.com

---

**Last Updated:** December 10, 2025
