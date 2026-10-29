from fastapi import APIRouter

from app.api import projects, workflow_runs
from app.api.v1 import health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(projects.router)
api_router.include_router(workflow_runs.router)
