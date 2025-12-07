import { 
  type User, type InsertUser,
  type Board, type InsertBoard,
  type Subject, type InsertSubject,
  type Topic, type InsertTopic,
  type Material, type InsertMaterial,
  type Quiz, type InsertQuiz,
  type Question, type InsertQuestion,
  type QuizAttempt, type InsertQuizAttempt,
  type Assignment, type InsertAssignment,
  type Submission, type InsertSubmission,
  type Announcement, type InsertAnnouncement
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(filters?: { role?: string; isActive?: boolean }): Promise<User[]>;

  getBoard(id: string): Promise<Board | undefined>;
  getAllBoards(): Promise<Board[]>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, data: Partial<InsertBoard>): Promise<Board | undefined>;

  getSubject(id: string): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  getSubjectsByBoard(boardId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined>;

  getTopic(id: string): Promise<Topic | undefined>;
  getTopicsBySubject(subjectId: string): Promise<Topic[]>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined>;
  deleteTopic(id: string): Promise<boolean>;

  getMaterial(id: string): Promise<Material | undefined>;
  getAllMaterials(): Promise<Material[]>;
  getMaterialsByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string; status?: string }): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material | undefined>;

  getQuiz(id: string): Promise<Quiz | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  getQuizzesByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string }): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined>;

  getQuestion(id: string): Promise<Question | undefined>;
  getQuestionsByQuiz(quizId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;

  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttempt(id: string, data: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined>;

  getAssignment(id: string): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined>;

  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, data: Partial<InsertSubmission>): Promise<Submission | undefined>;

  getAnnouncement(id: string): Promise<Announcement | undefined>;
  getAllAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private boards: Map<string, Board>;
  private subjects: Map<string, Subject>;
  private topics: Map<string, Topic>;
  private materials: Map<string, Material>;
  private quizzes: Map<string, Quiz>;
  private questions: Map<string, Question>;
  private quizAttempts: Map<string, QuizAttempt>;
  private assignments: Map<string, Assignment>;
  private submissions: Map<string, Submission>;
  private announcements: Map<string, Announcement>;

  constructor() {
    this.users = new Map();
    this.boards = new Map();
    this.subjects = new Map();
    this.topics = new Map();
    this.materials = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.quizAttempts = new Map();
    this.assignments = new Map();
    this.submissions = new Map();
    this.announcements = new Map();

    this.seedData();
  }

  private seedData() {
    const mockUsers: User[] = [
      { id: "student-1", email: "student@demo.com", password: "demo123", name: "Alex Johnson", role: "student", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-1", "subject-2"], isActive: true, createdAt: new Date() },
      { id: "student-2", email: "student2@demo.com", password: "demo123", name: "Emma Wilson", role: "student", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-1", "subject-3"], isActive: true, createdAt: new Date() },
      { id: "teacher-1", email: "teacher@demo.com", password: "demo123", name: "Dr. Sarah Smith", role: "teacher", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-1", "subject-2", "subject-3"], isActive: true, createdAt: new Date() },
      { id: "teacher-2", email: "teacher2@demo.com", password: "demo123", name: "Prof. Michael Brown", role: "teacher", avatar: null, boardIds: ["board-1"], subjectIds: ["subject-4", "subject-5"], isActive: true, createdAt: new Date() },
      { id: "admin-1", email: "admin@demo.com", password: "demo123", name: "Admin User", role: "admin", avatar: null, boardIds: null, subjectIds: null, isActive: true, createdAt: new Date() },
    ];

    const mockBoards: Board[] = [
      { id: "board-1", name: "CBSE", code: "CBSE", description: "Central Board of Secondary Education", logo: null, isActive: true, createdAt: new Date() },
      { id: "board-2", name: "ICSE", code: "ICSE", description: "Indian Certificate of Secondary Education", logo: null, isActive: true, createdAt: new Date() },
      { id: "board-3", name: "State Board", code: "STATE", description: "State Education Board", logo: null, isActive: true, createdAt: new Date() },
    ];

    const mockSubjects: Subject[] = [
      { id: "subject-1", name: "Mathematics", code: "MATH", boardId: "board-1", description: "Mathematics for Class 10", icon: "calculator", isActive: true, createdAt: new Date() },
      { id: "subject-2", name: "Physics", code: "PHY", boardId: "board-1", description: "Physics for Class 10", icon: "atom", isActive: true, createdAt: new Date() },
      { id: "subject-3", name: "Chemistry", code: "CHEM", boardId: "board-1", description: "Chemistry for Class 10", icon: "flask", isActive: true, createdAt: new Date() },
      { id: "subject-4", name: "Biology", code: "BIO", boardId: "board-1", description: "Biology for Class 10", icon: "leaf", isActive: true, createdAt: new Date() },
      { id: "subject-5", name: "English", code: "ENG", boardId: "board-1", description: "English Literature and Grammar", icon: "book", isActive: true, createdAt: new Date() },
    ];

    const mockTopics: Topic[] = [
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

    const mockMaterials: Material[] = [
      { id: "mat-1", title: "2023 Mathematics Final Exam", description: "Complete past paper with solutions", type: "past_paper", boardId: "board-1", subjectId: "subject-1", topicId: "topic-1", year: 2023, difficulty: "medium", fileUrl: "/files/math-2023.pdf", videoUrl: null, uploaderId: "teacher-1", status: "approved", viewCount: 245, downloadCount: 89, createdAt: new Date() },
      { id: "mat-2", title: "Quadratic Equations Notes", description: "Comprehensive notes on solving quadratic equations", type: "notes", boardId: "board-1", subjectId: "subject-1", topicId: "topic-3", year: null, difficulty: "medium", fileUrl: "/files/quadratic-notes.pdf", videoUrl: null, uploaderId: "teacher-1", status: "approved", viewCount: 189, downloadCount: 67, createdAt: new Date() },
      { id: "mat-3", title: "Trigonometry Video Tutorial", description: "Step-by-step video guide to trigonometric identities", type: "video", boardId: "board-1", subjectId: "subject-1", topicId: "topic-7", year: null, difficulty: "hard", fileUrl: null, videoUrl: "https://example.com/video/trig", uploaderId: "teacher-1", status: "approved", viewCount: 412, downloadCount: 0, createdAt: new Date() },
      { id: "mat-4", title: "Physics Practice Worksheet", description: "Practice problems on motion and forces", type: "worksheet", boardId: "board-1", subjectId: "subject-2", topicId: "topic-8", year: null, difficulty: "easy", fileUrl: "/files/physics-worksheet.pdf", videoUrl: null, uploaderId: "teacher-1", status: "approved", viewCount: 156, downloadCount: 45, createdAt: new Date() },
      { id: "mat-5", title: "2022 Physics Mid-Term", description: "Previous year mid-term examination", type: "past_paper", boardId: "board-1", subjectId: "subject-2", topicId: null, year: 2022, difficulty: "medium", fileUrl: "/files/physics-2022.pdf", videoUrl: null, uploaderId: "teacher-1", status: "pending", viewCount: 0, downloadCount: 0, createdAt: new Date() },
    ];

    const mockQuizzes: Quiz[] = [
      { id: "quiz-1", title: "Algebra Fundamentals", description: "Test your knowledge of basic algebra", boardId: "board-1", subjectId: "subject-1", topicId: "topic-1", type: "practice", duration: 30, isTimed: true, creatorId: "teacher-1", isActive: true, createdAt: new Date() },
      { id: "quiz-2", title: "Quadratic Equations Quiz", description: "Practice solving quadratic equations", boardId: "board-1", subjectId: "subject-1", topicId: "topic-3", type: "practice", duration: 20, isTimed: false, creatorId: "teacher-1", isActive: true, createdAt: new Date() },
      { id: "quiz-3", title: "Physics Mock Test", description: "Full-length mock examination for physics", boardId: "board-1", subjectId: "subject-2", topicId: null, type: "mock", duration: 60, isTimed: true, creatorId: "teacher-1", isActive: true, createdAt: new Date() },
    ];

    const mockQuestions: Question[] = [
      { id: "q-1", quizId: "quiz-1", questionText: "What is the value of x if 2x + 5 = 15?", options: ["5", "10", "7", "3"], correctOptionIndex: 0, explanation: "2x + 5 = 15, so 2x = 10, therefore x = 5", order: 1, marks: 1, createdAt: new Date() },
      { id: "q-2", quizId: "quiz-1", questionText: "Simplify: 3(x + 2) - 2(x - 1)", options: ["x + 8", "x + 4", "5x + 4", "x - 8"], correctOptionIndex: 0, explanation: "3x + 6 - 2x + 2 = x + 8", order: 2, marks: 1, createdAt: new Date() },
      { id: "q-3", quizId: "quiz-1", questionText: "If a + b = 10 and a - b = 4, find the value of a.", options: ["7", "3", "6", "8"], correctOptionIndex: 0, explanation: "Adding both equations: 2a = 14, so a = 7", order: 3, marks: 1, createdAt: new Date() },
      { id: "q-4", quizId: "quiz-2", questionText: "Solve: x^2 - 5x + 6 = 0", options: ["x = 2, 3", "x = -2, -3", "x = 1, 6", "x = -1, -6"], correctOptionIndex: 0, explanation: "Factoring: (x-2)(x-3) = 0", order: 1, marks: 2, createdAt: new Date() },
      { id: "q-5", quizId: "quiz-2", questionText: "The discriminant of x^2 + 4x + 4 = 0 is:", options: ["0", "8", "16", "-8"], correctOptionIndex: 0, explanation: "D = b^2 - 4ac = 16 - 16 = 0", order: 2, marks: 2, createdAt: new Date() },
    ];

    const mockQuizAttempts: QuizAttempt[] = [
      { id: "attempt-1", quizId: "quiz-1", userId: "student-1", answers: ["0", "0", "0"], score: 3, totalMarks: 3, startedAt: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 86400000 + 1200000), duration: 20 },
      { id: "attempt-2", quizId: "quiz-2", userId: "student-1", answers: ["0", "1"], score: 2, totalMarks: 4, startedAt: new Date(Date.now() - 172800000), completedAt: new Date(Date.now() - 172800000 + 900000), duration: 15 },
    ];

    const mockAssignments: Assignment[] = [
      { id: "assign-1", title: "Algebra Practice Set 1", description: "Complete all problems from Chapter 3", boardId: "board-1", subjectId: "subject-1", topicId: "topic-1", dueDate: new Date(Date.now() + 604800000), totalMarks: 50, creatorId: "teacher-1", attachmentUrl: "/files/algebra-set1.pdf", isActive: true, createdAt: new Date() },
      { id: "assign-2", title: "Physics Lab Report", description: "Write a detailed report on the motion experiment", boardId: "board-1", subjectId: "subject-2", topicId: "topic-8", dueDate: new Date(Date.now() + 259200000), totalMarks: 30, creatorId: "teacher-1", attachmentUrl: null, isActive: true, createdAt: new Date() },
      { id: "assign-3", title: "Trigonometry Worksheet", description: "Solve all trigonometric identities", boardId: "board-1", subjectId: "subject-1", topicId: "topic-7", dueDate: new Date(Date.now() - 86400000), totalMarks: 40, creatorId: "teacher-1", attachmentUrl: "/files/trig-worksheet.pdf", isActive: true, createdAt: new Date() },
    ];

    const mockSubmissions: Submission[] = [
      { id: "sub-1", assignmentId: "assign-3", studentId: "student-1", fileUrl: "/uploads/student1-trig.pdf", content: null, status: "graded", grade: 35, feedback: "Good work! Review identity #5.", submittedAt: new Date(Date.now() - 172800000), gradedAt: new Date(Date.now() - 86400000) },
      { id: "sub-2", assignmentId: "assign-1", studentId: "student-1", fileUrl: "/uploads/student1-algebra.pdf", content: null, status: "submitted", grade: null, feedback: null, submittedAt: new Date(), gradedAt: null },
    ];

    const mockAnnouncements: Announcement[] = [
      { id: "ann-1", title: "Mid-Term Examination Schedule", content: "The mid-term examinations will begin from next Monday. Please check the detailed schedule on the notice board.", scope: "school", boardId: null, subjectId: null, authorId: "admin-1", isActive: true, createdAt: new Date() },
      { id: "ann-2", title: "Mathematics Extra Classes", content: "Extra classes for Mathematics will be held every Saturday from 10 AM to 12 PM.", scope: "subject", boardId: "board-1", subjectId: "subject-1", authorId: "teacher-1", isActive: true, createdAt: new Date(Date.now() - 86400000) },
      { id: "ann-3", title: "Physics Lab Maintenance", content: "The physics lab will be closed for maintenance on Wednesday. All experiments will be rescheduled.", scope: "subject", boardId: "board-1", subjectId: "subject-2", authorId: "teacher-1", isActive: true, createdAt: new Date(Date.now() - 172800000) },
    ];

    mockUsers.forEach(u => this.users.set(u.id, u));
    mockBoards.forEach(b => this.boards.set(b.id, b));
    mockSubjects.forEach(s => this.subjects.set(s.id, s));
    mockTopics.forEach(t => this.topics.set(t.id, t));
    mockMaterials.forEach(m => this.materials.set(m.id, m));
    mockQuizzes.forEach(q => this.quizzes.set(q.id, q));
    mockQuestions.forEach(q => this.questions.set(q.id, q));
    mockQuizAttempts.forEach(a => this.quizAttempts.set(a.id, a));
    mockAssignments.forEach(a => this.assignments.set(a.id, a));
    mockSubmissions.forEach(s => this.submissions.set(s.id, s));
    mockAnnouncements.forEach(a => this.announcements.set(a.id, a));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getAllUsers(filters?: { role?: string; isActive?: boolean }): Promise<User[]> {
    let users = Array.from(this.users.values());
    if (filters?.role) {
      users = users.filter(u => u.role === filters.role);
    }
    if (filters?.isActive !== undefined) {
      users = users.filter(u => u.isActive === filters.isActive);
    }
    return users;
  }

  async getBoard(id: string): Promise<Board | undefined> {
    return this.boards.get(id);
  }

  async getAllBoards(): Promise<Board[]> {
    return Array.from(this.boards.values());
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const id = randomUUID();
    const board: Board = { ...insertBoard, id, createdAt: new Date() };
    this.boards.set(id, board);
    return board;
  }

  async updateBoard(id: string, data: Partial<InsertBoard>): Promise<Board | undefined> {
    const board = this.boards.get(id);
    if (!board) return undefined;
    const updated = { ...board, ...data };
    this.boards.set(id, updated);
    return updated;
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async getAllSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getSubjectsByBoard(boardId: string): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(s => s.boardId === boardId);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = randomUUID();
    const subject: Subject = { ...insertSubject, id, createdAt: new Date() };
    this.subjects.set(id, subject);
    return subject;
  }

  async updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined> {
    const subject = this.subjects.get(id);
    if (!subject) return undefined;
    const updated = { ...subject, ...data };
    this.subjects.set(id, updated);
    return updated;
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    return this.topics.get(id);
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return Array.from(this.topics.values())
      .filter(t => t.subjectId === subjectId)
      .sort((a, b) => a.order - b.order);
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = randomUUID();
    const topic: Topic = { ...insertTopic, id, createdAt: new Date() };
    this.topics.set(id, topic);
    return topic;
  }

  async updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined> {
    const topic = this.topics.get(id);
    if (!topic) return undefined;
    const updated = { ...topic, ...data };
    this.topics.set(id, updated);
    return updated;
  }

  async deleteTopic(id: string): Promise<boolean> {
    return this.topics.delete(id);
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async getAllMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async getMaterialsByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string; status?: string }): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => {
      if (filters.boardId && m.boardId !== filters.boardId) return false;
      if (filters.subjectId && m.subjectId !== filters.subjectId) return false;
      if (filters.topicId && m.topicId !== filters.topicId) return false;
      if (filters.type && m.type !== filters.type) return false;
      if (filters.status && m.status !== filters.status) return false;
      return true;
    });
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const material: Material = { ...insertMaterial, id, createdAt: new Date() };
    this.materials.set(id, material);
    return material;
  }

  async updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material | undefined> {
    const material = this.materials.get(id);
    if (!material) return undefined;
    const updated = { ...material, ...data };
    this.materials.set(id, updated);
    return updated;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }

  async getQuizzesByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string }): Promise<Quiz[]> {
    return Array.from(this.quizzes.values()).filter(q => {
      if (filters.boardId && q.boardId !== filters.boardId) return false;
      if (filters.subjectId && q.subjectId !== filters.subjectId) return false;
      if (filters.topicId && q.topicId !== filters.topicId) return false;
      if (filters.type && q.type !== filters.type) return false;
      return q.isActive;
    });
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const quiz: Quiz = { ...insertQuiz, id, createdAt: new Date() };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;
    const updated = { ...quiz, ...data };
    this.quizzes.set(id, updated);
    return updated;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByQuiz(quizId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const question: Question = { ...insertQuestion, id, createdAt: new Date() };
    this.questions.set(id, question);
    return question;
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (!question) return undefined;
    const updated = { ...question, ...data };
    this.questions.set(id, updated);
    return updated;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    return this.questions.delete(id);
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    return this.quizAttempts.get(id);
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(a => a.userId === userId);
  }

  async getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
    return Array.from(this.quizAttempts.values()).filter(a => a.quizId === quizId);
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const attempt: QuizAttempt = { ...insertAttempt, id };
    this.quizAttempts.set(id, attempt);
    return attempt;
  }

  async updateQuizAttempt(id: string, data: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> {
    const attempt = this.quizAttempts.get(id);
    if (!attempt) return undefined;
    const updated = { ...attempt, ...data };
    this.quizAttempts.set(id, updated);
    return updated;
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values());
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = randomUUID();
    const assignment: Assignment = { ...insertAssignment, id, createdAt: new Date() };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    const updated = { ...assignment, ...data };
    this.assignments.set(id, updated);
    return updated;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.assignmentId === assignmentId);
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.studentId === studentId);
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const submission: Submission = { ...insertSubmission, id };
    this.submissions.set(id, submission);
    return submission;
  }

  async updateSubmission(id: string, data: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;
    const updated = { ...submission, ...data };
    this.submissions.set(id, updated);
    return updated;
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    return this.announcements.get(id);
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const announcement: Announcement = { ...insertAnnouncement, id, createdAt: new Date() };
    this.announcements.set(id, announcement);
    return announcement;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const announcement = this.announcements.get(id);
    if (!announcement) return undefined;
    const updated = { ...announcement, ...data };
    this.announcements.set(id, updated);
    return updated;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.announcements.delete(id);
  }
}

export const storage = new MemStorage();
