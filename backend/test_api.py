from fastapi.testclient import TestClient

from main import app


def test_health_and_seeded_meetings():
    with TestClient(app) as client:
        assert client.get("/api/health").json() == {"status": "ok"}
        response = client.get("/api/meetings")
        assert response.status_code == 200
        assert len(response.json()) >= 5


def test_meeting_lifecycle_and_action_item():
    with TestClient(app) as client:
        created = client.post(
            "/api/meetings",
            json={
                "title": "API Test Meeting",
                "meeting_date": "2026-10-09",
                "duration": 900,
                "participants": ["Test User", "Teammate"],
                "overview": "A temporary meeting used to verify persistence.",
                "transcript_text": "[00:00] Test User: Hello team.\n[00:15] Teammate: The API works.",
            },
        )
        assert created.status_code == 201
        meeting = created.json()
        assert len(meeting["transcript_segments"]) == 2

        item = client.post(
            f"/api/meetings/{meeting['id']}/action-items",
            json={"text": "Verify action items", "assignee": "Test User"},
        )
        assert item.status_code == 201
        patched = client.patch(
            f"/api/meetings/{meeting['id']}/action-items/{item.json()['id']}",
            json={"completed": True},
        )
        assert patched.json()["completed"] is True

        updated = client.put(f"/api/meetings/{meeting['id']}", json={"title": "Updated API Test"})
        assert updated.json()["title"] == "Updated API Test"
        assert client.delete(f"/api/meetings/{meeting['id']}").status_code == 204
        assert client.get(f"/api/meetings/{meeting['id']}").status_code == 404

