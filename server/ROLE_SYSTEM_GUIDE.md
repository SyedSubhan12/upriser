# Enterprise Role-Based Authentication System

## 🎯 Overview

This system implements **enterprise-grade role management** following security patterns used by:
- Google Workspace
- Microsoft Teams
- Canvas LMS
- Slack
- GitHub Organizations

## 🔐 Security Principles

1. ✅ **Never trust client-side role claims** - Always verify from database
2. ✅ **Role stored in database** - Single source of truth
3. ✅ **Email-based automatic assignment** - Reduces manual work
4. ✅ **Admin whitelist** - Hardcoded super admins
5. ✅ **Middleware protection** - Every API route verifies role
6. ✅ **Session-based auth** - Secure server-side sessions

---

## 📋 How It Works

### **1. User Signs in with Google OAuth**

```
User clicks "Sign in with Google"
    ↓
Google authenticates user
    ↓
Callback returns to your server with user's email
    ↓
System checks: Does user exist in database?
    ├─ YES → Use existing role from database
    └─ NO  → Determine role from email → Create user with assigned role
    ↓
User is logged in with correct role
```

### **2. Role Assignment Logic** (Priority Order)

```typescript
1. Admin Whitelist (HIGHEST PRIORITY)
   - If email is in adminEmails array → role = "admin"
   
2. Teacher Domain/Pattern Match
   - If email matches teacher patterns → role = "teacher"
   - Example: professor@teacher.school.edu
   
3. Student Domain/Pattern Match
   - If email matches student patterns → role = "student"
   - Example: 202401@student.school.edu
   
4. Default Role
   - If no pattern matches → role = "student" (default)
```

---

## ⚙️ Configuration

### **Step 1: Configure Admin Emails**

Edit `/server/role-manager.ts`:

```typescript
const defaultRoleConfig: RoleConfig = {
  adminEmails: [
    "admin@yourschool.edu",
    "principal@yourschool.edu",
    "superintendent@yourschool.edu",
  ],
  // ... rest of config
}
```

### **Step 2: Configure Email Patterns**

#### **Option A: Domain-Based (Simplest)**

```typescript
const defaultRoleConfig: RoleConfig = {
  teacherDomains: [
    "teacher.yourschool.edu",  // teacher@teacher.yourschool.edu
    "faculty.yourschool.edu",  // prof@faculty.yourschool.edu
  ],
  studentDomains: [
    "student.yourschool.edu",  // john@student.yourschool.edu
  ],
}
```

#### **Option B: Pattern-Based (More Flexible)**

```typescript
const defaultRoleConfig: RoleConfig = {
  teacherEmailPatterns: [
    /^faculty\./i,           // faculty.john@yourschool.edu
    /^prof[0-9]+@/i,         // prof123@yourschool.edu
  ],
  studentEmailPatterns: [
    /^\d{6,}@/i,             // 202401@yourschool.edu (student ID)
    /^student\./i,           // student.jane@yourschool.edu
  ],
}
```

#### **Option C: No Patterns (Manual Assignment)**

```typescript
const defaultRoleConfig: RoleConfig = {
  adminEmails: ["admin@school.edu"],
  teacherDomains: [],
  teacherEmailPatterns: [],
  studentDomains: [],
  studentEmailPatterns: [],
  defaultRole: "student",  // Everyone gets student role by default
}
```

Then admin manually changes roles later.

---

## 🛡️ Protecting API Routes

### **Basic Protection Examples**

```typescript
import { requireAuth, requireRole } from "./middleware/rbac";

// 1. Require ANY authenticated user
app.get("/api/profile", requireAuth, (req, res) => {
  // req.user is available here
  res.json(req.user);
});

// 2. Require TEACHER or higher (teacher + admin)
app.get("/api/grades", requireAuth, requireRole("teacher"), (req, res) => {
  // Only teachers and admins can access
  res.json({ grades: [...] });
});

// 3. Require ADMIN only
app.delete("/api/users/:id", requireAuth, requireRole("admin"), (req, res) => {
  // Only admins can delete users
  res.json({ success: true });
});
```

### **Access Control Matrix**

| Route                       | Student | Teacher | Admin |
|-----------------------------|---------|---------|-------|
| `/api/profile`              | ✅      | ✅      | ✅    |
| `/api/assignments`          | ✅      | ✅      | ✅    |
| `/api/grades`               | ❌      | ✅      | ✅    |
| `/api/users`                | ❌      | ❌      | ✅    |
| `/api/boards` (create)      | ❌      | ❌      | ✅    |

---

## 🔧 Common Use Cases

### **Use Case 1: Students Can Only See Their Own Data**

```typescript
import { requireAuth, requireOwnershipOrAdmin } from "./middleware/rbac";

app.get("/api/users/:userId/assignments", 
  requireAuth, 
  requireOwnershipOrAdmin("userId"),
  async (req, res) => {
    // Students can only access their own assignments
    // Admins can access anyone's assignments
    const assignments = await storage.getAssignmentsByUser(req.params.userId);
    res.json(assignments);
  }
);
```

### **Use Case 2: Teachers Can Grade, Students Cannot**

```typescript
app.post("/api/submissions/:id/grade",
  requireAuth,
  requireRole("teacher"),  // Only teacher or admin
  async (req, res) => {
    const { score, feedback } = req.body;
    await storage.gradeSubmission(req.params.id, score, feedback);
    res.json({ success: true });
  }
);
```

### **Use Case 3: Only Admins Can Manage Users**

```typescript
// Create user
app.post("/api/users",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const user = await storage.createUser(req.body);
    res.json(user);
  }
);

// Change user role
app.patch("/api/users/:id/role",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const { role } = req.body;
    const user = await storage.updateUser(req.params.id, { role });
    res.json(user);
  }
);
```

---

## 📊 Example Configurations for Different Schools

### **Configuration 1: Simple School (All Gmail)**

```typescript
// Everyone uses Gmail, manual role assignment
const defaultRoleConfig: RoleConfig = {
  adminEmails: [
    "principal@gmail.com",
    "admin@gmail.com",
  ],
  teacherDomains: [],
  teacherEmailPatterns: [],
  studentDomains: [],
  studentEmailPatterns: [],
  defaultRole: "student",
};
```

### **Configuration 2: University with Email Structure**

```typescript
// Teachers: faculty.name@university.edu
// Students: studentID@university.edu (e.g., 202401@university.edu)
const defaultRoleConfig: RoleConfig = {
  adminEmails: [
    "dean@university.edu",
    "registrar@university.edu",
  ],
  teacherDomains: [],
  teacherEmailPatterns: [
    /^faculty\./i,  // faculty.john@university.edu
    /^prof\./i,     // prof.jane@university.edu
  ],
  studentDomains: [],
  studentEmailPatterns: [
    /^\d{6,}@/i,    // 202401@university.edu
  ],
  defaultRole: "student",
};
```

### **Configuration 3: School with Separate Domains**

```typescript
// Teachers: @teachers.school.edu
// Students: @students.school.edu
const defaultRoleConfig: RoleConfig = {
  adminEmails: [
    "admin@school.edu",
  ],
  teacherDomains: [
    "teachers.school.edu",
  ],
  studentDomains: [
    "students.school.edu",
  ],
  teacherEmailPatterns: [],
  studentEmailPatterns: [],
  defaultRole: "student",
};
```

---

## 🚨 Important Security Notes

### ✅ **DO:**

1. **Always use middleware on protected routes**
   ```typescript
   app.get("/api/sensitive-data", requireAuth, requireRole("admin"), handler);
   ```

2. **Check role in database, not session/cookie**
   ```typescript
   const user = await storage.getUser(req.session.userId);
   if (user.role === "admin") { /* allow */ }
   ```

3. **Log role assignments for audit trail**
   ```typescript
   console.log(`User ${email} assigned role: ${role}`);
   ```

### ❌ **DON'T:**

1. **Never trust role from client**
   ```typescript
   // WRONG - user can fake this
   const role = req.body.role;
   ```

2. **Never store role only in session**
   ```typescript
   // WRONG - session can be tampered
   req.session.role = "admin";
   ```

3. **Never expose role in URL**
   ```typescript
   // WRONG - insecure
   app.get("/api/:role/dashboard", handler);
   ```

---

## 🧪 Testing Your Configuration

### Test 1: Create Test Users

```bash
# In your database, manually create test users:
INSERT INTO users (email, role) VALUES
  ('admin@test.com', 'admin'),
  ('teacher@test.com', 'teacher'),
  ('student@test.com', 'student');
```

### Test 2: Try Logging In

1. Log in as each user
2. Check the console logs for role assignment
3. Try accessing protected routes

### Test 3: Verify Access Control

```bash
# As student - should fail (403)
curl http://localhost:5000/api/users -H "Cookie: connect.sid=..."

# As admin - should succeed (200)
curl http://localhost:5000/api/users -H "Cookie: connect.sid=..."
```

---

## 📝 Summary

This system provides **military-grade role security** by:

1. ✅ Checking database for role on EVERY request
2. ✅ Automatically assigning roles based on email
3. ✅ Protecting routes with middleware
4. ✅ Preventing privilege escalation
5. ✅ Logging all role assignments

**Your data is secure between roles!** 🔒
