# Roommate Matching & Room Allocation Workflow

## Overview
This document describes the complete workflow for roommate matching and room allocation in the student housing management system. The system uses a multi-stage onboarding process with AI-based matching capabilities.

---

## Workflow Stages

### Stage 1: Initial Login (Pending Status)

**Student State:**
- `onboardingStatus`: `pending`
- `room`: `null`
- `temporaryRoom`: `null`
- `roomAllocationStatus`: `none`

**What Happens:**
1. New student logs into the dashboard for the first time
2. System detects no room allocation
3. **Onboarding Popup** is displayed with two options:
   - 🤖 **Find AI-Based Roommate Matches** → Navigate to "My Room" → "AI Matching" tab
   - 👥 **Choose Room Manually** → Navigate to "My Room" → "Room Selection" tab

**UI Behavior:**
- Dashboard shows limited functionality
- Room details are hidden
- Only matching and room selection interfaces are accessible

---

### Stage 2: Setting Preferences (Matching Status)

**Student State:**
- `onboardingStatus`: `pending` → `matching` (when preferences are set)
- `aiPreferences`: Set by student
- `room`: `null`
- `temporaryRoom`: `null`

**What Happens:**
1. Student clicks "Find AI-Based Roommate Matches"
2. Student is taken to "My Room" → "AI Matching Preferences" tab
3. Student fills out AI matching preferences:
   - **Sleep Schedule**: Early bird, Night owl, Flexible
   - **Cleanliness**: Scale 1-10
   - **Study Habits**: Quiet, Music, Flexible
   - **Noise Tolerance**: Scale 1-10
   - **Lifestyle**: Introvert, Ambivert, Extrovert
4. Preferences are saved via `PUT /api/student/roommates/ai-preferences`
5. `onboardingStatus` may update to `matching` (optional, can stay `pending`)

**API Endpoints Used:**
- `PUT /api/student/roommates/ai-preferences` - Save preferences
- `GET /api/student/roommates/ai-matches?minScore=50` - Get matches (after preferences set)

---

### Stage 3: Finding Roommates

#### Option A: AI-Based Matching

**What Happens:**
1. Student clicks "Find AI Matches" button
2. System calls `GET /api/student/roommates/ai-matches?minScore=50`
3. **Matching Algorithm:**
   - Finds all students of same gender without rooms
   - Excludes students with `temporaryRoom` (already selected a room)
   - Uses K-Means clustering and cosine similarity (Python AI service) or JavaScript fallback
   - Calculates compatibility scores (50-100% range)
   - Returns matches sorted by compatibility score

4. **Results Displayed:**
   - Individual matches with compatibility scores (50-100%)
   - AI-matched groups (for double/triple rooms)
   - Each match shows: Name, Student ID, Course, Year, Compatibility Score

5. **Student Actions:**
   - Can view individual matches
   - Can view pre-formed groups
   - Can select roommates from matches
   - Can proceed to room selection with selected roommates

**Compatibility Score Ranges:**
- **50-79%**: Warning (yellow chip) - Lower compatibility
- **80-100%**: Success (green chip) - High compatibility

**API Endpoints:**
- `GET /api/student/roommates/ai-matches?minScore=50&limit=10` - Individual matches
- `GET /api/student/rooms/ai-matched-groups?roomType=Double&minScore=50` - Pre-formed groups

#### Option B: Manual Selection

**What Happens:**
1. Student clicks "Choose Room Manually"
2. Student navigates to "My Room" → "Room Selection" tab
3. Student can:
   - Browse available rooms
   - Select roommates manually (if they know them)
   - Request specific roommates (if mutual consent required)

**API Endpoints:**
- `GET /api/student/rooms/available` - List available rooms
- `GET /api/student/roommates/available` - List available students for manual selection
- `POST /api/student/roommates/request` - Send roommate request

---

### Stage 4: Room Selection (Room Selected Status)

**Student State:**
- `onboardingStatus`: `room_selected`
- `temporaryRoom`: `[roomId]` (temporarily allocated)
- `room`: `null` (not confirmed yet)
- `roomAllocationStatus`: `pending_payment`

**What Happens:**
1. Student selects a room (with or without roommates)
2. System validates:
   - Room is available or reserved
   - Room capacity matches group size
   - All roommates are same gender
   - Roommates don't already have rooms
   - Room is not under maintenance

3. **Two-Stage Allocation:**
   - **Temporary Allocation**: Room is assigned to `temporaryRoom` field
   - **Room Status**: Changed to `reserved` (not `occupied` yet)
   - **Room Occupancy**: Not updated yet (waits for payment)

4. **Fee Generation:**
   - System automatically generates room fee based on:
     - Base room price (by room type)
     - Amenities price (AC, WiFi, etc.)
   - Fee status: `pending`
   - Fee type: `rent`

5. **Notification:**
   - Student receives notification: "Room allocated. Payment required to confirm."

**API Endpoints:**
- `POST /api/student/rooms/select` - Direct room selection (single student)
- `POST /api/student/rooms/select-with-roommates` - Select room with roommates

**Room Selection with Roommates:**
- All selected roommates get `temporaryRoom` assigned
- All roommates' `onboardingStatus` → `room_selected`
- All roommates' `roomAllocationStatus` → `pending_payment`
- Fees generated for all roommates

---

### Stage 5: Payment (Pending Payment Status)

**Student State:**
- `onboardingStatus`: `room_selected`
- `temporaryRoom`: `[roomId]`
- `room`: `null`
- `roomAllocationStatus`: `pending_payment`

**What Happens:**
1. After room selection, **Payment Modal** automatically appears
2. Student views:
   - Room details
   - Fee breakdown (base price + amenities)
   - Total amount due
3. Student makes payment:
   - Payment method: UPI, Card, Bank Transfer, Cash
   - Transaction ID (if applicable)
   - Notes (optional)
4. Payment is processed via `POST /api/student/payments`

**API Endpoints:**
- `GET /api/student/fees` - Get pending fees
- `POST /api/student/payments` - Make payment

---

### Stage 6: Room Confirmation (Confirmed Status)

**Student State:**
- `onboardingStatus`: `confirmed`
- `temporaryRoom`: `null` (cleared)
- `room`: `[roomId]` (confirmed)
- `roomAllocationStatus`: `confirmed`
- `roomConfirmedAt`: `[timestamp]`

**What Happens:**
1. Upon successful rent payment:
   - `temporaryRoom` → `room` (permanent allocation)
   - `temporaryRoom` set to `null`
   - `roomAllocationStatus` → `confirmed`
   - `onboardingStatus` → `confirmed`
   - `roomConfirmedAt` → current timestamp

2. **Room Updates:**
   - Room `currentOccupancy` incremented
   - Student added to room `occupants` array
   - If room is full: `status` → `occupied`
   - If room not full: `status` → `reserved` or `available`

3. **Notification:**
   - Student receives: "Room allocation confirmed for [Room Number]"

4. **Access Granted:**
   - Student can now access all room-related features:
     - View room details
     - Submit complaints
     - Request outings
     - View attendance
     - Access all dashboard features

**API Endpoints:**
- `POST /api/student/payments` - Payment confirmation triggers room confirmation
- `GET /api/student/room` - View confirmed room details (requires room allocation)

---

## Status Flow Diagram

```
┌─────────────────┐
│   PENDING       │  ← New student, no room
│   (Initial)     │
└────────┬────────┘
         │
         ├─→ Set Preferences → ┌──────────────┐
         │                     │  MATCHING   │  ← Preferences set, looking for matches
         │                     └──────┬──────┘
         │                            │
         │                            ├─→ Find Matches (AI or Manual)
         │                            │
         │                            ↓
         │                     ┌──────────────┐
         │                     │ ROOM_SELECTED│  ← Room selected, payment pending
         │                     └──────┬──────┘
         │                            │
         │                            ├─→ Make Payment
         │                            │
         │                            ↓
         │                     ┌──────────────┐
         │                     │  CONFIRMED   │  ← Payment complete, room confirmed
         │                     └──────────────┘
         │
         └─→ Manual Room Selection → ┌──────────────┐
                                      │ ROOM_SELECTED│
                                      └──────┬──────┘
                                             │
                                             └─→ Make Payment → CONFIRMED
```

---

## Key Data Fields

### Student Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `onboardingStatus` | String | `pending`, `matching`, `room_selected`, `confirmed` |
| `roomAllocationStatus` | String | `none`, `pending_payment`, `confirmed` |
| `room` | ObjectId | Confirmed room (after payment) |
| `temporaryRoom` | ObjectId | Temporarily allocated room (before payment) |
| `aiPreferences` | Object | AI matching preferences |
| `roomAllocatedAt` | Date | When room was temporarily allocated |
| `roomConfirmedAt` | Date | When room was confirmed after payment |

### Room Model Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | String | `available`, `reserved`, `occupied`, `maintenance` |
| `currentOccupancy` | Number | Current number of occupants |
| `capacity` | Number | Maximum capacity |
| `occupants` | Array | Array of student IDs |

---

## API Route Access Control

### Routes Available WITHOUT Room Allocation
- `GET /api/student/profile`
- `PUT /api/student/profile`
- `GET /api/student/rooms/available`
- `POST /api/student/rooms/select`
- `POST /api/student/rooms/select-with-roommates`
- `GET /api/student/roommates/ai-matches`
- `PUT /api/student/roommates/ai-preferences`
- `GET /api/student/rooms/ai-matched-groups`
- `GET /api/student/fees`
- `POST /api/student/payments`
- `GET /api/student/notifications`

### Routes Requiring Room Allocation
- `GET /api/student/room` - View room details
- `GET /api/student/attendance`
- `POST /api/student/complaints`
- `POST /api/student/outing-requests`
- All other room-related features

---

## AI Matching Algorithm

### Compatibility Score Calculation

**Factors Considered:**
1. **Sleep Schedule**: Early vs Late vs Flexible
2. **Cleanliness**: Scale 1-10 (closer values = higher score)
3. **Study Habits**: Quiet vs Music vs Flexible
4. **Noise Tolerance**: Scale 1-10 (closer values = higher score)
5. **Lifestyle**: Introvert vs Ambivert vs Extrovert

**Score Range:** 50-100%
- **50-79%**: Acceptable match (warning)
- **80-100%**: Excellent match (success)

**Matching Methods:**
1. **Python AI Service** (Primary):
   - K-Means clustering
   - Cosine similarity
   - Port: 5001

2. **JavaScript Fallback**:
   - Direct compatibility calculation
   - Used if AI service unavailable

---

## Error Handling

### Common Scenarios

1. **No Matches Found:**
   - Possible reasons displayed to student
   - Suggestion to adjust preferences
   - Option to try manual selection

2. **Room Selection Failed:**
   - Validation errors (capacity, gender, maintenance)
   - Clear error messages

3. **Payment Failed:**
   - Room remains in `temporaryRoom`
   - Student can retry payment
   - Room reserved until payment or timeout

4. **Roommate Already Has Room:**
   - Validation prevents selection
   - Error message displayed

---

## Notifications

### Notification Types

1. **Room Allocation - Payment Required**
   - Triggered: After room selection
   - Message: "Room [Room Number] allocated. Payment required."

2. **Room Allocation Confirmed**
   - Triggered: After successful payment
   - Message: "Room allocation confirmed for [Room Number]."

3. **Roommate Request**
   - Triggered: When student receives roommate request
   - Message: "[Student Name] wants to be your roommate."

---

## Best Practices

1. **Always validate** room capacity before allocation
2. **Reserve rooms** temporarily until payment confirmation
3. **Clear temporaryRoom** after payment to prevent conflicts
4. **Update onboardingStatus** at each stage for tracking
5. **Generate fees automatically** after room selection
6. **Send notifications** at key milestones
7. **Filter matches** to 50-100% compatibility range
8. **Exclude students with temporaryRoom** from matching candidates

---

## Testing Checklist

- [ ] New student sees onboarding popup
- [ ] Preferences can be saved
- [ ] AI matches are returned (50-100% range)
- [ ] Room selection works with/without roommates
- [ ] Temporary room allocation works
- [ ] Payment modal appears after selection
- [ ] Payment confirms room allocation
- [ ] Room occupancy updates correctly
- [ ] Notifications are sent
- [ ] Access control works (routes with/without room)
- [ ] Manual selection works
- [ ] Group matching works
- [ ] Error handling works

---

## Future Enhancements

1. Room selection timeout (auto-release if payment not made)
2. Roommate request approval workflow
3. Room change request after confirmation
4. Matching history tracking
5. Preference learning from past matches
6. Batch room allocation for groups

