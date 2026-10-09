from datetime import date
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

import models, schemas
from database import get_db
from transcripts import parse_transcript


router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def options():
    return (
        selectinload(models.Meeting.participants),
        selectinload(models.Meeting.transcript_segments),
        selectinload(models.Meeting.summary),
        selectinload(models.Meeting.action_items),
        selectinload(models.Meeting.chapters),
    )


@router.get("", response_model=list[schemas.MeetingListOut])
def list_meetings(
    search: str = "",
    participant: str = "",
    date_from: date | None = None,
    date_to: date | None = None,
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    db: Session = Depends(get_db),
):
    if date_from and date_to and date_from > date_to:
        raise HTTPException(422, "Start date must not be after end date.")
    stmt = select(models.Meeting).options(selectinload(models.Meeting.participants), selectinload(models.Meeting.action_items))
    if search.strip():
        term = search.strip()
        stmt = stmt.where(or_(models.Meeting.title.icontains(term, autoescape=True), models.Meeting.participants.any(models.Participant.name.icontains(term, autoescape=True))))
    if participant.strip():
        stmt = stmt.where(models.Meeting.participants.any(models.Participant.name.icontains(participant.strip(), autoescape=True)))
    if date_from:
        stmt = stmt.where(models.Meeting.meeting_date >= date_from)
    if date_to:
        stmt = stmt.where(models.Meeting.meeting_date <= date_to)
    ordering = models.Meeting.meeting_date.desc() if sort == "newest" else models.Meeting.meeting_date.asc()
    return db.scalars(stmt.order_by(ordering, models.Meeting.id.desc())).unique().all()


@router.post("", response_model=schemas.MeetingDetailOut, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting = models.Meeting(title=payload.title.strip(), meeting_date=payload.meeting_date, duration=payload.duration)
    meeting.participants = [models.Participant(name=name) for name in payload.participants]
    try:
        rows = parse_transcript(payload.transcript_text, payload.participants, payload.duration, payload.transcript_format)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    meeting.transcript_segments = [models.TranscriptSegment(**row) for row in rows]
    existing = {p.name.casefold() for p in meeting.participants}
    for row in rows:
        if row["speaker"].casefold() not in existing:
            meeting.participants.append(models.Participant(name=row["speaker"]))
            existing.add(row["speaker"].casefold())
    meeting.summary = models.Summary(
        overview=payload.overview.strip() or (" ".join(row["text"] for row in rows[:3])[:1500] if rows else "No transcript provided. Add your meeting notes here."),
        notes="",
    )
    meeting.chapters = [models.Chapter(title="Conversation", start_time=0)]
    db.add(meeting)
    db.commit()
    return db.scalar(select(models.Meeting).options(*options()).where(models.Meeting.id == meeting.id))


@router.get("/{meeting_id}", response_model=schemas.MeetingDetailOut)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.scalar(select(models.Meeting).options(*options()).where(models.Meeting.id == meeting_id))
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting


@router.put("/{meeting_id}", response_model=schemas.MeetingDetailOut)
def update_meeting(meeting_id: int, payload: schemas.MeetingUpdate, db: Session = Depends(get_db)):
    meeting = db.scalar(select(models.Meeting).options(*options()).where(models.Meeting.id == meeting_id))
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    data = payload.model_dump(exclude_unset=True)
    participants = data.pop("participants", None)
    overview = data.pop("overview", None)
    notes = data.pop("notes", None)
    if "duration" in data and any(s.end_time > data["duration"] for s in meeting.transcript_segments):
        raise HTTPException(422, "Duration cannot end before the last transcript segment.")
    for key, value in data.items():
        setattr(meeting, key, value)
    if participants is not None:
        meeting.participants = [models.Participant(name=name.strip()) for name in participants if name.strip()]
    if overview is not None or notes is not None:
        meeting.summary = meeting.summary or models.Summary(overview="", notes="")
        if overview is not None:
            meeting.summary.overview = overview
        if notes is not None:
            meeting.summary.notes = notes
    db.commit()
    return db.scalar(select(models.Meeting).options(*options()).where(models.Meeting.id == meeting_id))


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.get(models.Meeting, meeting_id)
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    db.delete(meeting)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{meeting_id}/action-items", response_model=schemas.ActionItemOut, status_code=201)
def create_action_item(meeting_id: int, payload: schemas.ActionItemCreate, db: Session = Depends(get_db)):
    if not db.get(models.Meeting, meeting_id):
        raise HTTPException(404, "Meeting not found")
    item = models.ActionItem(meeting_id=meeting_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{meeting_id}/action-items/{item_id}", response_model=schemas.ActionItemOut)
def update_action_item(meeting_id: int, item_id: int, payload: schemas.ActionItemUpdate, db: Session = Depends(get_db)):
    item = db.scalar(select(models.ActionItem).where(models.ActionItem.id == item_id, models.ActionItem.meeting_id == meeting_id))
    if not item:
        raise HTTPException(404, "Action item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{meeting_id}/action-items/{item_id}", status_code=204)
def delete_action_item(meeting_id: int, item_id: int, db: Session = Depends(get_db)):
    item = db.scalar(select(models.ActionItem).where(models.ActionItem.id == item_id, models.ActionItem.meeting_id == meeting_id))
    if not item:
        raise HTTPException(404, "Action item not found")
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@router.get("/{meeting_id}/export")
def export_meeting(meeting_id: int, format: Literal["txt", "md"] = "md", content: Literal["all", "transcript", "summary"] = "all", db: Session = Depends(get_db)):
    meeting = get_meeting(meeting_id, db)
    lines = [("# " if format == "md" else "") + meeting.title, str(meeting.meeting_date), "Participants: " + ", ".join(p.name for p in meeting.participants), ""]
    if content in ("all", "summary"):
        lines += ["## Summary" if format == "md" else "SUMMARY", meeting.summary.overview if meeting.summary else "", meeting.summary.notes if meeting.summary else "", "", "Action items"]
        lines += [f"- [{'x' if a.completed else ' '}] {a.text}" + (f" ({a.assignee})" if a.assignee else "") for a in meeting.action_items]
    if content in ("all", "transcript"):
        lines += ["", "## Transcript" if format == "md" else "TRANSCRIPT"]
        lines += [f"[{int(s.start_time)//60:02}:{int(s.start_time)%60:02}] {s.speaker}: {s.text}" for s in meeting.transcript_segments]
    filename = quote(f"meetly-{meeting_id}.{format}")
    return Response("\n".join(lines), media_type="text/markdown" if format == "md" else "text/plain", headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"})

