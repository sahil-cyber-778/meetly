import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

import models, schemas
from database import get_db


router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def options():
    return (
        selectinload(models.Meeting.participants),
        selectinload(models.Meeting.transcript_segments),
        selectinload(models.Meeting.summary),
        selectinload(models.Meeting.action_items),
        selectinload(models.Meeting.chapters),
    )


def parse_transcript(text: str, participants: list[str], duration: int):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    speakers = participants or ["Speaker 1", "Speaker 2"]
    if not lines:
        lines = ["Welcome to the meeting. Add a transcript to capture the conversation."]
    step = max(15, duration / len(lines))
    segments = []
    pattern = re.compile(r"^(?:\[(\d{1,2}):(\d{2})\]\s*)?([^:]{1,40}):\s*(.+)$")
    for index, line in enumerate(lines):
        match = pattern.match(line)
        if match:
            minute, second, speaker, body = match.groups()
            start = int(minute) * 60 + int(second) if minute else index * step
        else:
            start, speaker, body = index * step, speakers[index % len(speakers)], line
        segments.append(models.TranscriptSegment(speaker=speaker.strip(), start_time=float(start), end_time=min(float(start + step), float(duration)), text=body.strip()))
    return segments


@router.get("", response_model=list[schemas.MeetingListOut])
def list_meetings(
    search: str = "",
    date_from: date | None = None,
    date_to: date | None = None,
    sort: str = Query("newest", pattern="^(newest|oldest)$"),
    db: Session = Depends(get_db),
):
    stmt = select(models.Meeting).options(*options())
    if search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.join(models.Participant, isouter=True).where(
            or_(models.Meeting.title.ilike(term), models.Participant.name.ilike(term))
        ).distinct()
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
    meeting.transcript_segments = parse_transcript(payload.transcript_text, payload.participants, payload.duration)
    meeting.summary = models.Summary(
        overview=payload.overview.strip() or "This meeting is ready for review. Add notes as decisions are confirmed.",
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

