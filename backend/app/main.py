from fastapi import FastAPI

from app.api.projects import router as projects_router
from app.api.workflow_runs import router as workflow_runs_router


app = FastAPI(
    title="CodeForge AI",
    description="Autonomous multi-agent software engineering system",
    version="0.1.0",
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(projects_router)
app.include_router(workflow_runs_router)