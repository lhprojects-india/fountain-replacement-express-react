# Week 7 — Day 4: Questionnaire / MOQ System

## Context

Onboarding calls are tracked and transitions to the questionnaire stage. Now we build the assessment system where drivers answer questions based on their onboarding training.

**Previous day**: Onboarding call tracking — scheduling, completion, call notes, transition to questionnaire.

**What we're building today**: Questionnaire builder (admin), questionnaire taking (driver), and automatic scoring.

## Today's Focus

1. Questionnaire builder API (admin)
2. Admin UI for creating questionnaires
3. Driver questionnaire page
4. Auto-scoring and pass/fail determination
5. Transition based on results

## Detailed Changes

### Backend

#### 1. `apps/backend/src/modules/questionnaire/questionnaire.service.js`

Admin functions:
```javascript
export async function createQuestionnaire(data, prisma) {
  // Create questionnaire + questions in a transaction
  // data: { title, description, cityId?, passingScore, questions: [...] }
}

export async function updateQuestionnaire(id, data, prisma) { ... }

export async function deleteQuestionnaire(id, prisma) {
  // Only if no responses reference it
}

export async function getQuestionnaire(id, prisma) {
  // Include questions, sorted by sortOrder
}

export async function getQuestionnaires(filters?, prisma) {
  // List all, optionally filter by city/active
}
```

Driver functions:
```javascript
export async function getQuestionnaireForApplication(applicationId, prisma) {
  // 1. Load application → job → city
  // 2. Find active questionnaire for that city
  // 3. Return questionnaire with questions (WITHOUT correct answers)
  // 4. Return existing response if already attempted
}

export async function submitQuestionnaireResponse(applicationId, questionnaireId, answers, prisma) {
  // 1. Validate application is in questionnaire stage
  // 2. Validate all required questions answered
  // 3. Score the response:
  //    - For each question, compare selected answer to correct answer
  //    - Sum points for correct answers
  //    - Calculate percentage: (earned / total) * 100
  // 4. Determine pass/fail based on questionnaire.passingScore
  // 5. Store QuestionnaireResponse
  // 6. Update application: moqScore, moqPassedAt (if passed)
  // 7. Transition to decision_pending via stage engine
  // 8. Return { score, passed, totalPoints, earnedPoints }
}
```

#### 2. Question structure

Each question in the `options` JSON:
```json
[
  { "label": "Option A text", "value": "a", "isCorrect": false },
  { "label": "Option B text", "value": "b", "isCorrect": true },
  { "label": "Option C text", "value": "c", "isCorrect": false },
  { "label": "Option D text", "value": "d", "isCorrect": false }
]
```

#### 3. Routes

Admin:
```
GET    /api/questionnaires              — list all
GET    /api/questionnaires/:id          — get with questions
POST   /api/questionnaires              — create with questions
PUT    /api/questionnaires/:id          — update
DELETE /api/questionnaires/:id          — delete
```

Driver:
```
GET    /api/driver/questionnaire         — get questionnaire for own application
POST   /api/driver/questionnaire/submit  — submit answers
GET    /api/driver/questionnaire/result  — get own result (after submission)
```

### Frontend (Admin Web)

#### 1. Add "Questionnaires" to Settings

Under Settings tab, add a questionnaire management section.

#### 2. `apps/admin-web/src/components/admin/QuestionnaireBuilder.jsx`

**Questionnaire list:**
- Table: Title, City, Questions count, Passing Score, Active, Actions

**Create/Edit form:**
```
┌─────────────────────────────────────────┐
│ Questionnaire Details                    │
│ Title: [_______________]                 │
│ City: [Dropdown]                       │
│ Passing Score: [70] %                    │
│ Active: [Toggle]                         │
├─────────────────────────────────────────┤
│ Questions                                │
│                                          │
│ Q1: [What is the cancellation fee?    ] │
│ Points: [1]                              │
│ ○ A: [£5 ]                              │
│ ○ B: [£10] ← Correct                    │
│ ○ C: [£15]                              │
│ ○ D: [£20]                              │
│ [Delete Question]                        │
│                                          │
│ Q2: [What should you do if...]          │
│ ...                                      │
│                                          │
│ [+ Add Question]                         │
├─────────────────────────────────────────┤
│ [Save Questionnaire]                     │
└─────────────────────────────────────────┘
```

Features:
- Drag-to-reorder questions
- Toggle correct answer per question
- Points per question (default 1)
- Preview mode (shows how driver will see it)
- Duplicate question action

#### 3. Questionnaire results in ApplicationDetailPanel

When application has a questionnaire response:
- Show: Score (e.g., "8/10 — 80%"), Passed/Failed badge
- Expandable: show each question, driver's answer, correct answer
- Highlight incorrect answers in red

### Frontend (Driver Web)

#### 1. New route: `/questionnaire`

```jsx
<Route path="/questionnaire" element={<ProtectedRoute><QuestionnaireGuard><QuestionnairePage /></QuestionnaireGuard></ProtectedRoute>} />
```

#### 2. `apps/driver-web/src/pages/QuestionnairePage.jsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Assessment                               │
│ Answer the following questions based     │
│ on your onboarding training.             │
│ Passing score: 70%                       │
├─────────────────────────────────────────┤
│ Question 1 of 10                         │
│                                          │
│ What is the standard cancellation fee?   │
│                                          │
│ ○ £5                                     │
│ ● £10                                    │
│ ○ £15                                    │
│ ○ £20                                    │
├─────────────────────────────────────────┤
│ [◀ Previous]  Progress: 3/10  [Next ▶]  │
├─────────────────────────────────────────┤
│ [Submit Assessment]                      │
│ (enabled when all questions answered)    │
└─────────────────────────────────────────┘
```

Features:
- One question at a time (or scrollable list — configure per preference)
- Radio buttons for each option
- Progress indicator
- Review before submit (summary of answers)
- Submit confirmation dialog
- Results page showing score + pass/fail
- Cannot retake (single attempt)

#### 3. Results page

After submission, show:
- Score: "You scored 8 out of 10 (80%)"
- Pass: "✅ You passed! Your application is now under final review."
- Fail: "Your score did not meet the passing threshold. Your application is under review."
- "Return to Dashboard" button

#### 4. Dashboard state for `questionnaire`

Action panel: "Complete your assessment" + "Take Assessment" button → `/questionnaire`

After completion: "Assessment complete. Final review in progress."

## Acceptance Criteria

- [ ] Admin can create questionnaires with multiple-choice questions
- [ ] Questions have correct answer marking and point values
- [ ] Driver sees questionnaire for their city
- [ ] Radio button selection works for each question
- [ ] All questions must be answered before submit
- [ ] Auto-scoring calculates correct percentage
- [ ] Pass/fail determined by passing score threshold
- [ ] Score stored on application (moqScore)
- [ ] Submission transitions to decision_pending
- [ ] Results shown to driver (score + pass/fail)
- [ ] Admin sees full question-by-question results
- [ ] Cannot retake questionnaire

## What's Next (Day 5)

Tomorrow we build the **decision engine** — the final approve/reject flow based on MOQ score and admin review, with the approved/rejected email notifications.
