import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_get_updates():
    activity = "Chess Club"
    email = "test_student@example.com"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    result = resp.json()
    assert "Signed up" in result["message"]

    # Verify the in-memory activities reflect the new participant
    resp2 = client.get("/activities")
    data = resp2.json()
    assert email in data[activity]["participants"]


def test_unregister_participant():
    activity = "Chess Club"
    email = "test_student_to_remove@example.com"

    # Ensure participant exists first
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    result = resp.json()
    assert "Unregistered" in result["message"]

    # Confirm removal
    resp2 = client.get("/activities")
    data = resp2.json()
    assert email not in data[activity]["participants"]
