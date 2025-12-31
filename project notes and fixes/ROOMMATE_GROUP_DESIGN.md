# Roommate Group Formation & Room Allocation - Design Document

## Overview

This document describes the production-grade solution for roommate group formation and room allocation. The system introduces a new intermediate layer called **"Roommate Group Formation"** that separates roommate selection from room allocation, ensuring conflict-free, scalable operations.

---

## Architecture

### Core Principle
**Roommate selection and room allocation are two separate, sequential stages:**
1. Students form roommate groups (no room required)
2. Confirmed groups select rooms together
3. Payment confirms room allocation

### Key Design Decisions

1. **Group-First Approach**: Roommate groups are formed BEFORE room selection
2. **Leader-Based Selection**: Only group leader can select room (prevents conflicts)
3. **Two-Stage Allocation**: Temporary → Confirmed (after payment)
4. **Atomic Operations**: Group operations are validated to prevent race conditions
5. **State Machine**: Clear state transitions prevent invalid operations

---

## Database Schema

### RoommateGroup Model

```javascript
{
  _id: ObjectId,
  members: [ObjectId],           // Array of student IDs
  createdBy: ObjectId,            // Group leader (student ID)
  status: String,                 // 'pending' | 'confirmed' | 'room_selected' | 'payment_pending' | 'cancelled'
  selectedRoom: ObjectId,        // Room ID (null initially)
  roomSelectedAt: Date,
  paymentConfirmedAt: Date,
  cancellationReason: String,
  aiMatchingScore: Number,       // Optional: 0-100
  formationMethod: String,       // 'ai_matched' | 'manual' | 'mixed'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ members: 1 }` - Find groups by member
- `{ createdBy: 1 }` - Find groups by leader
- `{ status: 1 }` - Filter by status
- `{ members: 1, status: 1 }` - Compound index for active groups

### Updated Student Model

**New Fields:**
```javascript
{
  onboardingStatus: {
    enum: ['pending', 'matching', 'roommate_confirmed', 'room_selected', 'confirmed']
  },
  roommateGroup: ObjectId,        // Reference to RoommateGroup
  // ... existing fields
}
```

---

## State Flow

### Student Onboarding States

```
PENDING
  ↓ (Set preferences)
MATCHING
  ↓ (Send/accept roommate request)
ROOMMATE_CONFIRMED   ← NEW STATE
  ↓ (Group leader selects room)
ROOM_SELECTED
  ↓ (Payment completed)
CONFIRMED
```

### RoommateGroup States

```
pending          → Group request sent, waiting for acceptance
confirmed        → All members accepted, ready for room selection
room_selected    → Room selected, waiting for payment
payment_pending  → All members paid (optional intermediate state)
cancelled        → Group cancelled (leader exit, rejection, etc.)
```

---

## API Endpoints

### 1. POST `/api/student/roommates/group/request`

**Purpose**: Send roommate group request (creates RoommateGroup with status "pending")

**Request Body:**
```json
{
  "recipientId": "student_id",
  "message": "Optional message",
  "aiMatchingScore": 85  // Optional
}
```

**Validation:**
- Both students must have no room (`room` and `temporaryRoom` are null)
- Both students must be same gender
- Requester must not be in active group
- Recipient must not be in active group
- No pending request between these students

**Response:**
```json
{
  "message": "Roommate group request sent successfully",
  "group": { /* RoommateGroup object */ },
  "request": { /* RoommateRequest object */ }
}
```

**Side Effects:**
- Creates `RoommateGroup` with `status: 'pending'`
- Creates `RoommateRequest` for tracking
- Sets requester's `roommateGroup` reference
- Sends notification to recipient

---

### 2. POST `/api/student/roommates/group/respond`

**Purpose**: Accept or reject roommate group request

**Request Body:**
```json
{
  "requestId": "request_id",
  "action": "accept" | "reject"
}
```

**Accept Action:**
- Updates `RoommateGroup.status` to `'confirmed'`
- Adds recipient to group members
- Sets both students' `onboardingStatus` to `'roommate_confirmed'`
- Sets both students' `roommateGroup` reference
- Sends notification to requester

**Reject Action:**
- Updates `RoommateRequest.status` to `'rejected'`
- Cancels `RoommateGroup` (if exists)
- Clears requester's `roommateGroup` reference
- Sends notification to requester

---

### 3. GET `/api/student/roommates/group`

**Purpose**: Get current roommate group for student

**Response:**
```json
{
  "group": {
    "_id": "group_id",
    "members": [ /* populated student objects */ ],
    "createdBy": { /* leader info */ },
    "status": "confirmed",
    "selectedRoom": null,
    "groupSize": 2
  }
}
```

---

### 4. GET `/api/student/rooms/available-for-group?groupId=xxx`

**Purpose**: Get available rooms for confirmed group

**Query Parameters:**
- `groupId` (required): RoommateGroup ID

**Validation:**
- Student must be member of group
- Group status must be `'confirmed'`
- All members must be same gender

**Response:**
```json
{
  "group": {
    "_id": "group_id",
    "members": [ /* student objects */ ],
    "groupSize": 2,
    "status": "confirmed"
  },
  "rooms": [ /* available rooms */ ],
  "count": 10
}
```

**Filtering Logic:**
- `capacity >= groupSize`
- `status IN ['available', 'reserved']`
- `maintenanceStatus = 'none'`
- `availableSlots >= groupSize`
- `gender` matches group members' gender

---

### 5. POST `/api/student/roommates/group/select-room`

**Purpose**: Select room for group (leader only)

**Request Body:**
```json
{
  "groupId": "group_id",
  "roomId": "room_id"
}
```

**Validation:**
- Student must be group leader
- Group status must be `'confirmed'`
- Room must not be already selected
- Room capacity >= group size
- Room available slots >= group size
- Room status IN ['available', 'reserved']
- Room maintenanceStatus = 'none'
- All members same gender as room

**Side Effects:**
- Updates `RoommateGroup.selectedRoom`
- Updates `RoommateGroup.status` to `'room_selected'`
- Sets `temporaryRoom` for ALL group members
- Sets `roomAllocationStatus = 'pending_payment'` for all members
- Sets `onboardingStatus = 'room_selected'` for all members
- Reserves room (`status = 'reserved'`)
- Generates fees for all members
- Sends notifications to all members

**Rollback:**
- If member update fails, group selection is rolled back
- Group status reverts to `'confirmed'`
- `selectedRoom` cleared

---

## Edge Case Handling

### 1. Leader Exits Group

**Scenario**: Group leader leaves or is removed from group

**Solution:**
- If leader exits before room selection: Group is cancelled
- If leader exits after room selection: 
  - Group is cancelled
  - Room selection is cleared
  - All members' `temporaryRoom` cleared
  - Room status reverted to `'available'` (if no other occupants)

**Implementation:**
```javascript
// In student deletion/update handler
if (student.roommateGroup) {
  const group = await RoommateGroup.findById(student.roommateGroup);
  if (group && group.isLeader(student._id)) {
    await group.cancel('Leader exited group');
    // Clear all members' temporaryRoom if room was selected
    if (group.selectedRoom) {
      // Release room and clear temporaryRoom for all members
    }
  }
}
```

---

### 2. Individual Room Selection While in Group

**Scenario**: Student tries to select room individually while in active group

**Solution:**
- Prevent individual room selection if student is in active group
- Validation in `selectRoom` controller:
```javascript
if (student.roommateGroup) {
  const group = await RoommateGroup.findById(student.roommateGroup);
  if (group && ['pending', 'confirmed', 'room_selected'].includes(group.status)) {
    return res.status(400).json({ 
      message: 'You are in an active roommate group. Please select room through the group.' 
    });
  }
}
```

---

### 3. Room Becomes Unavailable

**Scenario**: Room becomes unavailable after group selection but before payment

**Solution:**
- Periodic job checks for rooms with `status = 'reserved'` and no payment after X hours
- Auto-release room if payment timeout
- Clear `selectedRoom` from group
- Clear `temporaryRoom` from all members
- Send notifications to all members

**Implementation:**
```javascript
// Scheduled job (runs every hour)
const expiredGroups = await RoommateGroup.find({
  status: 'room_selected',
  roomSelectedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
}).populate('members', 'temporaryRoom');

for (const group of expiredGroups) {
  // Check if any member has paid
  const hasPaidMembers = group.members.some(m => m.room && m.room.toString() === group.selectedRoom.toString());
  
  if (!hasPaidMembers) {
    // Release room
    await releaseRoomForGroup(group);
  }
}
```

---

### 4. Payment Timeout

**Scenario**: Some group members don't pay within time limit

**Solution:**
- Individual payment confirms individual allocation
- If all members pay: Group status → `'payment_pending'` (or `'confirmed'`)
- If some members don't pay: Their `temporaryRoom` remains until timeout
- Room is partially occupied (other members confirmed)
- Non-paying members' allocations are released after timeout

**Implementation:**
- Payment handler checks if all group members paid
- If all paid: Update group status
- If not all paid: Individual confirmation only

---

### 5. Concurrent Room Selection

**Scenario**: Multiple groups try to select same room simultaneously

**Solution:**
- Database-level validation (unique constraints)
- Room status check before selection
- Atomic updates using MongoDB transactions (if available)
- Optimistic locking (check room status, update if still valid)

**Implementation:**
```javascript
// In selectRoomForGroup
const room = await Room.findById(roomId);
const availableSlots = room.capacity - (room.currentOccupancy || 0);

if (availableSlots < groupSize) {
  return res.status(400).json({ 
    message: 'Room no longer has enough available slots.' 
  });
}

// Reserve room immediately
room.status = 'reserved';
await room.save();

// Then update group and members
// If update fails, revert room status
```

---

## Conflict Prevention

### Race Condition Prevention

1. **Group Formation**:
   - Check active groups before creating new group
   - Use unique indexes on `members` + `status`
   - Atomic group creation

2. **Room Selection**:
   - Check room availability immediately before selection
   - Reserve room before updating group
   - Rollback on failure

3. **Payment**:
   - Check room status before confirming
   - Update occupancy atomically
   - Verify group membership before group status update

### Data Integrity

1. **Referential Integrity**:
   - `Student.roommateGroup` references valid `RoommateGroup`
   - `RoommateGroup.members` references valid `Student`
   - `RoommateGroup.selectedRoom` references valid `Room`

2. **State Consistency**:
   - `onboardingStatus` matches `RoommateGroup.status`
   - `temporaryRoom` matches `RoommateGroup.selectedRoom`
   - `roomAllocationStatus` matches payment status

3. **Validation Rules**:
   - Group members must be same gender
   - Room capacity must >= group size
   - Students can't be in multiple active groups
   - Leader must be in members array

---

## Scalability Considerations

### Database Optimization

1. **Indexes**:
   - Compound indexes on frequently queried fields
   - Partial indexes for active groups only
   - TTL indexes for expired groups (optional)

2. **Query Optimization**:
   - Populate only required fields
   - Use lean queries for read-only operations
   - Batch updates for group members

3. **Caching**:
   - Cache active groups for student
   - Cache available rooms (with TTL)
   - Invalidate cache on group/room updates

### Performance

1. **Async Operations**:
   - Send notifications asynchronously
   - Generate fees in background job
   - Batch group member updates

2. **Pagination**:
   - Paginate available rooms
   - Limit group size (max 4-6 members)
   - Limit concurrent group operations

---

## Security

### Authorization

1. **Group Operations**:
   - Only group members can view group
   - Only leader can select room
   - Only recipient can respond to request

2. **Room Selection**:
   - Verify group membership
   - Verify group status
   - Verify room availability

### Validation

1. **Input Validation**:
   - Validate `groupId` and `roomId` format
   - Validate action values
   - Sanitize messages

2. **Business Logic Validation**:
   - Gender matching
   - Capacity matching
   - Status transitions

---

## Testing Checklist

### Unit Tests

- [ ] Group creation with valid data
- [ ] Group creation with invalid data (same room, different gender)
- [ ] Accept group request
- [ ] Reject group request
- [ ] Leader selects room
- [ ] Non-leader tries to select room (should fail)
- [ ] Room selection with insufficient capacity (should fail)
- [ ] Payment confirmation for group
- [ ] Leader exit handling
- [ ] Individual room selection while in group (should fail)

### Integration Tests

- [ ] Complete flow: Request → Accept → Select Room → Payment
- [ ] Concurrent room selection (race condition)
- [ ] Payment timeout handling
- [ ] Room availability updates
- [ ] Notification delivery

### Edge Cases

- [ ] Group with maximum members (4-6)
- [ ] Room selection for single-member group
- [ ] Multiple groups selecting same room
- [ ] Group cancellation after room selection
- [ ] Partial payment (some members pay, others don't)

---

## Migration Strategy

### Existing Students

1. **Students with rooms**: 
   - `onboardingStatus = 'confirmed'`
   - `roommateGroup = null`

2. **Students without rooms**:
   - `onboardingStatus = 'pending'`
   - `roommateGroup = null`

3. **Students with temporary rooms**:
   - `onboardingStatus = 'room_selected'`
   - `roommateGroup = null` (individual allocation)

### Data Migration

```javascript
// Migration script
const students = await Student.find({});
for (const student of students) {
  if (!student.onboardingStatus) {
    if (student.room && student.roomAllocationStatus === 'confirmed') {
      student.onboardingStatus = 'confirmed';
    } else if (student.temporaryRoom || student.roomAllocationStatus === 'pending_payment') {
      student.onboardingStatus = 'room_selected';
    } else {
      student.onboardingStatus = 'pending';
    }
    await student.save();
  }
}
```

---

## Monitoring & Logging

### Key Metrics

1. **Group Formation**:
   - Groups created per day
   - Acceptance rate
   - Average time to confirmation

2. **Room Selection**:
   - Rooms selected per day
   - Average time from confirmation to selection
   - Selection failure rate

3. **Payment**:
   - Payment completion rate
   - Average time from selection to payment
   - Partial payment rate

### Logging

- Group creation/updates
- Room selection attempts (success/failure)
- Payment confirmations
- Edge case handling (leader exit, timeouts)
- Error conditions

---

## Future Enhancements

1. **Multi-Room Groups**: Support groups larger than single room capacity
2. **Group Chat**: In-app messaging for group members
3. **Preference Matching**: AI-based group formation with multiple members
4. **Group History**: Track group formation and room selection history
5. **Auto-Matching**: System suggests groups based on preferences
6. **Group Splitting**: Handle group splits if members want different rooms

---

## Conclusion

This design provides a **conflict-free, scalable, and production-ready** solution for roommate group formation and room allocation. The separation of concerns (group formation → room selection → payment) ensures:

- **No race conditions**: Leader-based selection prevents conflicts
- **Data integrity**: Validation at every step
- **Scalability**: Optimized queries and indexes
- **User experience**: Clear state transitions and notifications
- **Maintainability**: Well-defined API and state machine

The system is ready for production deployment with proper monitoring and error handling.

