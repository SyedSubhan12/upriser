# API Documentation

Base URL: `/api`

## Authentication

### Login
- **POST** `/auth/login`
- **Body**: `{ email, password }`
- **Response**: User object (without password)

### Logout
- **POST** `/auth/logout`
- **Response**: `{ message: "Logged out successfully" }`

### Get Current User
- **GET** `/auth/me`
- **Response**: User object (without password)

## Boards

- **GET** `/boards`: Get all boards.
- **POST** `/boards`: Create a new board.
- **GET** `/boards/:id`: Get a specific board.
- **PATCH** `/boards/:id`: Update a board.

## Subjects

- **GET** `/subjects`: Get all subjects (optional query `boardId`).
- **POST** `/subjects`: Create a new subject.
- **GET** `/subjects/:id`: Get a specific subject.
- **PATCH** `/subjects/:id`: Update a subject.

## Topics

- **GET** `/topics`: Get topics (required query `subjectId`).
- **POST** `/topics`: Create a new topic.
- **PATCH** `/topics/:id`: Update a topic.
- **DELETE** `/topics/:id`: Delete a topic.

## Materials

- **GET** `/materials`: Get materials.
    - Query Params: `boardId`, `subjectId`, `topicId`, `type`, `status`
- **POST** `/materials`: Create a new material.
- **GET** `/materials/:id`: Get a specific material.
- **PATCH** `/materials/:id`: Update a material.

## Quizzes

- **GET** `/quizzes`: Get quizzes.
    - Query Params: `boardId`, `subjectId`, `topicId`, `type`
- **POST** `/quizzes`: Create a new quiz.
- **GET** `/quizzes/:id`: Get a specific quiz (includes questions).
- **PATCH** `/quizzes/:id`: Update a quiz.

### Quiz Questions
- **GET** `/quizzes/:quizId/questions`: Get questions for a quiz.
- **POST** `/quizzes/:quizId/questions`: Add a question to a quiz.

### Questions Management
- **PATCH** `/questions/:id`: Update a question.
- **DELETE** `/questions/:id`: Delete a question.

## Quiz Attempts

- **GET** `/quiz-attempts`: Get attempts.
    - Query Params: `userId` OR `quizId` (required)
- **POST** `/quiz-attempts`: Start/Create a quiz attempt.
- **GET** `/quiz-attempts/:id`: Get a specific attempt.
- **PATCH** `/quiz-attempts/:id`: Update an attempt (e.g., submit answers).

## Assignments

- **GET** `/assignments`: Get all assignments.
- **POST** `/assignments`: Create a new assignment.
- **GET** `/assignments/:id`: Get a specific assignment.
- **PATCH** `/assignments/:id`: Update an assignment.
- **GET** `/assignments/:assignmentId/submissions`: Get submissions for an assignment.

## Submissions

- **POST** `/submissions`: Submit an assignment.
- **GET** `/submissions/:id`: Get a specific submission.
- **PATCH** `/submissions/:id`: Update a submission (e.g., grade it).

## Announcements

- **GET** `/announcements`: Get all announcements.
- **POST** `/announcements`: Create a new announcement.
- **PATCH** `/announcements/:id`: Update an announcement.
- **DELETE** `/announcements/:id`: Delete an announcement.

## Users

- **GET** `/users`: Get all users.
    - Query Params: `role`, `isActive`
- **POST** `/users`: Create a new user (Registration).
- **GET** `/users/:id`: Get a specific user.
- **PATCH** `/users/:id`: Update a user.
