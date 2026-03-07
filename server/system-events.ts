import { db } from "./db.js";
import { systemEvents, type SystemEvent } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { desc } from "drizzle-orm";

export async function createSystemEvent(
  type: string,
  message: string,
  meta?: unknown,
): Promise<SystemEvent> {
  const [event] = await db
    .insert(systemEvents)
    .values({
      id: randomUUID(),
      type,
      message,
      meta: meta ?? null,
    })
    .returning();

  return event;
}

export async function getRecentSystemEvents(limit = 10): Promise<SystemEvent[]> {
  return db
    .select()
    .from(systemEvents)
    .orderBy(desc(systemEvents.createdAt))
    .limit(limit);
}
