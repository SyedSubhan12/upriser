# Data Models

This document outlines the data schema used in the application, defined in `shared/schema.ts`.

## Enums

- **UserRole**: `student`, `teacher`, `admin`
- **ResourceType**: `past_paper`, `notes`, `video`, `worksheet`
- **ContentStatus**: `pending`, `approved`, `rejected`
- **AssignmentStatus**: `pending`, `submitted`, `graded`
- **QuizType**: `practice`, `mock`

## Entities

### Users
Stores user account information.
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String
- `name`: String
- `role`: UserRole (Default: student)
- `avatar`: String (Optional URL)
- `boardIds`: Array of Strings (Optional)
- `subjectIds`: Array of Strings (Optional)
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp

### Boards
Educational boards (e.g., CBSE, ICSE).
- `id`: UUID (Primary Key)
- `name`: String
- `code`: String (Unique)
- `description`: String (Optional)
- `logo`: String (Optional URL)
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp

### Subjects
Subjects belonging to a specific board.
- `id`: UUID (Primary Key)
- `name`: String
- `code`: String
- `boardId`: UUID (Foreign Key -> Boards)
- `description`: String (Optional)
- `icon`: String (Optional)
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp

### Topics
Hierarchical topics within a subject.
- `id`: UUID (Primary Key)
- `name`: String
- `subjectId`: UUID (Foreign Key -> Subjects)
- `parentId`: UUID (Optional, Self-reference for sub-topics)
- `order`: Integer (Default: 0)
- `description`: String (Optional)
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp

### Materials
Study materials like notes, videos, past papers.
- `id`: UUID (Primary Key)
- `title`: String
- `description`: String (Optional)
- `type`: ResourceType
- `boardId`: UUID
- `subjectId`: UUID
- `topicId`: UUID (Optional)
- `year`: Integer (Optional)
- `difficulty`: String (Optional)
- `fileUrl`: String (Optional)
- `videoUrl`: String (Optional)
- `uploaderId`: UUID (Foreign Key -> Users)
- `status`: ContentStatus (Default: pending)
- `viewCount`: Integer
- `downloadCount`: Integer
- `createdAt`: Timestamp

### Quizzes
Assessments and practice tests.
- `id`: UUID (Primary Key)
- `title`: String
- `description`: String (Optional)
- `boardId`: UUID
- `subjectId`: UUID
- `topicId`: UUID (Optional)
- `type`: QuizType (Default: practice)
- `duration`: Integer (Optional, minutes)
- `isTimed`: Boolean (Default: false)
- `creatorId`: UUID (Foreign Key -> Users)
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp

### Questions
Questions belonging to a quiz.
- `id`: UUID (Primary Key)
- `quizId`: UUID (Foreign Key -> Quizzes)
- `questionText`: String
- `options`: Array of Strings
- `correctOptionIndex`: Integer
- `explanation`: String (Optional)
- `order`: Integer
- `marks`: Integer (Default: 1)
- `createdAt`: Timestamp

### QuizAttempts
Records of users attempting quizzes.
- `id`: UUID (Primary Key)
- `quizId`: UUID
- `userId`: UUID
- `answers`: Array of Strings (Optional)
- `score`: Integer (Optional)
- `totalMarks`: Integer (Optional)
- `startedAt`: Timestamp
- `completedAt`: Timestamp (Optional)
- `duration`: Integer (Optional)

### Assignments
Tasks assigned to students.
- `id`: UUID (Primary Key)
- `title`: String
- `description`: String (Optional)
- `boardId`: UUID
- `subjectId`: UUID
- `topicId`: UUID (Optional)
- `dueDate`: Timestamp (Optional)
- `totalMarks`: Integer (Default: 100)
- `creatorId`: UUID
- `attachmentUrl`: String (Optional)
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp

### Submissions
Student submissions for assignments.
- `id`: UUID (Primary Key)
- `assignmentId`: UUID
- `studentId`: UUID
- `fileUrl`: String (Optional)
- `content`: String (Optional)
- `status`: AssignmentStatus (Default: pending)
- `grade`: Integer (Optional)
- `feedback`: String (Optional)
- `submittedAt`: Timestamp
- `gradedAt`: Timestamp (Optional)

### Announcements
System-wide or scoped announcements.
- `id`: UUID (Primary Key)
- `title`: String
- `content`: String
- `scope`: AnnouncementScope (Default: school)
- `boardId`: UUID (Optional)
- `subjectId`: UUID (Optional)
- `authorId`: UUID
- `isActive`: Boolean (Default: true)
- `createdAt`: Timestamp
