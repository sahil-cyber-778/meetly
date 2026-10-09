from datetime import date, datetime

from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class InputModel(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    @model_validator(mode="before")
    @classmethod
    def reject_nulls(cls, data):
        if isinstance(data, dict) and any(v is None and k != "assignee" for k, v in data.items()):
            raise ValueError("Omit unchanged fields instead of sending null.")
        return data


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


class MeetingBase(InputModel):
    title: str = Field(min_length=2, max_length=200)
    meeting_date: date
    duration: int = Field(default=1800, ge=60, le=43200)


class MeetingCreate(MeetingBase):
    participants: list[Name] = Field(default_factory=list, max_length=100)
    transcript_text: str = Field(default="", max_length=1_000_000)
    transcript_format: Literal["txt", "vtt", "json"] = "txt"
    overview: str = Field(default="", max_length=20000)

    @field_validator("participants")
    @classmethod
    def clean_participants(cls, value: list[str]) -> list[str]:
        return [name.strip() for name in value if name.strip()]


class MeetingUpdate(InputModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    meeting_date: date | None = None
    duration: int | None = Field(default=None, ge=60, le=43200)
    participants: list[Name] | None = Field(default=None, max_length=100)
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


class ActionItemCreate(InputModel):
    text: str = Field(min_length=2, max_length=500)
    assignee: str | None = Field(default=None, max_length=100)


class ActionItemUpdate(InputModel):
    text: str | None = Field(default=None, min_length=2, max_length=500)
    assignee: str | None = Field(default=None, max_length=100)
    completed: bool | None = None

