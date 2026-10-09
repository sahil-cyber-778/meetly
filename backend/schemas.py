from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class ParticipantOut(ORMModel):
    id: int
    name: str
    email: str | None = None


class TranscriptSegmentOut(ORMModel):
    id: int
    speaker: str
    start_time: float
    end_time: float
    text: str


class SummaryOut(ORMModel):
    id: int
    overview: str
    notes: str


class ActionItemOut(ORMModel):
    id: int
    meeting_id: int
    text: str
    assignee: str | None
    completed: bool


class ChapterOut(ORMModel):
    id: int
    title: str
    start_time: float


class MeetingBase(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    meeting_date: date
    duration: int = Field(default=1800, ge=60, le=43200)


class MeetingCreate(MeetingBase):
    participants: list[str] = Field(default_factory=list)
    transcript_text: str = ""
    overview: str = ""

    @field_validator("participants")
    @classmethod
    def clean_participants(cls, value: list[str]) -> list[str]:
        return [name.strip() for name in value if name.strip()]


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    meeting_date: date | None = None
    duration: int | None = Field(default=None, ge=60, le=43200)
    participants: list[str] | None = None
    overview: str | None = None
    notes: str | None = None


class MeetingListOut(ORMModel):
    id: int
    title: str
    meeting_date: date
    duration: int
    created_at: datetime
    participants: list[ParticipantOut]
    action_items: list[ActionItemOut]


class MeetingDetailOut(MeetingListOut):
    transcript_segments: list[TranscriptSegmentOut]
    summary: SummaryOut | None
    chapters: list[ChapterOut]


class ActionItemCreate(BaseModel):
    text: str = Field(min_length=2, max_length=500)
    assignee: str | None = Field(default=None, max_length=100)


class ActionItemUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=2, max_length=500)
    assignee: str | None = Field(default=None, max_length=100)
    completed: bool | None = None

