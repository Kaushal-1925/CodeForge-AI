from pathlib import Path

from langchain_groq import ChatGroq

from app.config import settings
from app.graph.state import CodeForgeState
from app.services.file_parser import parse_generated_files
from app.services.workspace_reader import read_workspace_files


model = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=settings.groq_api_key,
)


def developer_agent(state: CodeForgeState) -> CodeForgeState:
    test_results = state["test_results"]

    workspace_files = read_workspace_files(
        Path(state["workspace"])
    )

    existing_project = "\n\n".join(
        f"FILE: {path}\n{content}"
        for path, content in workspace_files.items()
    )

    response = model.invoke(
        f"""
You are the Developer Agent of CodeForge AI.

Your job is to complete ONE development task.

==================================================
CURRENT TASK
==================================================

{state["current_task"]}

==================================================
PREVIOUS TEST RESULTS
==================================================

{test_results}

If previous test results exist and indicate failure, use them to
identify what is wrong with the previous implementation and fix it.

If previous test results are empty, this is the first implementation
attempt.

Do not ignore previous test failures.

==================================================
CURRENT GENERATED PROJECT
==================================================

The following files already exist in the generated project workspace.

Treat these files as authoritative.

Build on them instead of recreating them.

{existing_project}

If the workspace is empty, this is the first implementation task.

==================================================
EXISTING CODEFORGE PROJECT
==================================================

The project already contains:

backend/app/main.py
backend/app/config.py
backend/app/database/base.py
backend/app/database/session.py
backend/app/database/dependencies.py
backend/app/models/
backend/app/schemas/
backend/app/api/
backend/app/services/
backend/tests/

==================================================
IMPORTANT
==================================================

You MUST implement ONLY the CURRENT TASK.

Do NOT implement the entire application.

Do NOT implement future functionality.

Do NOT generate unrelated files.

If the task asks for tests, generate the tests.

If the task asks for a model, generate the model.

If the task asks for a specific file, generate ONLY that file.

Never regenerate an existing file unless the CURRENT TASK explicitly
requires modifying that file.

==================================================
CODEFORGE PROJECT RULES
==================================================

1. SQLAlchemy models MUST inherit from:

   app.database.base.Base

2. Use the existing database session infrastructure.

3. Use PostgreSQL.

4. Use the existing psycopg driver.

5. NEVER use SQLite.

6. NEVER create database.py.

7. NEVER create another SQLAlchemy Base.

8. NEVER create another FastAPI application.

9. Python imports MUST use app.*.

10. Use SQLAlchemy 2.x typed models:

    Mapped
    mapped_column

11. Use Pydantic 2.x when Pydantic is required.

12. Use pytest for tests.

13. Do not hardcode secrets.

14. Do not create a separate Python project.

15. Do not execute commands.

16. Do not generate frontend files unless the CURRENT TASK explicitly
    asks for frontend functionality.

17. Do not generate Docker files unless the CURRENT TASK explicitly
    asks for Docker functionality.

18. Do not generate documentation unless the CURRENT TASK explicitly
    asks for documentation.

==================================================
EXISTING FILE HANDLING
==================================================

The existing repository is authoritative.

Do not invent existing files.

Do not regenerate unrelated existing files.

If the CURRENT TASK requires modifying an existing file,
generate its COMPLETE contents.

Do not output patches.

==================================================
OUTPUT REQUIREMENTS
==================================================

Generate only the files required to complete the CURRENT TASK.

Every generated file MUST use exactly this format:

FILE: backend/app/example.py
BEGIN_FILE
<complete file contents>
END_FILE

Return ONLY FILE sections.

Do not explain anything.

Do not summarize anything.

Do not include markdown outside FILE sections.

Do not claim that tests pass.
"""
    )

    state["files"] = parse_generated_files(
        str(response.content)
    )

    state["current_agent"] = "developer"
    state["status"] = "developer_completed"

    return state