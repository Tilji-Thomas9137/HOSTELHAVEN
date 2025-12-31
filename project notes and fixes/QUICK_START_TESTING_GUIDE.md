# QUICK START TESTING GUIDE
## Production-Ready Payment Flow

This guide helps you quickly test the automatic payment modal feature.

---

## 🚀 SETUP

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../admin/vite
npm install
```

### 2. Environment Variables

Create `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/hostel_management
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

### 3. Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd admin/vite
npm run dev
```

---

## 👥 TEST SCENARIO: Triple Room Payment Flow

### Step 1: Create 3 Students

```bash
# Create Student A (Leader)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "email": "alice@test.com",
    "password": "password123",
    "role": "student",
    "phone": "1234567890",
    "studentId": "STU001",
    "gender": "Girls",
    "course": "Computer Science",
    "year": "2nd Year"
  }'

# Create Student B
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Beth",
    "email": "beth@test.com",
    "password": "password123",
    "role": "student",
    "phone": "1234567891",
    "studentId": "STU002",
    "gender": "Girls",
    "course": "Computer Science",
    "year": "2nd Year"
  }'

# Create Student C
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carol",
    "email": "carol@test.com",
    "password": "password123",
    "role": "student",
    "phone": "1234567892",
    "studentId": "STU003",
    "gender": "Girls",
    "course": "Computer Science",
    "year": "2nd Year"
  }'
```

**Expected:** 3 students created with `onboardingStatus: 'pending'`

---

### Step 2: Login as Alice (Leader)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123"
  }'
```

**Copy the token from response.**

---

### Step 3: Form Roommate Group

```bash
# As Alice, send roommate requests to Beth and Carol
curl -X POST http://localhost:5000/api/student/roommates/group/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ALICE_TOKEN" \
  -d '{
    "requestedStudentIds": ["BETH_ID", "CAROL_ID"],
    "roomType": "Triple"
  }'
```

**Expected:** Group created with `status: 'pending'`

---

### Step 4: Accept Requests (as Beth and Carol)

```bash
# Login as Beth
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "beth@test.com", "password": "password123"}'

# Accept group request
curl -X POST http://localhost:5000/api/student/roommates/group/respond \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BETH_TOKEN" \
  -d '{
    "groupId": "GROUP_ID",
    "response": "accept"
  }'

# Repeat for Carol
```

**Expected:** Group `status: 'confirmed'`

---

### Step 5: Select Room (as Alice - Leader)

```bash
# Get available rooms
curl -X GET http://localhost:5000/api/student/rooms/available-for-group \
  -H "Authorization: Bearer ALICE_TOKEN"

# Select a Triple room
curl -X POST http://localhost:5000/api/student/roommates/group/select-room \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -d '{
    "groupId": "GROUP_ID",
    "roomId": "ROOM_ID"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "paymentTriggered": true,
  "message": "Room selected successfully! Payment is now required from all group members.",
  "perStudentAmount": 25000,
  "roomDetails": {
    "roomNumber": "A-301",
    "roomType": "Triple",
    "basePrice": 25000,
    "totalPrice": 25000
  }
}
```

**Backend Changes:**
- Alice, Beth, Carol: `paymentStatus = 'PAYMENT_PENDING'`
- Alice, Beth, Carol: `onboardingStatus = 'payment_pending'`
- Alice, Beth, Carol: `temporaryRoom = ROOM_ID`
- Alice, Beth, Carol: `amountToPay = 25000`
- Room: `status = 'reserved'`
- 3 Fee records created (one per student, each ₹25,000)

---

### Step 6: Verify Payment Modal Triggers

#### Test 6A: Alice's Dashboard (Leader)

```bash
# Open browser: http://localhost:3000
# Login as alice@test.com
# Navigate to Dashboard
```

**Expected:**
1. Dashboard loads
2. `useEffect` calls `/student/payments/modal-status`
3. Backend returns `{ showModal: true, ... }`
4. Payment modal opens **AUTOMATICALLY** (NO CLICK NEEDED)
5. Modal shows:
   - Amount: ₹25,000
   - Room: A-301 (Triple)
   - "Pay Now" button

#### Test 6B: Beth's Dashboard

```bash
# Open incognito window
# Login as beth@test.com
# Navigate to Dashboard
```

**Expected:**
- Payment modal opens **AUTOMATICALLY**
- Shows same amount: ₹25,000
- Can complete payment independently

#### Test 6C: Carol's Dashboard

```bash
# Open another incognito window
# Login as carol@test.com
```

**Expected:**
- Payment modal opens **AUTOMATICALLY**

---

### Step 7: Complete Payments

#### Payment 1: Alice Pays

```bash
# Get fees
curl -X GET http://localhost:5000/api/student/fees \
  -H "Authorization: Bearer ALICE_TOKEN"

# Make payment
curl -X POST http://localhost:5000/api/student/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ALICE_TOKEN" \
  -d '{
    "feeId": "ALICE_FEE_ID",
    "amount": 25000,
    "paymentMethod": "upi",
    "transactionId": "TXN-ALICE-123"
  }'
```

**Expected:**
- Alice: `paymentStatus = 'PAID'`
- Alice: `room = ROOM_ID` (confirmed)
- Alice: `temporaryRoom = null`
- Alice receives notification: "✅ Payment confirmed. Waiting for 2 more member(s)"
- Room: `status = 'reserved'` (still waiting)
- Room: `currentOccupancy = 1`

#### Payment 2: Beth Pays

```bash
curl -X POST http://localhost:5000/api/student/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BETH_TOKEN" \
  -d '{
    "feeId": "BETH_FEE_ID",
    "amount": 25000,
    "paymentMethod": "upi",
    "transactionId": "TXN-BETH-456"
  }'
```

**Expected:**
- Beth: `paymentStatus = 'PAID'`
- Beth receives notification: "✅ Payment confirmed. Waiting for 1 more member(s)"
- Room: `status = 'reserved'` (still waiting)
- Room: `currentOccupancy = 2`

#### Payment 3: Carol Pays (LAST MEMBER)

```bash
curl -X POST http://localhost:5000/api/student/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CAROL_TOKEN" \
  -d '{
    "feeId": "CAROL_FEE_ID",
    "amount": 25000,
    "paymentMethod": "upi",
    "transactionId": "TXN-CAROL-789"
  }'
```

**Expected:**
- Carol: `paymentStatus = 'PAID'`
- Room: `status = 'occupied'` ✅ (ALL PAID)
- Room: `currentOccupancy = 3`
- Group: `status = 'confirmed'`
- **ALL 3 MEMBERS** receive notification: "🎉 Room Confirmed - All Payments Complete!"

---

### Step 8: Verify Final State

```bash
# Check room status
curl -X GET http://localhost:5000/api/admin/rooms/ROOM_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected:**

```json
{
  "roomNumber": "A-301",
  "roomType": "Triple",
  "capacity": 3,
  "currentOccupancy": 3,
  "status": "occupied",
  "occupants": ["ALICE_ID", "BETH_ID", "CAROL_ID"]
}
```

```bash
# Check each student
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer ALICE_TOKEN"
```

**Expected for each:**

```json
{
  "student": {
    "name": "Alice",
    "studentId": "STU001",
    "room": "ROOM_ID",
    "temporaryRoom": null,
    "paymentStatus": "PAID",
    "onboardingStatus": "confirmed",
    "roomAllocationStatus": "confirmed"
  }
}
```

---

## ✅ SUCCESS CRITERIA

### Payment Modal Auto-Opens If:

- [ ] Modal opens **without any click** after room selection
- [ ] Modal opens for **leader** immediately after selecting room
- [ ] Modal opens for **other members** when they login/refresh
- [ ] Modal shows **correct amount** (₹25,000 for Triple, not ₹8,333)
- [ ] Modal **persists** across page refreshes until payment complete
- [ ] Modal **does not reopen** after payment is completed

### Payment Flow Works If:

- [ ] Each student can pay independently
- [ ] Payment amount is **NOT split** (each pays ₹25,000)
- [ ] Room status changes: `available` → `reserved` → `occupied`
- [ ] Room confirms **only after ALL members pay**
- [ ] Correct notifications sent at each stage

### Database Integrity:

- [ ] 3 separate `Fee` records created (not 1 shared fee)
- [ ] Each `Fee.amount = 25000` (not divided)
- [ ] 3 separate `Payment` records after completion
- [ ] Total payments: 25000 + 25000 + 25000 = ₹75,000
- [ ] Room `currentOccupancy` increments correctly: 0 → 1 → 2 → 3

---

## 🐛 TROUBLESHOOTING

### Issue 1: Modal Doesn't Open

**Symptoms:**
- Leader selects room
- Redirects to dashboard
- Modal doesn't appear

**Debug Steps:**

```bash
# Check student status
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer TOKEN"

# Should show:
# paymentStatus: "PAYMENT_PENDING"
# onboardingStatus: "payment_pending"
```

```javascript
// Check frontend console
// Should see:
// "checkAndShowPaymentModal called"
// API Response: { showModal: true, ... }
```

**Fix:** Verify `StudentDashboard.jsx` has updated `useEffect` code.

---

### Issue 2: Amount is Split (Wrong)

**Symptoms:**
- Modal shows ₹8,333 instead of ₹25,000

**Debug:**

```bash
# Check fee amount
db.fees.find({ student: ObjectId("ALICE_ID") })

# Should show:
# { amount: 25000, not 8333 }
```

**Fix:** Verify `selectRoomForGroup` controller uses `perStudentAmount = room.totalPrice` (not divided).

---

### Issue 3: Room Confirms Before All Pay

**Symptoms:**
- Alice pays
- Room status = "occupied" (should be "reserved")

**Debug:**

```javascript
// In makePayment controller
const paidMembers = group.members.filter(m => m.paymentStatus === 'PAID').length;
console.log(`Paid: ${paidMembers} / ${totalMembers}`);

// Should wait until paidMembers === totalMembers
```

**Fix:** Verify `makePayment` checks ALL members paid before finalizing.

---

## 📊 MONITORING

### Real-Time Payment Status

```javascript
// MongoDB query to monitor payments
db.students.aggregate([
  {
    $match: {
      temporaryRoom: { $ne: null }
    }
  },
  {
    $lookup: {
      from: 'rooms',
      localField: 'temporaryRoom',
      foreignField: '_id',
      as: 'roomInfo'
    }
  },
  {
    $project: {
      name: 1,
      studentId: 1,
      paymentStatus: 1,
      amountToPay: 1,
      roomNumber: { $arrayElemAt: ['$roomInfo.roomNumber', 0] }
    }
  }
])
```

**Example Output:**

```json
[
  { "name": "Alice", "studentId": "STU001", "paymentStatus": "PAID", "amountToPay": 25000, "roomNumber": "A-301" },
  { "name": "Beth", "studentId": "STU002", "paymentStatus": "PAID", "amountToPay": 25000, "roomNumber": "A-301" },
  { "name": "Carol", "studentId": "STU003", "paymentStatus": "PAYMENT_PENDING", "amountToPay": 25000, "roomNumber": "A-301" }
]
```

---

## 🎓 DEMO SCRIPT (For Presentation)

### 5-Minute Demo

```
1. Show pricing table (2 min)
   - "Each student pays ₹25,000 for Triple room"
   - "NOT ₹8,333 each (that's wrong)"

2. Select room as leader (1 min)
   - Click "Select Room"
   - Backend returns: paymentTriggered: true
   - Navigate to dashboard

3. Payment modal auto-opens (1 min)
   - Modal appears WITHOUT clicking
   - Shows: "Amount: ₹25,000"
   - Click "Pay Now"
   - Enter UPI details
   - Payment success

4. Show group status (1 min)
   - "1/3 members paid"
   - Login as 2nd student
   - Modal auto-opens
   - Complete payment
   - "2/3 members paid"
   - Login as 3rd student
   - Complete payment
   - "🎉 Room Confirmed!"
```

---

## 📝 CHECKLIST BEFORE DEMO/SUBMISSION

- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] MongoDB connected and populated with test data
- [ ] At least 3 students registered
- [ ] At least 1 Triple room available
- [ ] Payment modal opens automatically (tested)
- [ ] Each student pays ₹25,000 (not ₹8,333)
- [ ] Room confirms only after all 3 pay
- [ ] Documentation is up to date
- [ ] README contains setup instructions

---

## 🔗 RELATED DOCUMENTS

- **Full Implementation Guide:** `PRODUCTION_READY_PAYMENT_FLOW.md`
- **Pricing Reference:** `ROOM_PRICING_REFERENCE.md`
- **Backend Models:** `backend/models/`
- **Backend Controllers:** `backend/controllers/studentController.js`
- **Frontend Components:** `admin/vite/src/views/admin/StudentDashboard.jsx`

---

**Last Updated:** 2024  
**Testing Time:** ~30 minutes  
**Demo Time:** ~5 minutes

