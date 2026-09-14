from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class WorkflowRunResponse(BaseModel):
    id: UUID
    project_id: UUID
    status: str
    current_agent: str | None
    current_task: str | None
    iteration: int
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)