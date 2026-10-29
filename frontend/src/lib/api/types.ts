export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface WorkflowRun {
  id: string;
  project_id: string;
  user_request: string;
  status: string;
  current_agent: string | null;
  current_task: string | null;
  iteration: number;
  approval_status: ApprovalStatus;
  started_at: string;
  completed_at: string | null;
}

export interface CreateWorkflowRunInput {
  user_request: string;
}

export interface ArtifactFile {
  path: string;
  content: string;
}

export interface ArtifactListResponse {
  run_id: string;
  files: ArtifactFile[];
}
