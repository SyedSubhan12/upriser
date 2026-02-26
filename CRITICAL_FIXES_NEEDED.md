# CRITICAL FIXES NEEDED - Action Items

## 🚨 MUST FIX IMMEDIATELY

### 1. Password Security (CRITICAL)
**Files:** `server/routes.ts`, `server/seed-demo-teacher.ts`, `server/auth.ts`

**Current State:**
```typescript
// ❌ WRONG - Plain text storage and comparison
const user = await storage.getUserByEmail(email);
if (!user || user.password !== password) {
  return res.status(401).json({ error: "Invalid credentials" });
}
```

**Required Fix:**
```typescript
// ✅ CORRECT - Hash passwords
import bcrypt from 'bcrypt';

// On user creation/registration:
const hashedPassword = await bcrypt.hash(password, 10);
const user = await storage.createUser({
  ...userData,
  password: hashedPassword
});

// On login:
const user = await storage.getUserByEmail(email);
if (!user || !(await bcrypt.compare(password, user.password))) {
  return res.status(401).json({ error: "Invalid credentials" });
}
```

**Install:** `npm install bcrypt @types/bcrypt`

---

### 2. Schema Field Mismatch - Boards
**Files:** `server/admin-routes.ts`, `shared/schema.ts`

**Problem:**
- Schema uses `isEnabled` for curriculum boards
- Admin routes use `isActive` for boards
- Will cause runtime errors

**Fix Option A (Recommended):** Update admin routes to use `isEnabled`
```typescript
// In admin-routes.ts, replace all:
isActive: z.boolean() → isEnabled: z.boolean()
b.isActive → b.isEnabled
board.isActive → board.isEnabled
```

**Fix Option B:** Update schema to use `isActive`
```typescript
// In shared/schema.ts line 72:
isEnabled: boolean("is_enabled") → isActive: boolean("is_active")
```

---

### 3. Admin User Creation - Temp Password
**File:** `server/admin-routes.ts` line 159

**Current:**
```typescript
// ❌ Users get "TEMP_PASSWORD" and cannot login
const user = await storage.createUser({
  email,
  password: "TEMP_PASSWORD",
  name,
  role,
  // ...
});
```

**Fix Option A:** Generate and email random password
```typescript
import crypto from 'crypto';
const tempPassword = crypto.randomBytes(8).toString('hex');
const hashedPassword = await bcrypt.hash(tempPassword, 10);
const user = await storage.createUser({
  email,
  password: hashedPassword,
  // ...
});
// Send email with tempPassword to user
await sendPasswordEmail(email, tempPassword);
```

**Fix Option B:** Send magic link for first login
```typescript
const resetToken = crypto.randomBytes(32).toString('hex');
await storage.createUser({
  email,
  password: null, // No password yet
  passwordResetToken: resetToken,
  // ...
});
await sendSetupEmail(email, resetToken);
```

---

## ⚠️ HIGH PRIORITY SECURITY

### 4. Missing Authentication on Routes
**File:** `server/routes.ts`

**Vulnerable Routes:**
```typescript
// ❌ Anyone can create/modify boards and subjects
app.post("/api/boards", async (req, res) => { ... });
app.patch("/api/boards/:id", async (req, res) => { ... });
app.post("/api/subjects", async (req, res) => { ... });
app.patch("/api/subjects/:id", async (req, res) => { ... });
```

**Fix:**
```typescript
// ✅ Add auth middleware
import { requireAuth, requireRole } from "./middleware/rbac";

app.post("/api/boards", requireAuth, requireRole("admin"), async (req, res) => { ... });
app.patch("/api/boards/:id", requireAuth, requireRole("admin"), async (req, res) => { ... });
app.post("/api/subjects", requireAuth, requireRole("admin"), async (req, res) => { ... });
app.patch("/api/subjects/:id", requireAuth, requireRole("admin"), async (req, res) => { ... });
```

---

### 5. Missing Resource Ownership Check
**File:** `server/routes.ts` line 476

**Current:**
```typescript
// ❌ Any teacher can modify any material
app.patch("/api/materials/:id", async (req, res) => {
  const material = await storage.updateMaterial(req.params.id, req.body);
  // ...
});
```

**Fix:**
```typescript
// ✅ Check ownership or admin role
app.patch("/api/materials/:id", requireAuth, async (req, res) => {
  const material = await storage.getMaterial(req.params.id);
  if (!material) {
    return res.status(404).json({ error: "Material not found" });
  }
  
  // Only owner or admin can update
  if (material.uploaderId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Not authorized to modify this material" });
  }
  
  const updated = await storage.updateMaterial(req.params.id, req.body);
  return res.json(updated);
});
```

---

## 🔧 BLOCKING BUGS

### 6. Storage Interface Missing Method
**File:** `server/storage.ts`

**Problem:**
```typescript
// Method implemented in class (line 491):
async getFileAssetsBySubjectAndResource(subjectId: string, resourceKey: string): Promise<FileAsset[]>

// But NOT in interface (lines 21-99)
export interface IStorage {
  // ... other methods
  // ❌ Missing: getFileAssetsBySubjectAndResource
}
```

**Fix:**
```typescript
// Add to IStorage interface around line 98:
export interface IStorage {
  // ... existing methods ...
  getFileAssetsBySubjectAndResource(subjectId: string, resourceKey: string): Promise<FileAsset[]>;
  getSubjectWithContext(subjectId: string): Promise<any>;
}
```

---

### 7. Resource Nodes Parent Logic
**File:** `server/storage.ts` lines 443-461

**Problem:**
```typescript
// ❌ Cannot fetch root nodes properly
async getResourceNodes(subjectId: string, resourceKey: string, parentNodeId?: string | null) {
  const conditions = [
    eq(resourceNodes.subjectId, subjectId),
    eq(resourceNodes.resourceKey, resourceKey)
  ];
  
  if (parentNodeId) {
    conditions.push(eq(resourceNodes.parentNodeId, parentNodeId));
  }
  // Missing: what if parentNodeId is explicitly null?
}
```

**Fix:**
```typescript
// ✅ Handle null case explicitly
import { isNull } from 'drizzle-orm';

async getResourceNodes(subjectId: string, resourceKey: string, parentNodeId?: string | null) {
  const conditions = [
    eq(resourceNodes.subjectId, subjectId),
    eq(resourceNodes.resourceKey, resourceKey)
  ];
  
  if (parentNodeId === undefined) {
    // Fetch root nodes
    conditions.push(isNull(resourceNodes.parentNodeId));
  } else if (parentNodeId !== null) {
    // Fetch children of specific parent
    conditions.push(eq(resourceNodes.parentNodeId, parentNodeId));
  } else {
    // parentNodeId explicitly null - root nodes
    conditions.push(isNull(resourceNodes.parentNodeId));
  }
  
  return await db.select().from(resourceNodes).where(and(...conditions)).orderBy(resourceNodes.sortOrder);
}
```

---

## 📋 CHECKLIST

- [ ] Install bcrypt: `npm install bcrypt @types/bcrypt`
- [ ] Fix password hashing in routes.ts login endpoint
- [ ] Fix password hashing in user creation
- [ ] Update seed scripts to use hashed passwords
- [ ] Fix isActive/isEnabled field mismatch in admin routes
- [ ] Add authentication middleware to boards/subjects routes
- [ ] Implement resource ownership validation
- [ ] Fix admin user creation temp password issue
- [ ] Add missing methods to IStorage interface
- [ ] Fix resource nodes parent logic
- [ ] Test all authentication flows
- [ ] Test admin panel board operations
- [ ] Test admin user creation and login
- [ ] Test curriculum navigation and file browsing

---

## 🧪 VERIFICATION TESTS

After fixes, test these scenarios:

```bash
# 1. Test password hashing
# - Register new user
# - Check database: password should be hashed (starts with $2b$)
# - Login should work

# 2. Test admin board operations
# - Login as admin
# - Create new board
# - Toggle board status
# - Should all work without errors

# 3. Test admin user creation
# - Create new user as admin
# - New user should receive email/notification
# - New user should be able to login

# 4. Test security
# - Try creating board without login (should fail 401)
# - Try modifying someone else's material (should fail 403)

# 5. Test curriculum navigation
# - Browse to subject
# - Navigate folder tree
# - Root folders should display correctly
```

---

**Priority:** Fix items 1-5 ASAP before any production deployment!
