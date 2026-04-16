# Week 8 — Day 1: First Block Assignment & Tracking

## Context

The decision engine is complete. Approved drivers now need their first block assigned and tracked. If the first block fails, the application is rejected.

**Previous day (Week 7, Day 5)**: Decision engine — decision summary, approve/reject, auto-recommendation, final emails.

**What we're building today**: First block assignment, scheduling, result tracking (pass/fail), and the final transition to `active` or `first_block_failed`.

## Today's Focus

1. First block assignment API
2. Block result recording
3. Pass → active transition
4. Fail → rejection flow
5. Admin and driver UIs

## Detailed Changes

### Backend

#### 1. First block service

`apps/backend/src/modules/applications/first-block.service.js`:

```javascript
export async function assignFirstBlock(applicationId, blockDate, adminEmail, metadata, prisma) {
  // 1. Validate application is in approved stage
  // 2. Update: firstBlockDate = blockDate
  // 3. Transition to first_block_assigned via stage engine
  // 4. Dispatch notification: "Your first block is on {date}"
}

export async function recordBlockResult(applicationId, result, adminEmail, notes, prisma) {
  // result: 'passed' | 'failed'
  // 1. Validate application is in first_block_assigned
  // 2. Update: firstBlockResult = result
  // 3. If passed: transition to active
  //    - Dispatch 'stage.active' notification (welcome to the team!)
  // 4. If failed: transition to first_block_failed
  //    - Then auto-transition to rejected (with reason 'failed_first_block')
  //    - Dispatch rejection notification
}

export async function rescheduleBlock(applicationId, newDate, adminEmail, reason, prisma) {
  // Update firstBlockDate, notify driver
}

export async function getBlockQueue(filters, prisma) {
  // List applications with first_block_assigned stage
  // Sorted by firstBlockDate
  // Group: upcoming, today, past (needs result)
}
```

#### 2. Routes

```
POST /api/applications/:id/first-block/assign      — { date, metadata? }
POST /api/applications/:id/first-block/result       — { result: 'passed'|'failed', notes? }
POST /api/applications/:id/first-block/reschedule   — { date, reason }
GET  /api/applications/block-queue                  — list upcoming first blocks
```

### Frontend (Admin Web)

#### 1. Block queue view

Add "First Blocks" preset or sub-view:

**Table:**
| Applicant | City | Vehicle | Block Date | Status | Actions |
|-----------|------|---------|------------|--------|---------|
| John Smith | London | Van | Apr 15 | Upcoming | [Pass] [Fail] [Reschedule] |
| Jane Doe | Dublin | Car | Apr 12 | Past Due | [Pass] [Fail] |

**Color coding:**
- Upcoming (> 1 day): neutral
- Today: highlighted blue
- Past due (no result yet): warning yellow/red

**Actions:**
- Pass: Confirmation → marks passed → transitions to active
- Fail: Confirmation + reason → marks failed → transitions to rejected
- Reschedule: Date picker + reason

#### 2. In ApplicationDetailPanel

When in `first_block_assigned`:
- Show: "First block scheduled for {date}"
- Actions: Record Result (Pass/Fail), Reschedule

When in `active`:
- Show: "Driver is active since {date}" ✅
- First block date and result shown in history

### Frontend (Driver Web)

#### 1. Dashboard states

**first_block_assigned:**
- "Your first block is scheduled for **{date}**"
- "Please arrive at your assigned facility on time."
- Facility information if available
- Contact information

**active:**
- "🎉 Welcome to the Laundryheap driver team!"
- "You are now an active driver."
- Relevant next steps or links to driver resources

**first_block_failed → rejected:**
- "Unfortunately, your first block was not successful and we are unable to proceed."
- Contact information for questions

## Acceptance Criteria

- [ ] Admin can assign first block date
- [ ] Block assignment transitions to first_block_assigned
- [ ] Driver notified of block date
- [ ] Admin can record pass/fail result
- [ ] Pass transitions to active (terminal success state)
- [ ] Fail transitions to first_block_failed → rejected
- [ ] Block queue shows upcoming blocks sorted by date
- [ ] Overdue blocks highlighted
- [ ] Reschedule updates date and notifies driver
- [ ] Driver dashboard shows block information
- [ ] Active state displayed correctly

## What's Next (Day 2)

Tomorrow we focus on **final email templates** — crafting professional email content for every stage transition, ensuring proper branding, and adding the first block details email.
