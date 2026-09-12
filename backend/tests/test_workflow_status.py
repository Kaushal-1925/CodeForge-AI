from app.services.workflow_status import get_workflow_run_status


def test_completed_workflow_maps_to_completed():
    state = {
        "status": "all_tasks_completed",
    }

    assert get_workflow_run_status(state) == "completed"


def test_max_retries_maps_to_failed():
    state = {
        "status": "max_retries_reached",
    }

    assert get_workflow_run_status(state) == "failed"


def test_validation_failure_maps_to_failed():
    state = {
        "status": "task_validation_failed",
    }

    assert get_workflow_run_status(state) == "failed"


def test_unknown_status_maps_to_failed():
    state = {
        "status": "some_unknown_status",
    }

    assert get_workflow_run_status(state) == "failed"
