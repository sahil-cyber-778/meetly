import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select, text
import main
import models
from transcripts import parse_transcript


@pytest.fixture
def client():
    with TestClient(main.app) as client:
        yield client


def create(client, **overrides):
    payload = dict(title="API Test Meeting", meeting_date="2026-10-09", duration=120, participants=["Alice", "Bob"], transcript_text="[00:00] Alice: Plan the launch.\n[00:15] Bob: Ship the nebula release.")
    payload.update(overrides)
    return client.post("/api/meetings", json=payload)


def test_persistence_and_cascades(client, isolated_database):
    meeting = create(client).json()
    mid = meeting["id"]
    assert meeting["transcript_segments"][0]["end_time"] == 15
    item = client.post(f"/api/meetings/{mid}/action-items", json={"text": "Send proposal", "assignee": "Alice"}).json()
    path = f"/api/meetings/{mid}/action-items/{item['id']}"
    assert client.patch(path, json={"completed": True, "text": "Send final proposal", "assignee": "Bob"}).status_code == 200
    assert client.put(f"/api/meetings/{mid}", json={"title": "Updated meeting", "participants": ["Bob"], "overview": "Decision", "notes": "Persist me"}).status_code == 200
    with isolated_database() as db:
        stored = db.get(models.Meeting, mid)
        assert stored.title == "Updated meeting" and stored.summary.notes == "Persist me"
        assert stored.action_items[0].completed and stored.action_items[0].assignee == "Bob"
        assert len(stored.transcript_segments) == 2
        assert db.scalar(text("PRAGMA foreign_keys")) == 1
    assert client.delete(path).status_code == 204
    assert client.patch(path, json={"completed": False}).status_code == 404
    client.post(f"/api/meetings/{mid}/action-items", json={"text": "Cascade me"})
    assert client.delete(f"/api/meetings/{mid}").status_code == 204
    with isolated_database() as db:
        for entity in (models.Participant, models.TranscriptSegment, models.Summary, models.ActionItem, models.Chapter):
            assert db.scalar(select(func.count()).select_from(entity).where(entity.meeting_id == mid)) == 0


@pytest.mark.parametrize("changes", [{"title": "  "}, {"title": None}, {"duration": -1}, {"participants": ["x" * 101]}, {"transcript_format": "pdf"}, {"transcript_text": "[99:00] Alice: Too late"}])
def test_invalid_create(client, changes):
    assert create(client, **changes).status_code == 422


def test_invalid_updates_and_ownership(client):
    mid = create(client).json()["id"]
    assert client.put(f"/api/meetings/{mid}", json={"duration": 60}).status_code == 422
    assert client.put(f"/api/meetings/{mid}", json={"title": None}).status_code == 422
    assert client.post(f"/api/meetings/{mid}/action-items", json={"text": " "}).status_code == 422
    item = client.post(f"/api/meetings/{mid}/action-items", json={"text": "A task"}).json()
    assert client.patch(f"/api/meetings/1/action-items/{item['id']}", json={"completed": True}).status_code == 404
    assert client.patch(f"/api/meetings/{mid}/action-items/{item['id']}", json={"completed": None}).status_code == 422


def test_filters_and_global_search(client):
    mid = create(client).json()["id"]
    assert client.get("/api/meetings", params={"participant": "Alice", "search": "API"}).json()[0]["id"] == mid
    assert not client.get("/api/meetings", params={"participant": "Missing"}).json()
    assert not client.get("/api/meetings", params={"search": "%"}).json()
    assert client.get("/api/meetings", params={"date_from": "2026-10-10", "date_to": "2026-10-01"}).status_code == 422
    for order in ("oldest", "newest"):
        dates = [m["meeting_date"] for m in client.get("/api/meetings", params={"sort": order}).json()]
        assert dates == sorted(dates, reverse=order == "newest")
    match = client.get("/api/search", params={"q": "nebula"}).json()[0]
    assert match["meeting_id"] == mid and match["start_time"] == 15
    assert client.get("/api/search", params={"q": "Alice"}).json()[0]["kind"] == "meeting"


@pytest.mark.parametrize("fmt,content", [("txt", "[00:00] Ada: Hello\n[00:10] Bob: World"), ("vtt", "WEBVTT\n\n00:00:02.000 --> 00:00:05.000\n<v Ada>Hello</v>\n\n00:00:10.000 --> 00:00:12.000\n<v Bob>World</v>"), ("json", '[{"start_time":0,"end_time":5,"speaker":"Ada","text":"Hello"},{"start_time":10,"speaker":"Bob","text":"World"}]')])
def test_formats_and_exports(client, fmt, content):
    response = create(client, transcript_format=fmt, transcript_text=content, participants=[])
    assert response.status_code == 201
    detail = response.json()
    assert [p["name"] for p in detail["participants"]] == ["Ada", "Bob"]
    assert len(detail["transcript_segments"]) == 2
    for ext in ("txt", "md"):
        exported = client.get(f"/api/meetings/{detail['id']}/export?format={ext}")
        assert exported.status_code == 200 and "Ada: Hello" in exported.text
        assert "attachment" in exported.headers["content-disposition"]
    assert "## Transcript" not in client.get(f"/api/meetings/{detail['id']}/export?content=summary").text


@pytest.mark.parametrize("content,fmt", [('{"bad":1}', "json"), ('[{"start_time":-1,"text":"x"}]', "json"), ('[{"start_time":0,"end_time":20,"text":"x"},{"start_time":10,"text":"y"}]', "json"), ("WEBVTT\n\nnot a cue", "vtt"), ("[00:99] A: nope", "txt"), ('[{"start_time":true,"text":"x"}]', "json")])
def test_bad_transcripts(content, fmt):
    with pytest.raises(ValueError):
        parse_transcript(content, [], 60, fmt)


def test_plain_text_timing():
    rows = parse_transcript("First line\nSecond line\nThird line", ["Alice"], 60)
    assert [(r["start_time"], r["end_time"]) for r in rows] == [(0, 20), (20, 40), (40, 60)]


def test_deleted_library_stays_empty_on_restart(client):
    for m in client.get("/api/meetings").json():
        assert client.delete(f"/api/meetings/{m['id']}").status_code == 204
    with TestClient(main.app) as restarted:
        assert restarted.get("/api/meetings").json() == []
