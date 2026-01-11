
# EcoQuest – Task Module

**Senior Engineer Implementation Specification**


## 1. What the Task Module IS (non-negotiable definition)

## **1. Task-Based Environment**

### *Primary Generator of Verified Environmental Action Data*

The Task-Based Environment is the core feature of EcoQuest. It this the real-world environmental actions are performed, verified, and converted into a well structured data.

### **What it does**

Users complete predefined environmental tasks such as area cleanups, recycling drives, or tree planting. Each completed task produces a time-stamped, geo-tagged action record that contributes to aggregate environmental insights. User gets points for task completion.

### **Why it exists**

Most environmental efforts today disappear after execution. This module ensures that actions leave behind verifiable, reusable data instead of remaining anecdotal or symbolic.

### **Key features**

#### **Task Catalog**

* Tasks are categorized (Waste, Water, Greenery, Energy, etc.), assumed to be provided by the authority, mock data is fine intially.
* Each task has clear evidence requirements and impact scope
* Tasks are created and managed by NGOs, colleges, or other organizations

#### **Scoring & EcoPoints**

* Each verified task awards EcoPoints
* Points are category-specific, enabling impact-based analysis rather than raw totals

#### **Verification Layer**

* Automated checks using ML/DL module, intially simulated.
* Manual verification by NGOs or institutional moderators for credibility. This is to ensure proper verification of the task which is done.
* Only verified tasks enter the aggregate dataset

#### **Leaderboards & Rankings**

Multiple leaderboard types to maintain participation density:

* Weekly leaderboards (short-term visibility)
* Category-specific leaderboards (domain-based impact)
* Group or campus leaderboards (peer-level comparison)

These are designed to prevent demotivation while sustaining consistent participation

#### **Badges & Streaks**

* Completion badges and daily eco-streaks act as retention mechanisms
* They encourage continuity, which is essential for meaningful data over time

### **System role**

Converts citizen effort into verified environmental action records that form the backbone of EcoQuest’s intelligence layer.

## 2. Core Responsibilities (what this module must do)

The Task Module must:

1. Store **task definitions** (what actions are allowed)
2. Allow users to **start and submit task attempts** listed in the user ui
4. Persist **raw submissions**
5. Trigger **verification pipeline**
6. Maintain **submission state**
7. Emit **verified task events** for scoring


---

## 3. Task Lifecycle (critical mental model)

Every task attempt follows this lifecycle:

```
TASK_DEFINED(listed in the user ui)
  ↓
TASK_ATTEMPT_CREATED
  ↓
EVIDENCE_SUBMITTED
  ↓
PENDING_VERIFICATION
  ↓
 ┌───────────────┬───────────────┐
 │               │               │
VERIFIED     MANUAL_REVIEW     REJECTED
  ↓            ↓              
SCORING_TRIGGERED
```


---

## 4. Data Model (MongoDB – REQUIRED SCHEMA)

### 4.1 `tasks` collection (Task Definitions)

This collection defines **what can be done**.

```js
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String, // waste, water, greenery, etc.
  basePoints: Number,

  expectedEvidence: {
    imageRequired: Boolean,
    locationRequired: Boolean,
    timeWindowMinutes: Number
  },

  verificationHints: {
    expectedObjects: [String], // e.g. ["trash", "plastic"]
    minConfidence: Number
  },

  constraints: {
    maxCompletionsPerUser: Number,
    cooldownHours: Number
  },

  scope: String, // local, city, global
  createdBy: ObjectId, // NGO/Admin(authorities)
  isActive: Boolean,
  createdAt: Date
}
```

**Why this matters**
This metadata is what makes verification task-aware instead of dumb.

---

### 4.2 `task_submissions` collection (User Attempts)

This is the **heart** of the module.

```js
{
  _id: ObjectId,
  taskId: ObjectId,
  userId: ObjectId,

  evidence: {
    imageUrls: [String],
    latitude: Number,
    longitude: Number,
    submittedAt: Date
  },

  status: String, 
  // "pending" | "verified" | "manual_review" | "rejected"

  verification: {
    aiConfidence: Number,
    fraudScore: Number,
    flags: [String],
    finalDecision: String, // approved/rejected/manual
    reviewedBy: ObjectId,
    reviewedAt: Date
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Rules**

* Never delete submissions
* Status changes must be logged and displayed in the ui
* Verification info lives *inside* submission for traceability

---

### 4.3 `task_events` collection (optional but recommended)

This enables clean decoupling.

```js
{
  _id: ObjectId,
  submissionId: ObjectId,
  eventType: String, // TASK_VERIFIED
  emittedAt: Date,
  payload: Object
}
```

Scoring service listens to these.

---

## 5. Backend APIs (Task Module endpoints)

### 5.1 Fetch Available Tasks

```
GET /tasks
```

**Behavior**

* Return only `isActive = true`
* Filter by scope and user eligibility

**Response**

```json
[
  {
    "id": "task_id",
    "title": "Neighborhood Cleanup",
    "category": "waste",
    "points": 100
  }
]
```

---

### 5.2 Start Task Attempt

```
POST /tasks/:taskId/start
```

**Purpose**

* Validate constraints (cooldown, limits)
* Create initial submission record

**Response**

```json
{
  "submissionId": "uuid",
  "status": "pending"
}
```

---

### 5.3 Submit Task Evidence

```
POST /tasks/:submissionId/submit
```

**Request**

```json
{
  "imageUrls": ["https://..."],
  "latitude": 29.38,
  "longitude": 79.46
}
```

**Backend logic**

* Attach evidence
* Update status → `pending_verification`
* Trigger verification pipeline

---

## 6. AI Integration (VERY IMPORTANT)

### 6.1 What the Task Module sends to AI

```json
{
  "submissionId": "uuid",
  "taskCategory": "waste",
  "expectedObjects": ["trash", "plastic"],
  "imageUrls": ["https://..."]
}
```

### 6.2 What AI returns (AI DOES NOT DECIDE)

```json
{
  "visualConfidence": 0.76,
  "fraudScore": 0.12,
  "flags": ["trash_detected"]
}
```

### 6.3 What Task Module does with AI output

* Store AI output
* Compute **composite verification score**
* Decide:

  * auto-verify
  * manual review
  * reject

This logic is **explicit and deterministic**, not ML.

---

## 7. Verification Decision Logic (must be coded explicitly)

Example logic:

```js
score =
  0.4 * aiConfidence +
  0.3 * userCredibility +
  0.2 * contextScore -
  0.1 * fraudScore;

if (score >= 0.7) status = "verified";
else if (score >= 0.4) status = "manual_review";
else status = "rejected";
```

These weights are config, not hardcoded.

---

## 8. After Verification (what happens next)

If status becomes `verified`:

1. Emit `TASK_VERIFIED` event
2. Scoring service updates user score
3. Leaderboard updates asynchronously

**Task module stops here.**

No scoring logic inside task module.

---

## 9. Edge Cases You MUST Handle

### Duplicate submissions

* Detect same image hash
* Route to manual review

### Offline / delayed submissions

* Check timestamp window
* Allow grace period

### Partial completion

* Lower confidence → manual review

### Task definition update

* Existing submissions reference old version


---

## 11. Folder Structure (MANDATORY)

```text
/backend
  /tasks
    task.model.js
    submission.model.js
    task.controller.js
    task.service.js
    task.routes.js
```



C. AI Services (Python – THIS IS IMPORTANT)

What must exist:
FastAPI app
One working endpoint: /verify-image

What it does:
Accepts image
Runs basic checks (OpenCV / hash)

Returns:
confidence score
flags
No autonomous decisions.
Backend decides approval.

Outcome:
Real Python service
Real AI-related logic
Clear separation of concerns

This satisfies:
AI usage rules
Decision-making restriction
Technical depth


D. Database
What must exist:
Schema file (mongodb)

At least these entities:
users
tasks
submissions
verification_results

Actual DB usage:
Mongodb


Outcome:
Data modeling is explicit
Easy to reason about scaling


Core Entities (High-level view)
At minimum, EcoQuest needs these tables:

Potential table required for other features, shown to demonstrate understanding of project features.
User
 ├── TaskSubmission
 │     └── VerificationResult
 ├── IssueReport
 │     └── VerificationResult
 ├── KnowledgeAttempt
 └── UserScore

*tables must be in mongodb, not postgres. Only implement those tables that are required for task-module feature, including any table that is common to all or overlaps with other features.

2️⃣ Tables (Detailed)
1. users
Stores basic user identity and credibility.
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT CHECK (role IN ('user', 'ngo', 'admin')) DEFAULT 'user',
    credibility_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


Why this matters:
credibility_score is fed by AI later
role allows NGO / authority views
UUID supports horizontal scaling


2. tasks
Defines what actions users can perform.

CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    points INTEGER NOT NULL,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


Notes:
Tasks are definitions, not actions
NGOs/admins create tasks
Categories support analytics


3. task_submissions
Each real-world action attempt.
CREATE TABLE task_submissions (
    id UUID PRIMARY KEY,
    task_id UUID REFERENCES tasks(id),
    user_id UUID REFERENCES users(id),
    image_url TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Critical:
This is where raw participation lives
Never delete rows; history matters


4. verification_results
AI + manual verification outputs.
CREATE TABLE verification_results (
    id UUID PRIMARY KEY,
    submission_id UUID REFERENCES task_submissions(id),
    ai_confidence FLOAT,
    fraud_score FLOAT,
    flags TEXT[],
    verified_by UUID REFERENCES users(id),
    final_status TEXT CHECK (final_status IN ('approved', 'rejected', 'manual_review')),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
This table is gold.

Why:
AI outputs are explicit
Humans can override
Auditable and explainable
Judges love this table.


5. issue_reports
Public reporting system.
CREATE TABLE issue_reports (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    category TEXT,
    description TEXT,
    image_url TEXT,
    latitude FLOAT,
    longitude FLOAT,
    status TEXT CHECK (status IN ('open', 'in_progress', 'resolved')) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


Notes:
Location is explicit
Status tracking supports governance use
Can be aggregated by area


6. knowledge_attempts
Tracks learning participation.
CREATE TABLE knowledge_attempts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    topic TEXT,
    score INTEGER,
    max_score INTEGER,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


Why this exists:
Feeds credibility scoring
Separates learning from action


7. user_scores
Precomputed scores for fast reads.
CREATE TABLE user_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    total_points INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    reports_submitted INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


Important:
Avoids recalculating leaderboards on the fly
Updated asynchronously


3️⃣ How AI fits into the schema (important for judges)

AI does not mutate core tables directly.

Flow:
task_submissions
 → AI Service
 → verification_results
 → backend updates status
 → user_scores updated


This separation proves:
no autonomous decisions
explainable AI
governance-safe design