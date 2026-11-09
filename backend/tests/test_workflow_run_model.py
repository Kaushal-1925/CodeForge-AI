from app.models.workflow_run import WorkflowRun


def test_workflow_run_model_has_expected_table_name():
    assert WorkflowRun.__tablename__ == "workflow_runs"


def test_workflow_run_model_has_expected_columns():
    columns = WorkflowRun.__table__.columns

    assert "id" in columns
    assert "project_id" in columns
    assert "status" in columns
    assert "current_agent" in columns
    assert "current_task" in columns
    assert "iteration" in columns
    assert "approval_status" in columns
    assert "started_at" in columns
    assert "completed_at" in columns


def test_workflow_run_model_column_types():
    columns = WorkflowRun.__table__.columns

    assert columns["id"].primary_key is True
    assert columns["project_id"].nullable is False
    assert columns["status"].nullable is False
    assert columns["iteration"].nullable is False
    assert columns["approval_status"].nullable is False

    assert columns["current_agent"].nullable is True
    assert columns["current_task"].nullable is True
    assert columns["completed_at"].nullable is True


def test_workflow_run_project_id_references_projects():
    foreign_keys = WorkflowRun.__table__.columns["project_id"].foreign_keys

    assert len(foreign_keys) == 1

    foreign_key = next(iter(foreign_keys))

    assert foreign_key.target_fullname == "projects.id"


def test_workflow_run_approval_defaults_to_pending():
    column = WorkflowRun.__table__.columns["approval_status"]

    assert column.default is not None
    assert column.default.arg == "pending"
    assert column.server_default is not None


def test_workflow_run_id_has_uuid_default():
    column = WorkflowRun.__table__.columns["id"]

    assert column.default is not None
    assert column.default.is_callable is True
