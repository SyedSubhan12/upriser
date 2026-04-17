import { apiRequest } from "@/lib/queryClient";

export interface AdminUserListQuery {
  q?: string;
  role?: "student" | "teacher" | "admin";
  boardId?: string;
  status?: "ACTIVE" | "INACTIVE";
  page?: number;
  pageSize?: number;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  avatar: string | null;
  board: { id: string; name: string } | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  lastLoginAt: string | null;
  boardIds: string[];
  subjectIds: string[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminUserListResponse {
  data: AdminUserSummary[];
  pagination: PaginationMeta;
}

export interface CreateAdminUserBody {
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  boardId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

export interface UpdateAdminUserBody {
  name?: string;
  role?: "student" | "teacher" | "admin";
  boardId?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

export async function listAdminUsers(params: AdminUserListQuery): Promise<AdminUserListResponse> {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.role) searchParams.set("role", params.role);
  if (params.boardId) searchParams.set("boardId", params.boardId);
  if (params.status) searchParams.set("status", params.status);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const res = await apiRequest("GET", `/api/admin/users?${searchParams.toString()}`);
  return res.json();
}

export async function createAdminUser(body: CreateAdminUserBody): Promise<AdminUserSummary> {
  const res = await apiRequest("POST", "/api/admin/users", body);
  return res.json();
}

export async function getAdminUser(id: string): Promise<AdminUserSummary> {
  const res = await apiRequest("GET", `/api/admin/users/${id}`);
  return res.json();
}

export async function updateAdminUser(id: string, body: UpdateAdminUserBody): Promise<AdminUserSummary> {
  const res = await apiRequest("PATCH", `/api/admin/users/${id}`, body);
  return res.json();
}

export async function deleteAdminUser(id: string): Promise<AdminUserSummary> {
  const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
  return res.json();
}

export interface AdminBoardSummary {
  id: string;
  name: string; // Compatibility
  displayName: string;
  code: string; // Compatibility
  boardKey: string;
  description: string | null;
  isActive: boolean; // Compatibility
  isEnabled: boolean;
}

export async function listAdminBoards(): Promise<AdminBoardSummary[]> {
  const res = await apiRequest("GET", "/api/admin/boards");
  return res.json();
}

export async function createAdminBoard(body: {
  name: string;
  code: string;
  description?: string | null;
  isActive?: boolean;
}): Promise<AdminBoardSummary> {
  // Transform frontend field names to backend field names
  const requestBody: any = {
    name: body.name,
    code: body.code,
    description: body.description,
    isEnabled: body.isActive ?? true, // Map isActive -> isEnabled (default true)
  };

  const res = await apiRequest("POST", "/api/admin/boards", requestBody);
  return res.json();
}

export async function updateAdminBoard(id: string, body: Partial<AdminBoardSummary>): Promise<AdminBoardSummary> {
  // Transform frontend field names to backend field names
  const requestBody: any = {};
  if (body.name !== undefined) requestBody.name = body.name;
  if (body.code !== undefined) requestBody.code = body.code;
  if (body.description !== undefined) requestBody.description = body.description;
  if (body.isActive !== undefined) requestBody.isEnabled = body.isActive; // Map isActive -> isEnabled

  const res = await apiRequest("PATCH", `/api/admin/boards/${id}`, requestBody);
  return res.json();
}

export async function deleteAdminBoard(id: string): Promise<AdminBoardSummary> {
  const res = await apiRequest("DELETE", `/api/admin/boards/${id}`);
  return res.json();
}

export interface AdminMaterialSummary {
  id: string;
  title: string;
  type: string;
  uploaderName: string | null;
  subject: string | null;
  board: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  fileUrl?: string | null;
  videoUrl?: string | null;
}

export interface AdminMaterialListQuery {
  status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED";
  boardId?: string;
  subject?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminMaterialListResponse {
  data: AdminMaterialSummary[];
  pagination: PaginationMeta;
}

export async function listAdminMaterials(params: AdminMaterialListQuery): Promise<AdminMaterialListResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.boardId) searchParams.set("boardId", params.boardId);
  if (params.subject) searchParams.set("subject", params.subject);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));

  const res = await apiRequest("GET", `/api/admin/materials?${searchParams.toString()}`);
  return res.json();
}

export async function approveAdminMaterial(id: string): Promise<{ id: string; status: string }> {
  const res = await apiRequest("POST", `/api/admin/materials/${id}/approve`);
  return res.json();
}

export async function rejectAdminMaterial(id: string, reason?: string): Promise<{ id: string; status: string }> {
  const res = await apiRequest("POST", `/api/admin/materials/${id}/reject`, reason ? { reason } : undefined);
  return res.json();
}

export interface AdminOverviewStats {
  totalStudents: number;
  totalTeachers: number;
  totalBoards: number;
  totalMaterials: number;
  dailyActiveUsers: number;
  pendingMaterials: number;
}

export interface AdminOverviewEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface AdminOverviewResponse {
  stats: AdminOverviewStats;
  recentEvents: AdminOverviewEvent[];
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const res = await apiRequest("GET", "/api/admin/overview");
  return res.json();
}

// Subjects API
export interface AdminSubject {
  id: string;
  name: string; // Compatibility
  subjectName: string;
  code: string; // Compatibility
  subjectCode: string;
  boardId: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function listSubjects(boardId?: string): Promise<AdminSubject[]> {
  const params = boardId ? `?boardId=${boardId}` : "";
  const res = await apiRequest("GET", `/api/subjects${params}`);
  return res.json();
}

export async function createSubject(body: {
  name: string;
  code: string;
  boardId: string;
  description?: string | null;
  icon?: string | null;
}): Promise<AdminSubject> {
  const res = await apiRequest("POST", "/api/subjects", body);
  return res.json();
}

export async function updateSubject(id: string, body: Partial<{
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}>): Promise<AdminSubject> {
  const res = await apiRequest("PATCH", `/api/subjects/${id}`, body);
  return res.json();
}

// Topics API
export interface AdminTopic {
  id: string;
  name: string;
  subjectId: string;
  parentId: string | null;
  order: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function listTopics(subjectId: string): Promise<AdminTopic[]> {
  const res = await apiRequest("GET", `/api/topics?subjectId=${subjectId}`);
  return res.json();
}

export async function createTopic(body: {
  name: string;
  subjectId: string;
  parentId?: string | null;
  order?: number;
  description?: string | null;
}): Promise<AdminTopic> {
  const res = await apiRequest("POST", "/api/topics", body);
  return res.json();
}

export async function updateTopic(id: string, body: Partial<{
  name: string;
  parentId: string | null;
  order: number;
  description: string | null;
  isActive: boolean;
}>): Promise<AdminTopic> {
  const res = await apiRequest("PATCH", `/api/topics/${id}`, body);
  return res.json();
}

export async function deleteTopic(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/topics/${id}`);
}
// Feedback API
export interface FeedbackItem {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export async function fetchFeedback(): Promise<FeedbackItem[]> {
  const res = await apiRequest("GET", "/api/admin/feedback");
  if (!res.ok) throw new Error("Failed to fetch feedback");
  return res.json();
}

// =============================================
// Resource Management API
// =============================================

export interface ResourceCategory {
  id: string;
  resourceKey: string;
  label: string;
  icon: string | null;
  sortOrder: number;
}

export interface ResourceNode {
  id: string;
  subjectId: string;
  resourceKey: string;
  parentNodeId: string | null;
  title: string;
  nodeType: string;
  meta: any;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileAsset {
  id: string;
  subjectId: string;
  resourceKey: string;
  nodeId: string;
  title: string;
  fileType: string;
  url: string;
  fileSize: number | null;
  paper: number | null;
  variant: number | null;
  year: number | null;
  session: string | null;
  objectKey: string | null;
  downloadCount: number | null;
  isPublic: boolean;
  createdAt: string;
}

export async function fetchResourceCategories(): Promise<ResourceCategory[]> {
  const res = await apiRequest("GET", "/api/curriculum/resource-categories");
  return res.json();
}

export async function fetchResourceNodes(
  subjectId: string,
  resourceKey: string,
  parentNodeId?: string | null
): Promise<ResourceNode[]> {
  const params = new URLSearchParams();
  if (parentNodeId) params.set("parentNodeId", parentNodeId);
  const query = params.toString();
  const url = `/api/curriculum/subjects/${subjectId}/resource/${resourceKey}/nodes${query ? `?${query}` : ""}`;
  const res = await apiRequest("GET", url);
  return res.json();
}

export async function fetchFilesByNode(nodeId: string): Promise<FileAsset[]> {
  const res = await apiRequest("GET", `/api/curriculum/nodes/${nodeId}/files`);
  return res.json();
}

export async function createResourceNode(body: {
  subjectId: string;
  resourceKey: string;
  parentNodeId?: string | null;
  title: string;
  nodeType: string;
  sortOrder?: number;
}): Promise<ResourceNode> {
  const res = await apiRequest("POST", "/api/curriculum/nodes", body);
  return res.json();
}

export async function updateResourceNode(
  nodeId: string,
  body: Partial<{ title: string; sortOrder: number }>
): Promise<ResourceNode> {
  const res = await apiRequest("PATCH", `/api/curriculum/nodes/${nodeId}`, body);
  return res.json();
}

export async function deleteResourceNode(nodeId: string): Promise<void> {
  await apiRequest("DELETE", `/api/curriculum/nodes/${nodeId}`);
}

export async function deleteFileAsset(fileId: string): Promise<void> {
  await apiRequest("DELETE", `/api/curriculum/files/${fileId}`);
}

export async function uploadFileAsset(formData: FormData): Promise<FileAsset> {
  const res = await fetch("/api/curriculum/files/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  return data.details;
}

export async function fetchQualifications(boardId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/curriculum/boards/${boardId}/qualifications`);
  return res.json();
}

export async function fetchSubjectsByQualification(qualId: string): Promise<any[]> {
  const res = await apiRequest("GET", `/api/curriculum/qualifications/${qualId}/subjects`);
  return res.json();
}
