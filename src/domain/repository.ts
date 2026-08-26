import { createSeedState } from "./seed";
import type { AppState } from "./types";

export interface StateRepository {
  read(): Promise<AppState>;
  update<T>(mutator: (draft: AppState) => T | Promise<T>): Promise<T>;
  reset(): Promise<AppState>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryStateRepository implements StateRepository {
  private state: AppState;

  constructor(initialState: AppState = createSeedState()) {
    this.state = clone(initialState);
  }

  async read(): Promise<AppState> {
    return clone(this.state);
  }

  async update<T>(mutator: (draft: AppState) => T | Promise<T>): Promise<T> {
    const draft = clone(this.state);
    const result = await mutator(draft);
    draft.revision += 1;
    this.state = draft;
    return clone(result);
  }

  async reset(): Promise<AppState> {
    this.state = createSeedState();
    return this.read();
  }
}
