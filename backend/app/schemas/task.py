from pydantic import BaseModel, Field


class TaskDefinition(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)


class TaskPlan(BaseModel):
    tasks: list[TaskDefinition]