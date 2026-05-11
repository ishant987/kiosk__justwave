export interface ChildProfile {
  id: string;
  name: string;
  age?: number;
  active_session?: ActiveSession | null;
}

export interface ActiveSession {
  id: string;
  child_id?: string;
  child_name?: string;
  entry_time?: string;
  pass_id?: string;
}
