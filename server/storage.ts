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
  type Announcement, type InsertAnnouncement,
  type Qualification, type Branch, type ResourceCategory, type ResourceNode, type InsertResourceNode, type FileAsset,
  type UserProfile, type InsertUserProfile,
  type UserPreference, type InsertUserPreferences,
  type UserSubject, type InsertUserSubject,
  type Feedback, type InsertFeedback,
  type StudentRegistration, type InsertStudentRegistration,
  users, boards, subjects, topics, materials, quizzes, questions, quizAttempts, assignments, submissions, announcements,
  qualifications, branches, subjectGroups, resourceCategories, resourceNodes, fileAssets,
  userProfiles, userPreferences, userSubjects, feedback, studentRegistrations, tutorRegistrations,
  type TutorRegistration, type InsertTutorRegistration
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc, isNull, sql, count, or } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(filters?: { role?: string; isActive?: boolean }): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  getBoard(id: string): Promise<Board | undefined>;
  getAllBoards(): Promise<Board[]>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, data: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: string): Promise<boolean>;

  getSubject(id: string): Promise<Subject | undefined>;
  getAllSubjects(): Promise<Subject[]>;
  getSubjectsByBoard(boardId: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<boolean>;

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

  // New Curriculum Methods
  getBoardByKey(key: string): Promise<Board | undefined>;
  getQualificationsByBoard(boardId: string): Promise<Qualification[]>;
  getQualificationByKey(boardId: string, key: string): Promise<Qualification | undefined>;
  getBranchesByQualification(qualId: string): Promise<Branch[]>;
  getBranchByKey(qualId: string, key: string): Promise<Branch | undefined>;
  getSubjectsByQualification(qualId: string, branchId?: string): Promise<Subject[]>;
  getSubjectBySlug(slug: string): Promise<Subject | undefined>;
  getResourceCategories(): Promise<ResourceCategory[]>;
  getResourceNodes(subjectId: string, resourceKey: string, parentNodeId?: string | null): Promise<ResourceNode[]>;
  getFileAsset(fileId: string): Promise<FileAsset | undefined>;
  getResourceNode(nodeId: string): Promise<ResourceNode | undefined>;
  getFileAssets(nodeId: string): Promise<FileAsset[]>;
  getFileAssetsBySubjectAndResource(subjectId: string, resourceKey: string): Promise<FileAsset[]>;
  getSubjectWithContext(subjectId: string): Promise<any>;
  getSubjectGroupsByProgram(programId: string): Promise<any[]>;

  // Supabase file management methods
  createFileAsset(data: any): Promise<FileAsset>;
  incrementDownloadCount(fileId: string): Promise<void>;
  getFileAssetByObjectKey(objectKey: string): Promise<FileAsset | undefined>;
  getFileAssetsPaginated(filters: { subjectId?: string; resourceKey?: string; fileType?: string; year?: number; session?: string }, page: number, limit: number): Promise<{ files: FileAsset[]; total: number }>;
  deleteFileAsset(id: string): Promise<boolean>;

  // Resource node management
  createResourceNode(data: InsertResourceNode): Promise<ResourceNode>;
  updateResourceNode(id: string, data: Partial<InsertResourceNode>): Promise<ResourceNode | undefined>;
  deleteResourceNode(id: string): Promise<boolean>;

  // Onboarding methods
  getUserProfileByDeviceId(deviceId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  getUserPreferences(profileId: string): Promise<UserPreference | undefined>;
  upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreference>;
  getUserSubjects(profileId: string): Promise<UserSubject[]>;
  setUserSubjects(profileId: string, subjectIds: string[]): Promise<void>;

  // Feedback methods
  getAllFeedback(): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Student registration methods
  getStudentRegistration(id: string): Promise<StudentRegistration | undefined>;
  getStudentRegistrationByUserId(userId: string): Promise<StudentRegistration | undefined>;
  createStudentRegistration(registration: InsertStudentRegistration): Promise<StudentRegistration>;
  updateStudentRegistration(id: string, data: Partial<InsertStudentRegistration>): Promise<StudentRegistration | undefined>;
  upsertStudentRegistration(userId: string, data: Partial<InsertStudentRegistration>): Promise<StudentRegistration>;

  // Tutor registration methods
  getTutorRegistration(id: string): Promise<TutorRegistration | undefined>;
  getTutorRegistrationByUserId(userId: string): Promise<TutorRegistration | undefined>;
  createTutorRegistration(registration: InsertTutorRegistration): Promise<TutorRegistration>;
  updateTutorRegistration(id: string, data: Partial<InsertTutorRegistration>): Promise<TutorRegistration | undefined>;
  upsertTutorRegistration(userId: string, data: Partial<InsertTutorRegistration>): Promise<TutorRegistration>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ ...insertUser, id }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(filters?: { role?: string; isActive?: boolean }): Promise<User[]> {
    let query = db.select().from(users);
    // Note: Simple filtering with Drizzle usually requires building the where clause dynamically
    // For simplicity in this implementation, we'll fetch and filter if complex, 
    // but for these simple fields we can try to chain.
    // However, Drizzle query builder is immutable-ish.

    // A better approach for dynamic queries:
    const conditions = [];
    if (filters?.role) conditions.push(eq(users.role, filters.role));
    if (filters?.isActive !== undefined) conditions.push(eq(users.isActive, filters.isActive));

    if (conditions.length > 0) {
      return await db.select().from(users).where(and(...conditions));
    }
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
    return !!deleted;
  }

  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board;
  }

  async getAllBoards(): Promise<Board[]> {
    return await db.select().from(boards);
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const id = randomUUID();
    const [board] = await db.insert(boards).values({ ...insertBoard, id }).returning();
    return board;
  }

  async updateBoard(id: string, data: Partial<InsertBoard>): Promise<Board | undefined> {
    const [board] = await db.update(boards).set(data).where(eq(boards.id, id)).returning();
    return board;
  }

  async deleteBoard(id: string): Promise<boolean> {
    const [deleted] = await db.delete(boards).where(eq(boards.id, id)).returning();
    return !!deleted;
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubjectsByBoard(boardId: string): Promise<Subject[]> {
    return await db.select().from(subjects).where(eq(subjects.boardId, boardId));
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = randomUUID();
    const [subject] = await db.insert(subjects).values({ ...insertSubject, id }).returning();
    return subject;
  }

  async updateSubject(id: string, data: Partial<InsertSubject>): Promise<Subject | undefined> {
    const [subject] = await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    return subject;
  }

  async deleteSubject(id: string): Promise<boolean> {
    const [deleted] = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    return !!deleted;
  }

  async getTopic(id: string): Promise<Topic | undefined> {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id));
    return topic;
  }

  async getTopicsBySubject(subjectId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.subjectId, subjectId)).orderBy(topics.order);
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = randomUUID();
    const [topic] = await db.insert(topics).values({ ...insertTopic, id }).returning();
    return topic;
  }

  async updateTopic(id: string, data: Partial<InsertTopic>): Promise<Topic | undefined> {
    const [topic] = await db.update(topics).set(data).where(eq(topics.id, id)).returning();
    return topic;
  }

  async deleteTopic(id: string): Promise<boolean> {
    const [deleted] = await db.delete(topics).where(eq(topics.id, id)).returning();
    return !!deleted;
  }

  async getMaterial(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material;
  }

  async getAllMaterials(): Promise<Material[]> {
    return await db.select().from(materials);
  }

  async getMaterialsByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string; status?: string }): Promise<Material[]> {
    const conditions = [];
    if (filters.boardId) conditions.push(eq(materials.boardId, filters.boardId));
    if (filters.subjectId) conditions.push(eq(materials.subjectId, filters.subjectId));
    if (filters.topicId) conditions.push(eq(materials.topicId, filters.topicId));
    if (filters.type) conditions.push(eq(materials.type, filters.type));
    if (filters.status) conditions.push(eq(materials.status, filters.status));

    if (conditions.length > 0) {
      return await db.select().from(materials).where(and(...conditions));
    }
    return await db.select().from(materials);
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const [material] = await db.insert(materials).values({ ...insertMaterial, id }).returning();
    return material;
  }

  async updateMaterial(id: string, data: Partial<InsertMaterial>): Promise<Material | undefined> {
    const [material] = await db.update(materials).set(data).where(eq(materials.id, id)).returning();
    return material;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes);
  }

  async getQuizzesByFilters(filters: { boardId?: string; subjectId?: string; topicId?: string; type?: string; isActive?: boolean }): Promise<Quiz[]> {
    const conditions = [];
    if (filters.boardId) conditions.push(eq(quizzes.boardId, filters.boardId));
    if (filters.subjectId) conditions.push(eq(quizzes.subjectId, filters.subjectId));
    if (filters.topicId) conditions.push(eq(quizzes.topicId, filters.topicId));
    if (filters.type) conditions.push(eq(quizzes.type, filters.type));
    // Only filter by isActive if explicitly specified, default to true for backward compatibility
    if (filters.isActive !== undefined) {
      conditions.push(eq(quizzes.isActive, filters.isActive));
    } else {
      conditions.push(eq(quizzes.isActive, true));
    }

    return await db.select().from(quizzes).where(and(...conditions));
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = randomUUID();
    const [quiz] = await db.insert(quizzes).values({ ...insertQuiz, id }).returning();
    return quiz;
  }

  async updateQuiz(id: string, data: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set(data).where(eq(quizzes.id, id)).returning();
    return quiz;
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByQuiz(quizId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.quizId, quizId)).orderBy(questions.order);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const [question] = await db.insert(questions).values({ ...insertQuestion, id }).returning();
    return question;
  }

  async updateQuestion(id: string, data: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db.update(questions).set(data).where(eq(questions.id, id)).returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const [deleted] = await db.delete(questions).where(eq(questions.id, id)).returning();
    return !!deleted;
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, id));
    return attempt;
  }

  async getQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId));
  }

  async getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
    return await db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
  }

  async createQuizAttempt(insertAttempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const id = randomUUID();
    const [attempt] = await db.insert(quizAttempts).values({ ...insertAttempt, id }).returning();
    return attempt;
  }

  async updateQuizAttempt(id: string, data: Partial<InsertQuizAttempt>): Promise<QuizAttempt | undefined> {
    const [attempt] = await db.update(quizAttempts).set(data).where(eq(quizAttempts.id, id)).returning();
    return attempt;
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return await db.select().from(assignments);
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = randomUUID();
    const [assignment] = await db.insert(assignments).values({ ...insertAssignment, id }).returning();
    return assignment;
  }

  async updateAssignment(id: string, data: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [assignment] = await db.update(assignments).set(data).where(eq(assignments.id, id)).returning();
    return assignment;
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const [submission] = await db.insert(submissions).values({ ...insertSubmission, id }).returning();
    return submission;
  }

  async updateSubmission(id: string, data: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const [submission] = await db.update(submissions).set(data).where(eq(submissions.id, id)).returning();
    return submission;
  }

  async getAnnouncement(id: string): Promise<Announcement | undefined> {
    const [announcement] = await db.select().from(announcements).where(eq(announcements.id, id));
    return announcement;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const [announcement] = await db.insert(announcements).values({ ...insertAnnouncement, id }).returning();
    return announcement;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [announcement] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return announcement;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const [deleted] = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return !!deleted;
  }

  // New Curriculum Implementations
  async getBoardByKey(key: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.boardKey, key));
    return board;
  }

  async getQualificationsByBoard(boardId: string): Promise<Qualification[]> {
    return await db.select().from(qualifications).where(eq(qualifications.boardId, boardId)).orderBy(qualifications.sortOrder);
  }

  async getQualificationByKey(boardId: string, key: string): Promise<Qualification | undefined> {
    const [qual] = await db.select().from(qualifications).where(and(eq(qualifications.boardId, boardId), eq(qualifications.qualKey, key)));
    return qual;
  }

  async getBranchesByQualification(qualId: string): Promise<Branch[]> {
    return await db.select().from(branches).where(eq(branches.qualId, qualId));
  }

  async getBranchByKey(qualId: string, key: string): Promise<Branch | undefined> {
    const [branch] = await db.select().from(branches).where(and(eq(branches.qualId, qualId), eq(branches.branchKey, key)));
    return branch;
  }

  async getSubjectsByQualification(qualId: string, branchId?: string): Promise<Subject[]> {
    const conditions = [eq(subjects.qualId, qualId)];
    if (branchId) {
      conditions.push(eq(subjects.branchId, branchId));
    } else {
      // If no branch provided, we check if the qualification has branching.
      // However, to keep storage clean, we'll just filter by NULL if not provided.
      // The caller (route) should handle logic if needed.
    }
    return await db.select().from(subjects).where(and(...conditions)).orderBy(subjects.sortKey);
  }

  async getSubjectBySlug(slug: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.slug, slug));
    return subject;
  }

  async getResourceCategories(): Promise<ResourceCategory[]> {
    return await db.select().from(resourceCategories).orderBy(resourceCategories.sortOrder);
  }

  async getResourceNodes(subjectId: string, resourceKey: string, parentNodeId?: string | null): Promise<ResourceNode[]> {
    const conditions = [
      eq(resourceNodes.subjectId, subjectId),
      eq(resourceNodes.resourceKey, resourceKey)
    ];

    // Handle parent node filtering
    if (parentNodeId === undefined || parentNodeId === null) {
      // Fetch logical "root" nodes for this subject/resource.
      // Older imports used a synthetic parent ID "node-pp-root" without creating an actual root node.
      // To support both styles, treat rows with parentNodeId NULL OR "node-pp-root" as top-level.
      conditions.push(
        or(
          isNull(resourceNodes.parentNodeId),
          eq(resourceNodes.parentNodeId, "node-pp-root")
        ) as any
      );
    } else {
      // Fetch children of specific parent
      conditions.push(eq(resourceNodes.parentNodeId, parentNodeId));
    }

    return await db.select().from(resourceNodes).where(and(...conditions)).orderBy(resourceNodes.sortOrder);
  }

  async getFileAssets(nodeId: string): Promise<FileAsset[]> {
    return await db.select().from(fileAssets).where(eq(fileAssets.nodeId, nodeId));
  }

  async getFileAsset(fileId: string): Promise<FileAsset | undefined> {
    const [file] = await db.select().from(fileAssets).where(eq(fileAssets.id, fileId));
    return file;
  }

  async getResourceNode(nodeId: string): Promise<ResourceNode | undefined> {
    const [node] = await db.select().from(resourceNodes).where(eq(resourceNodes.id, nodeId));
    return node;
  }

  async getSubjectWithContext(subjectId: string): Promise<any> {
    const subject = await this.getSubject(subjectId);
    if (!subject) return null;

    const board = await this.getBoard(subject.boardId);
    const qualification = await db.select().from(qualifications).where(eq(qualifications.id, subject.qualId)).then((res: any[]) => res[0]);
    const branch = subject.branchId ? await db.select().from(branches).where(eq(branches.id, subject.branchId)).then((res: any[]) => res[0]) : null;

    // Count resources by category
    const nodes = await db.select().from(resourceNodes).where(eq(resourceNodes.subjectId, subjectId));
    const counts: Record<string, number> = {};
    nodes.forEach((node: any) => {
      counts[node.resourceKey] = (counts[node.resourceKey] || 0) + 1;
    });

    return {
      subject,
      board,
      qualification,
      branch,
      resourceCounts: counts
    };
  }

  async getFileAssetsBySubjectAndResource(subjectId: string, resourceKey: string): Promise<FileAsset[]> {
    return await db.select({
      id: fileAssets.id,
      nodeId: fileAssets.nodeId,
      title: fileAssets.title,
      fileType: fileAssets.fileType,
      url: fileAssets.url,
      fileSize: fileAssets.fileSize,
      paper: fileAssets.paper,
      variant: fileAssets.variant,
      year: fileAssets.year,
      session: fileAssets.session,
    })
      .from(fileAssets)
      .innerJoin(resourceNodes, eq(fileAssets.nodeId, resourceNodes.id))
      .where(and(eq(resourceNodes.subjectId, subjectId), eq(resourceNodes.resourceKey, resourceKey)));
  }

  async getSubjectGroupsByProgram(programId: string): Promise<any[]> {
    return await db.select().from(subjectGroups).where(eq(subjectGroups.programId, programId));
  }

  // =============================================
  // SUPABASE FILE MANAGEMENT METHODS
  // =============================================

  async createFileAsset(data: any): Promise<FileAsset> {
    const id = randomUUID();
    const [created] = await db.insert(fileAssets).values({ ...data, id }).returning();
    return created;
  }

  async incrementDownloadCount(fileId: string): Promise<void> {
    await db.update(fileAssets)
      .set({ downloadCount: sql`${fileAssets.downloadCount} + 1` })
      .where(eq(fileAssets.id, fileId));
  }

  async getFileAssetByObjectKey(objectKey: string): Promise<FileAsset | undefined> {
    const [file] = await db.select().from(fileAssets).where(eq(fileAssets.objectKey, objectKey));
    return file;
  }

  async getFileAssetsPaginated(
    filters: { subjectId?: string; resourceKey?: string; fileType?: string; year?: number; session?: string },
    page: number = 1,
    limit: number = 20
  ): Promise<{ files: FileAsset[]; total: number }> {
    const conditions = [];
    if (filters.subjectId) conditions.push(eq(fileAssets.subjectId, filters.subjectId));
    if (filters.resourceKey) conditions.push(eq(fileAssets.resourceKey, filters.resourceKey));
    if (filters.fileType) conditions.push(eq(fileAssets.fileType, filters.fileType));
    if (filters.year) conditions.push(eq(fileAssets.year, filters.year));
    if (filters.session) conditions.push(eq(fileAssets.session, filters.session));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [totalResult] = await db.select({ value: count() })
      .from(fileAssets)
      .where(whereClause);

    const files = await db.select()
      .from(fileAssets)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(fileAssets.createdAt));

    return { files, total: Number(totalResult?.value ?? 0) };
  }

  async deleteFileAsset(id: string): Promise<boolean> {
    const [deleted] = await db.delete(fileAssets).where(eq(fileAssets.id, id)).returning();
    return !!deleted;
  }

  async createResourceNode(data: InsertResourceNode): Promise<ResourceNode> {
    // De-duplicate: check if a node with identical key fields already exists
    const conditions = [
      eq(resourceNodes.subjectId, data.subjectId),
      eq(resourceNodes.resourceKey, data.resourceKey),
      eq(resourceNodes.title, data.title),
    ];

    if (data.parentNodeId) {
      conditions.push(eq(resourceNodes.parentNodeId, data.parentNodeId));
    } else {
      conditions.push(
        or(
          isNull(resourceNodes.parentNodeId),
          eq(resourceNodes.parentNodeId, "node-pp-root")
        ) as any
      );
    }

    const existing = await db.select().from(resourceNodes).where(and(...conditions)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const id = randomUUID();
    const [node] = await db.insert(resourceNodes).values({ ...data, id }).returning();
    return node;
  }

  async updateResourceNode(id: string, data: Partial<InsertResourceNode>): Promise<ResourceNode | undefined> {
    const [node] = await db.update(resourceNodes).set(data).where(eq(resourceNodes.id, id)).returning();
    return node;
  }

  async deleteResourceNode(id: string): Promise<boolean> {
    const [deleted] = await db.delete(resourceNodes).where(eq(resourceNodes.id, id)).returning();
    return !!deleted;
  }

  // =============================================
  // ONBOARDING METHODS
  // =============================================

  async getUserProfileByDeviceId(deviceId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.deviceId, deviceId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = randomUUID();
    const [created] = await db.insert(userProfiles).values({ ...profile, id }).returning();
    return created;
  }

  async updateUserProfile(id: string, data: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db.update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.id, id))
      .returning();
    return updated;
  }

  async getUserPreferences(profileId: string): Promise<UserPreference | undefined> {
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.profileId, profileId));
    return prefs;
  }

  async upsertUserPreferences(preferences: InsertUserPreferences): Promise<UserPreference> {
    // Check if preferences exist for this profile
    const existing = await this.getUserPreferences(preferences.profileId);

    if (existing) {
      // Update existing
      const [updated] = await db.update(userPreferences)
        .set({ ...preferences, updatedAt: new Date() })
        .where(eq(userPreferences.profileId, preferences.profileId))
        .returning();
      return updated;
    } else {
      // Create new
      const id = randomUUID();
      const [created] = await db.insert(userPreferences).values({ ...preferences, id }).returning();
      return created;
    }
  }

  async getUserSubjects(profileId: string): Promise<UserSubject[]> {
    return await db.select().from(userSubjects).where(eq(userSubjects.profileId, profileId));
  }

  async setUserSubjects(profileId: string, subjectIds: string[]): Promise<void> {
    // Delete all existing subjects for this profile
    await db.delete(userSubjects).where(eq(userSubjects.profileId, profileId));

    // Insert new subjects
    if (subjectIds.length > 0) {
      const values = subjectIds.map(subjectId => ({
        id: randomUUID(),
        profileId,
        subjectId,
      }));
      await db.insert(userSubjects).values(values);
    }
  }

  // =============================================
  // FEEDBACK METHODS
  // =============================================

  async getAllFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = randomUUID();
    const [created] = await db.insert(feedback).values({ ...insertFeedback, id }).returning();
    return created;
  }

  // =============================================
  // STUDENT REGISTRATION METHODS
  // =============================================

  async getStudentRegistration(id: string): Promise<StudentRegistration | undefined> {
    const [registration] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.id, id));
    return registration;
  }

  async getStudentRegistrationByUserId(userId: string): Promise<StudentRegistration | undefined> {
    const [registration] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.userId, userId));
    return registration;
  }

  async createStudentRegistration(registration: InsertStudentRegistration): Promise<StudentRegistration> {
    const id = randomUUID();
    const [created] = await db.insert(studentRegistrations).values({
      ...registration,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      registrationCompletedAt: new Date(),
    }).returning();
    return created;
  }

  async updateStudentRegistration(id: string, data: Partial<InsertStudentRegistration>): Promise<StudentRegistration | undefined> {
    const [updated] = await db.update(studentRegistrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studentRegistrations.id, id))
      .returning();
    return updated;
  }

  async upsertStudentRegistration(userId: string, data: Partial<InsertStudentRegistration>): Promise<StudentRegistration> {
    const existing = await this.getStudentRegistrationByUserId(userId);

    if (existing) {
      // Update existing registration
      const [updated] = await db.update(studentRegistrations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(studentRegistrations.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new registration
      const id = randomUUID();
      const [created] = await db.insert(studentRegistrations).values({
        ...data,
        userId,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationCompletedAt: new Date(),
      } as any).returning();
      return created;
    }
  }

  // =============================================
  // TUTOR REGISTRATION METHODS
  // =============================================

  async getTutorRegistration(id: string): Promise<TutorRegistration | undefined> {
    const [registration] = await db.select().from(tutorRegistrations).where(eq(tutorRegistrations.id, id));
    return registration;
  }

  async getTutorRegistrationByUserId(userId: string): Promise<TutorRegistration | undefined> {
    const [registration] = await db.select().from(tutorRegistrations).where(eq(tutorRegistrations.userId, userId));
    return registration;
  }

  async createTutorRegistration(registration: InsertTutorRegistration): Promise<TutorRegistration> {
    const id = randomUUID();
    const [created] = await db.insert(tutorRegistrations).values({
      ...registration,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateTutorRegistration(id: string, data: Partial<InsertTutorRegistration>): Promise<TutorRegistration | undefined> {
    const [updated] = await db.update(tutorRegistrations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tutorRegistrations.id, id))
      .returning();
    return updated;
  }

  async upsertTutorRegistration(userId: string, data: Partial<InsertTutorRegistration>): Promise<TutorRegistration> {
    const existing = await this.getTutorRegistrationByUserId(userId);

    if (existing) {
      const [updated] = await db.update(tutorRegistrations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tutorRegistrations.userId, userId))
        .returning();
      return updated;
    } else {
      const id = randomUUID();
      const [created] = await db.insert(tutorRegistrations).values({
        ...data,
        userId,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();

