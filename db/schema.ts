import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const testpilotSessions = sqliteTable("testpilot_sessions", {
  sessionId: text("session_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull(),
});
