# Room-Type Aware Matching System - Design Document

## Overview
This document outlines the production-grade workflow for room-type aware roommate matching, where students select their desired room type BEFORE AI matching, and the system adapts AI suggestions based on room capacity.

## Database Schema Updates

### Student Model
```javascript
{
  // ... existing fields ...
  selectedRoomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Quad'],
    default: null,
  },
  preferredRoommates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
}
```

### RoommateGroup Model
```javascript
{
  // ... existing fields ...
  roomType: {
    type: String,
    enum: ['Double', 'Triple', 'Quad'],
    required: true,
  },
}
```

## API Endpoints

### 1. Set Room Type
`POST /api/student/room-type`
- Sets student's selected room type
- Required before AI matching
- Single room bypasses roommate matching

### 2. Set Preferred Roommates
`POST /api/student/preferred-roommates`
- Sets preferred roommates (siblings, best friends)
- Validates: same gender, no room, not in active group

### 3. Get Room-Type Aware Matches
`GET /api/student/ai-matches?roomType=Double&minScore=50`
- Returns matches based on selected room type
- Prioritizes preferred roommates
- Fills remaining slots with AI matches

### 4. Get Room-Type Aware Groups
`GET /api/student/ai-matched-groups?roomType=Triple&minScore=50`
- Returns pre-formed groups matching room type
- Groups include preferred + AI matches

### 5. Create Roommate Group with Room Type
`POST /api/student/roommates/group/create`
- Creates group with room type
- Validates group size matches room capacity

## Matching Logic

### Room Capacity Mapping
- Single: 1 student (no matching)
- Double: 2 students (1 roommate needed)
- Triple: 3 students (2 roommates needed)
- Quad: 4 students (3 roommates needed)

### Matching Priority
1. **Preferred Roommates First**: Add all valid preferred roommates
2. **AI Matches Second**: Fill remaining slots with AI matches (50-100% compatibility)
3. **Validation**: Ensure total matches = required roommates

### Example Flows

#### Triple Room + 1 Sibling
1. Student selects Triple room
2. Student adds 1 sibling as preferred roommate
3. System finds 1 AI match (remaining slot)
4. Group formed: [Student, Sibling, AI Match]

#### Quad Room + 2 Friends
1. Student selects Quad room
2. Student adds 2 friends as preferred roommates
3. System finds 1 AI match (remaining slot)
4. Group formed: [Student, Friend1, Friend2, AI Match]

#### Single Room
1. Student selects Single room
2. No matching required
3. Student can directly select available single rooms

## UI Flow

### Step 1: Room Type Selection
Show room types with pricing:
- Single Room | Capacity: 1 | Base Price: ₹30,000
- Double Room | Capacity: 2 | Base Price: ₹24,000 per student
- Triple Room | Capacity: 3 | Base Price: ₹18,000 per student
- Quad Room | Capacity: 4 | Base Price: ₹15,000 per student

### Step 2: Preferred Roommates (Optional)
- Search and add preferred roommates
- Shows validation status (same gender, available)

### Step 3: AI Matching
- If Single: Skip to room selection
- If Shared: Show AI matches based on room type
- Display: "X preferred roommates + Y AI matches = Complete group"

### Step 4: Group Formation
- Review group members
- Send requests to selected roommates
- Wait for confirmations

### Step 5: Room Selection
- Only after group is confirmed
- Filter rooms by room type and capacity
- Leader selects room for group

### Step 6: Payment
- Generate fees based on room type + amenities
- All members pay
- Room confirmed after payment

## State Transitions

### Shared Room Flow
```
PENDING (no room type selected)
  ↓ [Select room type]
MATCHING (room type selected, finding roommates)
  ↓ [Preferred + AI matches selected, group created]
ROOMMATE_CONFIRMED (all members accepted)
  ↓ [Leader selects room]
ROOM_SELECTED (room temporarily allocated)
  ↓ [Payment completed]
CONFIRMED (room permanently allocated)
```

### Single Room Flow
```
PENDING (no room type selected)
  ↓ [Select Single room]
ROOM_SELECTION (bypass matching, select room directly)
  ↓ [Room selected]
ROOM_SELECTED (room temporarily allocated)
  ↓ [Payment completed]
CONFIRMED (room permanently allocated)
```

## Validation Rules

1. **Room Type Required**: Must select room type before matching
2. **Single Room Bypass**: Single room students skip matching
3. **Preferred Roommates**:
   - Must be same gender
   - Must not have room
   - Must not be in active group
4. **Group Size**: Must match room capacity exactly
5. **Room Selection**: Room type must match group room type
6. **Compatibility**: AI matches must be 50-100%

## Error Handling

- Invalid room type → 400 Bad Request
- Preferred roommate unavailable → 400 with details
- Insufficient AI matches → Suggest adjusting preferences
- Room type mismatch → 400 with room type details
- Group size mismatch → 400 with capacity details

## Implementation Priority

1. ✅ Update Student and RoommateGroup models
2. ✅ Create room-type aware matching utility
3. ⏳ Add room type selection endpoint
4. ⏳ Add preferred roommates endpoint
5. ⏳ Update AI matching endpoints
6. ⏳ Update UI for room type selection
7. ⏳ Update UI for preferred roommates
8. ⏳ Update group formation flow
9. ⏳ Add single room bypass logic
10. ⏳ Update room selection validation

