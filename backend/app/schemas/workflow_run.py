from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class WorkflowRunCreate(BaseModel):
    user_request: str = Field(min_length=1)


class WorkflowRunResponse(BaseModel):
    id: UUID
    project_id: UUID
    user_request: str
    status: str
    current_agent: str | None
    current_task: str | None
    iteration: int
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)