from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

import models


MEETINGS = [
    {
        "title": "Q4 Product Strategy & Roadmap",
        "days": 1,
        "duration": 2780,
        "people": ["Maya Chen", "Alex Morgan", "Jordan Lee", "Priya Shah"],
        "overview": "The team aligned on a focused Q4 roadmap: improve activation, ship the collaborative workspace, and instrument the full onboarding funnel. The workspace beta will remain the quarter's north-star release.",
        "notes": "Success is defined as a 12% lift in activation and 40% weekly usage among beta accounts. Scope is locked on October 18.",
        "actions": [("Finalize workspace beta requirements", "Maya Chen"), ("Publish onboarding experiment brief", "Alex Morgan"), ("Validate analytics event coverage", "Priya Shah")],
        "chapters": [("Goals & context", 0), ("Roadmap priorities", 620), ("Risks and ownership", 1560), ("Next steps", 2320)],
        "lines": [
            (0, "Maya Chen", "Thanks everyone. Today I want us to leave with one Q4 narrative and clear ownership for every milestone."),
            (142, "Alex Morgan", "The onboarding data points to one clear issue: users reach the workspace, but they do not invite a teammate."),
            (371, "Priya Shah", "We can expose the invite moment earlier and measure it as part of the activation funnel."),
            (622, "Jordan Lee", "For the roadmap, I recommend we make the collaborative workspace the primary release and keep exports in maintenance mode."),
            (911, "Maya Chen", "Agreed. The outcome should be a fast first-session win, not a longer feature list."),
            (1210, "Alex Morgan", "Design can deliver the validated prototype by Friday, then engineering has two full sprints for beta."),
            (1564, "Priya Shah", "The main risk is event coverage. I will audit the funnel before the first experiment goes live."),
            (1945, "Jordan Lee", "I will own the dependency map and call out anything that threatens the October eighteenth scope lock."),
            (2324, "Maya Chen", "Great. We have three actions, a beta target, and measurable success criteria. Let's close there."),
        ],
    },
    {
        "title": "Customer Discovery — Northstar Labs",
        "days": 3,
        "duration": 2140,
        "people": ["Rina Patel", "Sam Wilson", "Elena Torres"],
        "overview": "Northstar Labs needs a faster way to turn research interviews into searchable evidence. Their buying decision depends on reliable speaker attribution and simple team sharing.",
        "notes": "Pilot group: 14 researchers. Security review can begin after the workflow demo.",
        "actions": [("Send pilot workspace proposal", "Rina Patel"), ("Share security documentation", "Sam Wilson")],
        "chapters": [("Current workflow", 0), ("Pain points", 510), ("Pilot proposal", 1390)],
        "lines": [(0,"Rina Patel","Could you walk us through what happens after a customer interview today?"),(184,"Elena Torres","A researcher cleans notes, adds tags in a spreadsheet, and posts the useful clips in chat."),(512,"Sam Wilson","Where does that process break most often?"),(693,"Elena Torres","Speaker attribution and discoverability. We repeat research because evidence gets buried."),(962,"Rina Patel","If every interview were searchable in one workspace, how would the team use it?"),(1205,"Elena Torres","Product managers could self-serve. Researchers would spend more time synthesizing instead of retrieving."),(1392,"Sam Wilson","We can run a fourteen-person pilot with SSO disabled while the security review starts."),(1782,"Elena Torres","That works. Please send the pilot scope and your data retention documentation.")],
    },
    {
        "title": "Weekly Growth Standup",
        "days": 5,
        "duration": 1680,
        "people": ["Noah Kim", "Aisha Grant", "Leo Martin"],
        "overview": "Activation improved after the checklist experiment. The team will expand the winning variant and investigate a mobile drop-off on the invite step.",
        "notes": "Variant B is now the control. Mobile invite completion is 9 points below desktop.",
        "actions": [("Roll out checklist variant B", "Aisha Grant"), ("Audit mobile invite friction", "Leo Martin")],
        "chapters": [("Metrics", 0), ("Experiments", 410), ("Blockers", 1110)],
        "lines": [(0,"Noah Kim","Let's start with the scorecard. Activation moved from thirty-eight to forty-three percent."),(201,"Aisha Grant","Most of that lift came from the three-step checklist, especially the sample meeting action."),(418,"Leo Martin","Paid conversion is flat, but the cohort needs another week to mature."),(637,"Noah Kim","Let's make variant B the control and test the invite copy next."),(889,"Aisha Grant","I can ship the rollout today and preserve a ten-percent holdout."),(1112,"Leo Martin","One blocker: invite completion on mobile trails desktop by nine points."),(1395,"Noah Kim","Please audit the tap targets and the keyboard flow before Thursday's review.")],
    },
    {
        "title": "Design Critique — Mobile Experience",
        "days": 9,
        "duration": 2460,
        "people": ["Alex Morgan", "Nina Brooks", "Owen Clark", "Maya Chen"],
        "overview": "The critique favored a calmer mobile hierarchy with the recording state always visible. Search moves into the transcript header and action items use a bottom sheet.",
        "notes": "Accessibility review is required before handoff. Preserve one-handed controls.",
        "actions": [("Revise mobile recording states", "Nina Brooks"), ("Run accessibility review", "Owen Clark")],
        "chapters": [("Prototype walkthrough", 0), ("Interaction feedback", 720), ("Decision recap", 1870)],
        "lines": [(0,"Nina Brooks","This prototype reduces the header and keeps the recording status pinned above the transcript."),(244,"Alex Morgan","The hierarchy is much calmer. I still lose the search action once I scroll."),(488,"Owen Clark","Search should live with the transcript because that is the object it affects."),(722,"Maya Chen","How does a user create an action item while listening with one hand?"),(951,"Nina Brooks","The current menu is too small. I propose a bottom sheet with the selected transcript sentence included."),(1267,"Owen Clark","Let's verify focus order and make every touch target at least forty-four pixels."),(1578,"Alex Morgan","The active speaker treatment is strong. Keep that motion subtle for reduced-motion settings."),(1872,"Maya Chen","Decision recap: pinned status, transcript search, bottom-sheet actions, then accessibility review.")],
    },
    {
        "title": "Engineering Sprint Planning",
        "days": 13,
        "duration": 3020,
        "people": ["Jordan Lee", "Priya Shah", "Diego Ramos", "Sofia Ivanova"],
        "overview": "The sprint prioritizes transcript performance, meeting CRUD reliability, and deployment automation. The team reserved capacity for API validation and end-to-end regression checks.",
        "notes": "Target velocity: 34 points. Database migration lands before API work begins.",
        "actions": [("Land transcript index migration", "Priya Shah"), ("Add CRUD regression suite", "Diego Ramos"), ("Document deployment runbook", "Sofia Ivanova")],
        "chapters": [("Capacity", 0), ("Story review", 530), ("Dependencies", 1740), ("Commitment", 2570)],
        "lines": [(0,"Jordan Lee","We have thirty-four points of capacity after accounting for support rotation."),(221,"Sofia Ivanova","Deployment automation is five points and removes three manual release steps."),(532,"Priya Shah","Transcript search needs an index migration before we change the API query."),(819,"Diego Ramos","I split meeting CRUD into validation and regression stories so each can ship independently."),(1170,"Jordan Lee","Keep the player synchronization work isolated from visual polish to reduce review risk."),(1488,"Sofia Ivanova","The preview environment will use the same CORS configuration as production."),(1744,"Priya Shah","My migration blocks the API story. I can land it on day one if review happens before noon."),(2162,"Diego Ramos","I will add create, edit, delete, and action-item persistence to the regression suite."),(2574,"Jordan Lee","We are committed at thirty-two points with two points reserved for production follow-up.")],
    },
]


def seed_database(db: Session):
    if db.scalar(select(func.count(models.Meeting.id))):
        return
    today = date.today()
    for entry in MEETINGS:
        meeting = models.Meeting(title=entry["title"], meeting_date=today - timedelta(days=entry["days"]), duration=entry["duration"])
        meeting.participants = [models.Participant(name=name) for name in entry["people"]]
        meeting.summary = models.Summary(overview=entry["overview"], notes=entry["notes"])
        meeting.action_items = [models.ActionItem(text=text, assignee=assignee) for text, assignee in entry["actions"]]
        meeting.chapters = [models.Chapter(title=title, start_time=start) for title, start in entry["chapters"]]
        lines = entry["lines"]
        meeting.transcript_segments = [
            models.TranscriptSegment(speaker=speaker, start_time=start, end_time=(lines[i + 1][0] if i + 1 < len(lines) else entry["duration"]), text=text)
            for i, (start, speaker, text) in enumerate(lines)
        ]
        db.add(meeting)
    db.commit()

