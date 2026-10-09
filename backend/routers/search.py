from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from database import get_db
from models import Meeting, Participant, TranscriptSegment

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def search(q: str = Query(min_length=1, max_length=200), db: Session = Depends(get_db)):
    term = q.strip()
    if not term:
        return []
    results = []
    meetings = db.scalars(select(Meeting).where(or_(Meeting.title.icontains(term, autoescape=True), Meeting.participants.any(Participant.name.icontains(term, autoescape=True)))).order_by(Meeting.meeting_date.desc()).limit(30)).all()
    for m in meetings:
        results.append({"meeting_id": m.id, "title": m.title, "kind": "meeting", "text": ", ".join(p.name for p in m.participants), "start_time": None, "segment_id": None})
    segments = db.execute(select(TranscriptSegment, Meeting).join(Meeting).where(TranscriptSegment.text.icontains(term, autoescape=True)).order_by(Meeting.meeting_date.desc(), TranscriptSegment.start_time).limit(70)).all()
    for s, m in segments:
        results.append({"meeting_id": m.id, "title": m.title, "kind": "transcript", "text": s.text, "start_time": s.start_time, "segment_id": s.id})
    return results
