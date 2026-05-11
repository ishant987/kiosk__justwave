import type { ActiveSession, ChildProfile } from './child';

export interface ParentProfile {
  id: string;
  name?: string;
  phone?: string | null;
  children?: ChildProfile[];
  active_sessions?: ActiveSession[];
}

export interface ParentLookupResponse {
  status?: string;
  data?: {
    record_type?: string;
    customer?: ParentProfile | null;
    parent?: ParentProfile | null;
    children?: ChildProfile[];
    active_sessions?: ActiveSession[];
  };
  customer?: ParentProfile | null;
  parent?: ParentProfile | null;
  children?: ChildProfile[];
  active_sessions?: ActiveSession[];
  found?: boolean;
  message?: string;
}
