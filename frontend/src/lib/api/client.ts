import type {
  ApprovalStatus,
  ArtifactListResponse,
  CreateProjectInput,
  CreateWorkflowRunInput,
  HealthResponse,
  Project,
  WorkflowRun,
} from "./types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response);

    throw new ApiError(detail ?? `Request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

function projectPath(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}

function runPath(projectId: string, runId: string): string {
  return `${projectPath(projectId)}/runs/${encodeURIComponent(runId)}`;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: input,
  });
}

export function listProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export function getProject(projectId: string): Promise<Project> {
  return request<Project>(projectPath(projectId));
}

export function createWorkflowRun(
  projectId: string,
  input: CreateWorkflowRunInput,
): Promise<WorkflowRun> {
  return request<WorkflowRun>(`${projectPath(projectId)}/runs`, {
    method: "POST",
    body: input,
  });
}

export function listWorkflowRuns(projectId: string): Promise<WorkflowRun[]> {
  return request<WorkflowRun[]>(`${projectPath(projectId)}/runs`);
}

export function getWorkflowRun(projectId: string, runId: string): Promise<WorkflowRun> {
  return request<WorkflowRun>(runPath(projectId, runId));
}

export function getWorkflowRunArtifacts(
  projectId: string,
  runId: string,
): Promise<ArtifactListResponse> {
  return request<ArtifactListResponse>(`${runPath(projectId, runId)}/artifacts`);
}

export function updateWorkflowRunApproval(
  projectId: string,
  runId: string,
  approvalStatus: Exclude<ApprovalStatus, "pending">,
): Promise<WorkflowRun> {
  return request<WorkflowRun>(`${runPath(projectId, runId)}/approval`, {
    method: "PATCH",
    body: { approval_status: approvalStatus },
  });
}
