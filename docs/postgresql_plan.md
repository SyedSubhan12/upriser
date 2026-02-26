# PostgreSQL Integration Plan

This document outlines the steps to replace the in-memory storage with a persistent PostgreSQL database using Drizzle ORM.

## 1. Prerequisites

- **PostgreSQL Database**: A running PostgreSQL instance.
- **Environment Variable**: `DATABASE_URL` must be set in `.env` or the environment.
  - Format: `postgres://user:password@host:port/dbname`

## 2. Implementation Steps

### Step 1: Database Connection Setup (`server/db.ts`)
Create a new file `server/db.ts` to handle the connection pool.

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
```

### Step 2: Implement Database Storage (`server/storage.ts`)
Create a `DatabaseStorage` class that implements the `IStorage` interface.

- **Refactor**: Rename `MemStorage` to `MemStorage` (keep for fallback or testing).
- **New Class**: `DatabaseStorage`
  - Use `db.select()`, `db.insert()`, `db.update()`, `db.delete()` methods from Drizzle.
  - Map the Drizzle results to the application entities.

**Example Method Implementation:**
```typescript
async getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}
```

### Step 3: Switch Storage Provider
Modify the export in `server/storage.ts` to use `DatabaseStorage`.

```typescript
export const storage = new DatabaseStorage();
```

### Step 4: Database Migration
Use Drizzle Kit to push the schema to the database.

```bash
npm run db:push
```

## 3. Verification
1. Set `DATABASE_URL`.
2. Run migrations.
3. Start the server.
4. Verify data persistence by restarting the server.
