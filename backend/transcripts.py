"""Validate and normalize pasted TXT, WebVTT and JSON into a single timeline."""
import html
import json
import math
import re

MAX_BYTES = 1_000_000


def seconds(value):
    if isinstance(value, bool):
        raise ValueError("A timestamp must be a number or HH:MM:SS string.")
    if isinstance(value, str) and ":" in value:
        parts = value.strip().replace(",", ".").split(":")
        if len(parts) not in (2, 3) or any(float(p) < 0 for p in parts):
            raise ValueError("Invalid timestamp.")
        if float(parts[-1]) >= 60 or (len(parts) == 3 and float(parts[-2]) >= 60):
            raise ValueError("Timestamp minutes/seconds must be below 60.")
        result = sum(float(p) * 60 ** i for i, p in enumerate(reversed(parts)))
    else:
        result = float(value)
    if not math.isfinite(result) or not 0 <= result < 43200:
        raise ValueError("Timestamps must be between 0 and 43200 seconds.")
    return result


def parse_transcript(text, participants, duration, format="txt"):
    if len(text.encode("utf-8")) > MAX_BYTES:
        raise ValueError("Transcript exceeds the 1 MB limit.")
    text = text.lstrip("\ufeff").strip()
    rows = []
    if not text:
        return []
    if format == "json":
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            raise ValueError("Invalid JSON transcript.") from exc
        if isinstance(data, dict):
            data = data.get("segments", data.get("transcript_segments"))
        if not isinstance(data, list):
            raise ValueError("JSON must be an array or an object with a segments array.")
        for row in data:
            if not isinstance(row, dict) or "start_time" not in row or "text" not in row:
                raise ValueError("Each JSON segment needs start_time and text.")
            rows.append(dict(row))
    elif format == "vtt":
        for block in re.split(r"\n\s*\n", text.replace("\r\n", "\n")):
            lines = block.splitlines()
            if not lines or lines[0].startswith(("WEBVTT", "NOTE", "STYLE", "REGION")):
                continue
            timing_index = next((i for i, line in enumerate(lines) if "-->" in line), None)
            if timing_index is None:
                raise ValueError("Each VTT cue must contain a start --> end timestamp.")
            start, end = lines[timing_index].split("-->", 1)
            body = " ".join(lines[timing_index + 1:])
            voice = re.search(r"<v(?:\.[^\s>]+)?\s+([^>]+)>", body)
            speaker = voice.group(1) if voice else "Speaker"
            body = html.unescape(re.sub(r"<[^>]+>", "", body))
            if not voice and re.match(r"^[^:]{1,100}:\s", body):
                speaker, body = body.split(":", 1)
            rows.append({"start_time": start.strip(), "end_time": end.strip().split()[0], "speaker": speaker, "text": body})
    elif format == "txt":
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        step = duration / len(lines)
        for i, line in enumerate(lines):
            stamp = re.match(r"^\[([^\]]+)\]\s*(.*)$", line)
            start, body = (seconds(stamp[1]), stamp[2]) if stamp else (i * step, line)
            speaker = participants[i % len(participants)] if participants else "Speaker"
            if ":" in body:
                candidate, remainder = body.split(":", 1)
                if len(candidate) <= 100:
                    speaker, body = candidate, remainder
            rows.append({"start_time": start, "speaker": speaker, "text": body})
    else:
        raise ValueError("Supported formats: txt, vtt and json.")
    if not rows or len(rows) > 10000:
        raise ValueError("Provide between 1 and 10000 transcript segments.")
    for row in rows:
        if not isinstance(row.get("text"), str) or not row["text"].strip():
            raise ValueError("Transcript segments cannot contain empty text.")
        if not isinstance(row.get("speaker", "Speaker"), str):
            raise ValueError("Speaker must be text.")
        row["speaker"] = row.get("speaker", "Speaker").strip() or "Speaker"
        if len(row["speaker"]) > 100:
            raise ValueError("Speaker names must be at most 100 characters.")
        row["text"] = row["text"].strip()
        try:
            row["start_time"] = seconds(row["start_time"])
            if row.get("end_time") is not None:
                row["end_time"] = seconds(row["end_time"])
        except (TypeError, ValueError) as exc:
            raise ValueError("Invalid transcript timestamp.") from exc
    rows.sort(key=lambda row: row["start_time"])
    for i, row in enumerate(rows):
        start = row["start_time"]
        next_start = rows[i + 1]["start_time"] if i + 1 < len(rows) else duration
        end = row.get("end_time", next_start)
        if not start < end <= next_start or end > duration:
            raise ValueError("Segments must have positive, non-overlapping times within the meeting duration.")
        row["end_time"] = end
    return [{key: row[key] for key in ("speaker", "text", "start_time", "end_time")} for row in rows]
