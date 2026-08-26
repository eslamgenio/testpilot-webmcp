import { getDatabase } from "@/db";
import { createSeedState } from "@/src/domain/seed";
import type { StateRepository } from "@/src/domain/repository";
import type { AppState } from "@/src/domain/types";

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS testpilot_sessions (
    session_id TEXT PRIMARY KEY NOT NULL,
    state_json TEXT NOT NULL,
    revision INTEGER NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

type StoredState = {
  state_json: string;
  revision: number;
};

let schemaReady: Promise<void> | null = null;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function parseState(row: StoredState): AppState {
  const state = JSON.parse(row.state_json) as AppState;
  if (state.schema_version !== 1 || state.revision !== row.revision) {
    throw new Error("The stored TestPilot session state is invalid.");
  }
  return state;
}

async function ensureSchema(database: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = database
      .prepare(CREATE_TABLE_SQL)
      .run()
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }

  await schemaReady;
}

export class D1StateRepository implements StateRepository {
  private readonly database: D1Database;

  constructor(private readonly sessionId: string, database?: D1Database) {
    this.database = database ?? getDatabase();
  }

  async read(): Promise<AppState> {
    const row = await this.readOrCreate();
    return clone(parseState(row));
  }

  async update<T>(mutator: (draft: AppState) => T | Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const stored = await this.readOrCreate();
      const draft = parseState(stored);
      const result = await mutator(draft);
      draft.revision = stored.revision + 1;

      const update = await this.database
        .prepare(
          `UPDATE testpilot_sessions
           SET state_json = ?, revision = ?, updated_at = ?
           WHERE session_id = ? AND revision = ?`,
        )
        .bind(
          JSON.stringify(draft),
          draft.revision,
          new Date().toISOString(),
          this.sessionId,
          stored.revision,
        )
        .run();

      if (Number(update.meta.changes ?? 0) === 1) {
        return clone(result);
      }
    }

    throw new Error("The TestPilot session changed too quickly. Please retry the action.");
  }

  async reset(): Promise<AppState> {
    await ensureSchema(this.database);
    const state = createSeedState();

    await this.database
      .prepare(
        `INSERT INTO testpilot_sessions (session_id, state_json, revision, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(session_id) DO UPDATE SET
           state_json = excluded.state_json,
           revision = excluded.revision,
           updated_at = excluded.updated_at`,
      )
      .bind(
        this.sessionId,
        JSON.stringify(state),
        state.revision,
        new Date().toISOString(),
      )
      .run();

    return clone(state);
  }

  private async readOrCreate(): Promise<StoredState> {
    await ensureSchema(this.database);
    const existing = await this.readRow();
    if (existing) return existing;

    const seed = createSeedState();
    await this.database
      .prepare(
        `INSERT OR IGNORE INTO testpilot_sessions (session_id, state_json, revision, updated_at)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        this.sessionId,
        JSON.stringify(seed),
        seed.revision,
        new Date().toISOString(),
      )
      .run();

    const created = await this.readRow();
    if (!created) {
      throw new Error("TestPilot could not initialize the session state.");
    }
    return created;
  }

  private readRow(): Promise<StoredState | null> {
    return this.database
      .prepare(
        `SELECT state_json, revision
         FROM testpilot_sessions
         WHERE session_id = ?`,
      )
      .bind(this.sessionId)
      .first<StoredState>();
  }
}
