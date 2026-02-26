import type { Board, Subject, Topic, Material, Quiz, Question, QuizAttempt, Assignment, Submission, Announcement, User } from "@shared/schema";

export const mockBoards: Board[] = [
  { id: "board-1", name: "CBSE", code: "CBSE", description: "Central Board of Secondary Education", logo: null, isActive: true, createdAt: new Date() },
  { id: "board-2", name: "ICSE", code: "ICSE", description: "Indian Certificate of Secondary Education", logo: null, isActive: true, createdAt: new Date() },
  { id: "board-3", name: "State Board", code: "STATE", description: "State Education Board", logo: null, isActive: true, createdAt: new Date() },
];

export const mockSubjects: Subject[] = [
  { id: "subject-1", name: "Mathematics", code: "MATH", boardId: "board-1", description: "Mathematics for Class 10", icon: "calculator", isActive: true, createdAt: new Date() },
  { id: "subject-2", name: "Physics", code: "PHY", boardId: "board-1", description: "Physics for Class 10", icon: "atom", isActive: true, createdAt: new Date() },
  { id: "subject-3", name: "Chemistry", code: "CHEM", boardId: "board-1", description: "Chemistry for Class 10", icon: "flask", isActive: true, createdAt: new Date() },
  { id: "subject-4", name: "Biology", code: "BIO", boardId: "board-1", description: "Biology for Class 10", icon: "leaf", isActive: true, createdAt: new Date() },
  { id: "subject-5", name: "English", code: "ENG", boardId: "board-1", description: "English Literature and Grammar", icon: "book", isActive: true, createdAt: new Date() },
];

export const mockTopics: Topic[] = [
  { id: "topic-1", name: "Algebra", subjectId: "subject-1", parentId: null, order: 1, description: "Algebraic expressions and equations", isActive: true, createdAt: new Date() },
  { id: "topic-2", name: "Linear Equations", subjectId: "subject-1", parentId: "topic-1", order: 1, description: "Solving linear equations", isActive: true, createdAt: new Date() },
  { id: "topic-3", name: "Quadratic Equations", subjectId: "subject-1", parentId: "topic-1", order: 2, description: "Solving quadratic equations", isActive: true, createdAt: new Date() },
  { id: "topic-4", name: "Geometry", subjectId: "subject-1", parentId: null, order: 2, description: "Shapes and spatial relationships", isActive: true, createdAt: new Date() },
  { id: "topic-5", name: "Triangles", subjectId: "subject-1", parentId: "topic-4", order: 1, description: "Properties of triangles", isActive: true, createdAt: new Date() },
  { id: "topic-6", name: "Circles", subjectId: "subject-1", parentId: "topic-4", order: 2, description: "Properties of circles", isActive: true, createdAt: new Date() },
  { id: "topic-7", name: "Trigonometry", subjectId: "subject-1", parentId: null, order: 3, description: "Trigonometric ratios and identities", isActive: true, createdAt: new Date() },
  { id: "topic-8", name: "Motion", subjectId: "subject-2", parentId: null, order: 1, description: "Laws of motion", isActive: true, createdAt: new Date() },
  { id: "topic-9", name: "Forces", subjectId: "subject-2", parentId: null, order: 2, description: "Types of forces", isActive: true, createdAt: new Date() },
  { id: "topic-10", name: "Chemical Reactions", subjectId: "subject-3", parentId: null, order: 1, description: "Types of chemical reactions", isActive: true, createdAt: new Date() },
];

export const mockMaterials: Material[] = [
  { id: "mat-1", title: "2023 Mathematics Final Exam", description: "Complete past paper with solutions", type: "past_paper", boardId: "board-1", subjectId: "subject-1", topicId: "topic-1", year: 2023, difficulty: "medium", fileUrl: "/files/math-2023.pdf", videoUrl: null, uploaderId: "teacher-1", status: "approved", viewCount: 245, downloadCount: 89, createdAt: new Date() },
  { id: "mat-2", title: "Quadratic Equations Notes", description: "Comprehensive notes on solving quadratic equations", type: "notes", boardId: "board-1", subjectId: "subject-1", topicId: "topic-3", year: null, difficulty: "medium", fileUrl: "/files/quadratic-notes.pdf", videoUrl: null, uploaderId: "teacher-1", status: "approved", viewCount: 189, downloadCount: 67, createdAt: new Date() },
  { id: "mat-3", title: "Trigonometry Video Tutorial", description: "Step-by-step video guide to trigonometric identities", type: "video", boardId: "board-1", subjectId: "subject-1", topicId: "topic-7", year: null, difficulty: "hard", fileUrl: null, videoUrl: "https://example.com/video/trig", uploaderId: "teacher-1", status: "approved", viewCount: 412, downloadCount: 0, createdAt: new Date() },
  { id: "mat-4", title: "Physics Practice Worksheet", description: "Practice problems on motion and forces", type: "worksheet", boardId: "board-1", subjectId: "subject-2", topicId: "topic-8", year: null, difficulty: "easy", fileUrl: "/files/physics-worksheet.pdf", videoUrl: null, uploaderId: "teacher-1", status: "approved", viewCount: 156, downloadCount: 45, createdAt: new Date() },
  { id: "mat-5", title: "2022 Physics Mid-Term", description: "Previous year mid-term examination", type: "past_paper", boardId: "board-1", subjectId: "subject-2", topicId: null, year: 2022, difficulty: "medium", fileUrl: "/files/physics-2022.pdf", videoUrl: null, uploaderId: "teacher-1", status: "pending", viewCount: 0, downloadCount: 0, createdAt: new Date() },
];

export const mockQuizzes: Quiz[] = [
  { id: "quiz-1", title: "Algebra Fundamentals", description: "Test your knowledge of basic algebra", boardId: "board-1", subjectId: "subject-1", topicId: "topic-1", type: "practice", duration: 30, isTimed: true, creatorId: "teacher-1", isActive: true, createdAt: new Date() },
  { id: "quiz-2", title: "Quadratic Equations Quiz", description: "Practice solving quadratic equations", boardId: "board-1", subjectId: "subject-1", topicId: "topic-3", type: "practice", duration: 20, isTimed: false, creatorId: "teacher-1", isActive: true, createdAt: new Date() },
  { id: "quiz-3", title: "Physics Mock Test", description: "Full-length mock examination for physics", boardId: "board-1", subjectId: "subject-2", topicId: null, type: "mock", duration: 60, isTimed: true, creatorId: "teacher-1", isActive: true, createdAt: new Date() },
];

export const mockQuestions: Question[] = [
  { id: "q-1", quizId: "quiz-1", questionText: "What is the value of x if 2x + 5 = 15?", options: ["5", "10", "7", "3"], correctOptionIndex: 0, explanation: "2x + 5 = 15, so 2x = 10, therefore x = 5", order: 1, marks: 1, createdAt: new Date() },
  { id: "q-2", quizId: "quiz-1", questionText: "Simplify: 3(x + 2) - 2(x - 1)", options: ["x + 8", "x + 4", "5x + 4", "x - 8"], correctOptionIndex: 0, explanation: "3x + 6 - 2x + 2 = x + 8", order: 2, marks: 1, createdAt: new Date() },
  { id: "q-3", quizId: "quiz-1", questionText: "If a + b = 10 and a - b = 4, find the value of a.", options: ["7", "3", "6", "8"], correctOptionIndex: 0, explanation: "Adding both equations: 2a = 14, so a = 7", order: 3, marks: 1, createdAt: new Date() },
  { id: "q-4", quizId: "quiz-2", questionText: "Solve: x² - 5x + 6 = 0", options: ["x = 2, 3", "x = -2, -3", "x = 1, 6", "x = -1, -6"], correctOptionIndex: 0, explanation: "Factoring: (x-2)(x-3) = 0", order: 1, marks: 2, createdAt: new Date() },
  { id: "q-5", quizId: "quiz-2", questionText: "The discriminant of x² + 4x + 4 = 0 is:", options: ["0", "8", "16", "-8"], correctOptionIndex: 0, explanation: "D = b² - 4ac = 16 - 16 = 0", order: 2, marks: 2, createdAt: new Date() },
];

export const mockQuizAttempts: QuizAttempt[] = [
  { id: "attempt-1", quizId: "quiz-1", userId: "student-1", answers: ["0", "0", "0"], score: 3, totalMarks: 3, startedAt: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 86400000 + 1200000), duration: 20 },
  { id: "attempt-2", quizId: "quiz-2", userId: "student-1", answers: ["0", "1"], score: 2, totalMarks: 4, startedAt: new Date(Date.now() - 172800000), completedAt: new Date(Date.now() - 172800000 + 900000), duration: 15 },
];

export const mockAssignments: Assignment[] = [
  { id: "assign-1", title: "Algebra Practice Set 1", description: "Complete all problems from Chapter 3", boardId: "board-1", subjectId: "subject-1", topicId: "topic-1", dueDate: new Date(Date.now() + 604800000), totalMarks: 50, creatorId: "teacher-1", attachmentUrl: "/files/algebra-set1.pdf", isActive: true, createdAt: new Date() },
  { id: "assign-2", title: "Physics Lab Report", description: "Write a detailed report on the motion experiment", boardId: "board-1", subjectId: "subject-2", topicId: "topic-8", dueDate: new Date(Date.now() + 259200000), totalMarks: 30, creatorId: "teacher-1", attachmentUrl: null, isActive: true, createdAt: new Date() },
  { id: "assign-3", title: "Trigonometry Worksheet", description: "Solve all trigonometric identities", boardId: "board-1", subjectId: "subject-1", topicId: "topic-7", dueDate: new Date(Date.now() - 86400000), totalMarks: 40, creatorId: "teacher-1", attachmentUrl: "/files/trig-worksheet.pdf", isActive: true, createdAt: new Date() },
];

export const mockSubmissions: Submission[] = [
  { id: "sub-1", assignmentId: "assign-3", studentId: "student-1", fileUrl: "/uploads/student1-trig.pdf", content: null, status: "graded", grade: 35, feedback: "Good work! Review identity #5.", submittedAt: new Date(Date.now() - 172800000), gradedAt: new Date(Date.now() - 86400000) },
  { id: "sub-2", assignmentId: "assign-1", studentId: "student-1", fileUrl: "/uploads/student1-algebra.pdf", content: null, status: "submitted", grade: null, feedback: null, submittedAt: new Date(), gradedAt: null },
];

export const mockAnnouncements: Announcement[] = [
  { id: "ann-1", title: "Mid-Term Examination Schedule", content: "The mid-term examinations will begin from next Monday. Please check the detailed schedule on the notice board.", scope: "school", boardId: null, subjectId: null, authorId: "admin-1", isActive: true, createdAt: new Date() },
  { id: "ann-2", title: "Mathematics Extra Classes", content: "Extra classes for Mathematics will be held every Saturday from 10 AM to 12 PM.", scope: "subject", boardId: "board-1", subjectId: "subject-1", authorId: "teacher-1", isActive: true, createdAt: new Date(Date.now() - 86400000) },
  { id: "ann-3", title: "Physics Lab Maintenance", content: "The physics lab will be closed for maintenance on Wednesday. All experiments will be rescheduled.", scope: "subject", boardId: "board-1", subjectId: "subject-2", authorId: "teacher-1", isActive: true, createdAt: new Date(Date.now() - 172800000) },
];

export const mockUsers: User[] = [
  { id: "student-1", email: "student@demo.com", password: "demo123", name: "Alex Johnson", role: "student", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-1", "subject-2"], isActive: true, createdAt: new Date(), googleId: null, authProvider: "local" },
  { id: "student-2", email: "student2@demo.com", password: "demo123", name: "Emma Wilson", role: "student", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-1", "subject-3"], isActive: true, createdAt: new Date(), googleId: null, authProvider: "local" },
  { id: "teacher-1", email: "teacher@demo.com", password: "demo123", name: "Dr. Sarah Smith", role: "teacher", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-1", "subject-2", "subject-3"], isActive: true, createdAt: new Date(), googleId: null, authProvider: "local" },
  { id: "teacher-2", email: "teacher2@demo.com", password: "demo123", name: "Prof. Michael Brown", role: "teacher", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-4", "subject-5"], isActive: true, createdAt: new Date(), googleId: null, authProvider: "local" },
  { id: "admin-1", email: "admin@demo.com", password: "demo123", name: "Admin User", role: "admin", avatar: null, boardIds: null, subjectIds: null, isActive: true, createdAt: new Date(), googleId: null, authProvider: "local" },
];

export function getSubjectsByBoard(boardId: string): Subject[] {
  return mockSubjects.filter(s => s.boardId === boardId);
}

export function getTopicsBySubject(subjectId: string): Topic[] {
  return mockTopics.filter(t => t.subjectId === subjectId);
}

export function getMaterialsByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string }): Material[] {
  return mockMaterials.filter(m => {
    if (filters.boardId && m.boardId !== filters.boardId) return false;
    if (filters.subjectId && m.subjectId !== filters.subjectId) return false;
    if (filters.topicId && m.topicId !== filters.topicId) return false;
    if (filters.type && m.type !== filters.type) return false;
    return m.status === "approved";
  });
}

export function getQuizzesByFilters(filters: { subjectId?: string; topicId?: string }): Quiz[] {
  return mockQuizzes.filter(q => {
    if (filters.subjectId && q.subjectId !== filters.subjectId) return false;
    if (filters.topicId && q.topicId !== filters.topicId) return false;
    return q.isActive;
  });
}

export function getQuestionsByQuiz(quizId: string): Question[] {
  return mockQuestions.filter(q => q.quizId === quizId).sort((a, b) => a.order - b.order);
}

export function getAssignmentsByStudent(studentId: string): (Assignment & { submission?: Submission })[] {
  return mockAssignments.map(a => ({
    ...a,
    submission: mockSubmissions.find(s => s.assignmentId === a.id && s.studentId === studentId),
  }));
}

export function getQuizAttemptsByUser(userId: string): (QuizAttempt & { quiz: Quiz })[] {
  return mockQuizAttempts
    .filter(a => a.userId === userId)
    .map(a => ({
      ...a,
      quiz: mockQuizzes.find(q => q.id === a.quizId)!,
    }))
    .filter(a => a.quiz);
}
