# 🔐 Creating Admin User - Complete Guide

## Method 1: Quick Setup (Recommended)

### **Step 1: Edit Admin Credentials**

Open `/server/seed-admin.ts` and change these lines (10-12):

```typescript
const ADMIN_EMAIL = "admin@upriser.com";  // <-- YOUR EMAIL
const ADMIN_PASSWORD = "admin123";        // <-- YOUR PASSWORD
const ADMIN_NAME = "System Administrator"; // <-- YOUR NAME
```

**Example:**
```typescript
const ADMIN_EMAIL = "your.email@gmail.com";
const ADMIN_PASSWORD = "SecurePassword123!";
const ADMIN_NAME = "John Doe";
```

### **Step 2: Run the Seed Script**

```bash
npm run seed:admin
```

**Expected Output:**
```
🌱 Seeding admin user...
==================================================
✅ Admin user created successfully!
==================================================
📧 Email: your.email@gmail.com
👤 Name: John Doe
🔑 Role: admin
🆔 ID: abc-123-def-456
==================================================

⚠️  IMPORTANT: Change your password after first login!

✨ Seeding completed!
```

### **Step 3: Login**

1. Go to `http://localhost:5000/login`
2. Enter your admin email and password
3. You'll be redirected to `/admin/dashboard` ✅

---

## Method 2: Direct Database Insert (Alternative)

If you prefer to use SQL directly:

### **Step 1: Connect to Your Database**

```bash
# Using psql
psql "postgres://upriser_user:1730@localhost:5432/upriser"
```

### **Step 2: Insert Admin User**

```sql
INSERT INTO users (
  id,
  email,
  password,
  name,
  role,
  "authProvider",
  "isActive",
  "createdAt"
) VALUES (
  gen_random_uuid(),
  'admin@upriser.com',        -- Change this
  'admin123',                 -- Change this (not hashed in this simple setup)
  'System Administrator',     -- Change this
  'admin',
  'local',
  true,
  NOW()
);
```

### **Step 3: Verify**

```sql
SELECT id, email, name, role FROM users WHERE role = 'admin';
```

---

## Method 3: Update Existing User to Admin

If you already have an account and want to make it admin:

### **Option A: Using Seed Script**

1. Login with your existing account first
2. Run the seed script - it will detect if the email exists and upgrade the role:

```bash
# Edit seed-admin.ts to use YOUR existing email
npm run seed:admin
```

### **Option B: Using SQL**

```sql
-- Replace with your email
UPDATE users 
SET role = 'admin', "isActive" = true
WHERE email = 'your.existing.email@gmail.com';
```

---

## Troubleshooting

### Issue: "Database not connected"

**Solution:** Make sure your `.env` file has `DATABASE_URL`:

```env
DATABASE_URL=postgres://upriser_user:1730@localhost:5432/upriser
```

### Issue: "Admin user already exists"

**Good news!** The seed script detected an existing admin. Check the output for the user ID and role.

To **reset the password**, use SQL:

```sql
UPDATE users 
SET password = 'NewPassword123'
WHERE email = 'admin@upriser.com';
```

### Issue: Can't login after creating admin

**Check:**
1. Correct email and password (case-sensitive)
2. User is active: `SELECT "isActive" FROM users WHERE email = 'your@email.com';`
3. Role is 'admin': `SELECT role FROM users WHERE email = 'your@email.com';`

**Fix if needed:**
```sql
UPDATE users 
SET "isActive" = true, role = 'admin'
WHERE email = 'your@email.com';
```

---

## Security Best Practices

### ⚠️ **Important Security Notes:**

1. **Change default password immediately** after first login
2. **Use a strong password** (at least 12 characters, mix of letters, numbers, symbols)
3. **Don't commit** the seed script with real credentials to Git
4. **In production**, use environment variables:

```typescript
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@upriser.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
```

### 🔒 **Production Setup:**

For production, you should:

1. **Hash passwords** using bcrypt:
```typescript
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
```

2. **Use environment variables** for credentials
3. **Run seed script only once** during initial deployment
4. **Force password change** on first login

---

## Verifying Admin Access

### Test 1: Login
1. Go to `/login`
2. Enter admin credentials
3. Should redirect to `/admin/dashboard`

### Test 2: Check Role in Database
```sql
SELECT email, name, role, "isActive" 
FROM users 
WHERE role = 'admin';
```

### Test 3: Test Admin Features
- Can access `/admin/users`
- Can access `/admin/boards`
- Can access `/admin/settings`

Students/Teachers cannot access these!

---

## Quick Reference

```bash
# Create/Update admin user
npm run seed:admin

# Check database
psql "postgres://upriser_user:1730@localhost:5432/upriser"

# View all admins
SELECT email, role FROM users WHERE role = 'admin';

# Make user admin
UPDATE users SET role = 'admin' WHERE email = 'email@example.com';

# Reset password
UPDATE users SET password = 'newpass' WHERE email = 'admin@example.com';
```

---

## Summary

✅ **Easiest Method**: Edit `seed-admin.ts` → Run `npm run seed:admin`

✅ **Safest Method**: Use SQL to insert with hashed password

✅ **Quickest for Testing**: Use seed script with default values

**Your admin account is ready!** 🎉
