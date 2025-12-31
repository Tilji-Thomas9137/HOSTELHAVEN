# Room Change & Wallet Enhancement Plan

## Current System Overview

### **Room Change Process:**

#### **1. Upgrade (More Expensive Room)**
```
Current Room: ₹40,000/year → New Room: ₹64,000/year
Price Difference: ₹24,000
Status: pending_payment
Action: Student must pay ₹24,000 before admin approval
```

#### **2. Downgrade (Cheaper Room)**
```
Current Room: ₹64,000/year → New Room: ₹40,000/year
Price Difference: -₹24,000 (credit)
Status: pending (no payment required)
Action: After admin approval → ₹24,000 credited to wallet
```

### **Wallet Usage:**
- **Purpose:** Store credits from room downgrades and refunds
- **Can be used for:** Mess fees, hostel fees, future payments, adjustments
- **Tracks:** Full transaction history with reasons

---

## Issues to Fix

### **1. Student Dashboard**
❌ **Problem:** Wallet balance not displayed
❌ **Problem:** Room change requests not prominently shown
❌ **Problem:** Credit/debit amounts not highlighted

### **2. Parent Dashboard**
❌ **Problem:** Parents don't see child's wallet balance
❌ **Problem:** No notifications about room changes
❌ **Problem:** No visibility into credit/debit transactions

### **3. Notifications**
❌ **Problem:** Parents not notified when:
   - Child requests room change
   - Room change approved/rejected
   - Wallet credited (downgrade)
   - Payment required (upgrade)

---

## Proposed Solutions

### **Solution 1: Enhanced Student Dashboard**

#### **Add Wallet Balance Card**
```javascript
// New card in student overview
{
  title: 'Wallet Balance',
  value: `₹${walletBalance}`,
  compare: transactions.length > 0 ? 'Last transaction' : 'No transactions',
  chip: {
    label: walletBalance > 0 ? 'Available' : 'Empty',
    color: walletBalance > 0 ? 'success' : 'default',
    avatar: <IconWallet />
  }
}
```

#### **Add Room Change Status Banner**
```javascript
{activeRoomChangeRequest && (
  <Alert 
    severity={request.status === 'pending_payment' ? 'warning' : 'info'}
    icon={<IconHome />}
  >
    <Typography variant="subtitle2">
      Room Change Request: {currentRoom} → {requestedRoom}
    </Typography>
    <Typography variant="body2">
      {request.status === 'pending_payment' 
        ? `Payment Required: ₹${request.upgradePaymentRequired}`
        : request.status === 'pending'
        ? `Wallet Credit on Approval: ₹${request.downgradeWalletCredit}`
        : `Status: ${request.status}`
      }
    </Typography>
  </Alert>
)}
```

---

### **Solution 2: Enhanced Parent Dashboard**

#### **Add Child Wallet Balances**
```javascript
// In each child card
<Stack spacing={0.5}>
  <Typography variant="caption" color="text.secondary">
    Wallet Balance
  </Typography>
  <Typography variant="body2" fontWeight={500} color="success.main">
    ₹{child.walletBalance || 0}
  </Typography>
  {child.walletBalance > 0 && (
    <Typography variant="caption" color="text.secondary">
      Available for future payments
    </Typography>
  )}
</Stack>
```

#### **Add Room Change Notifications**
```javascript
// Show pending room change requests
{childrenWithPendingRoomChanges.map(child => (
  <Alert severity="info" sx={{ mb: 2 }}>
    <Typography variant="subtitle2">
      {child.name} - Room Change Pending
    </Typography>
    <Typography variant="body2">
      From: {child.currentRoom} → To: {child.requestedRoom}
      {child.upgradePaymentRequired > 0 && (
        <Chip 
          label={`Payment: ₹${child.upgradePaymentRequired}`} 
          color="warning" 
          size="small" 
          sx={{ ml: 1 }}
        />
      )}
      {child.downgradeWalletCredit > 0 && (
        <Chip 
          label={`Credit: ₹${child.downgradeWalletCredit}`} 
          color="success" 
          size="small" 
          sx={{ ml: 1 }}
        />
      )}
    </Typography>
  </Alert>
))}
```

---

### **Solution 3: Parent Notifications**

#### **Backend: Add Parent Notification on Room Change Request**
```javascript
// In requestRoomChange function
// Send notification to student
await createNotification({
  title: 'Room Change Request Submitted',
  message: `Your room change request from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber} has been submitted.`,
  type: 'general',
  recipient: student.user,
});

// ✅ NEW: Send notification to parent
const parent = await Parent.findOne({ students: student._id }).populate('user');
if (parent && parent.user) {
  await createNotification({
    title: `Room Change Request - ${student.name}`,
    message: `${student.name} has requested a room change from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber}. ${
      priceCalculation.isUpgrade 
        ? `Upgrade payment required: ₹${priceCalculation.upgradePaymentRequired}`
        : `Wallet credit on approval: ₹${priceCalculation.downgradeWalletCredit}`
    }`,
    type: 'general',
    recipient: parent.user._id,
    recipientRole: 'parent',
    studentDetails: {
      name: student.name,
      studentId: student.studentId,
      admissionNumber: student.studentId,
      roomNumber: currentRoom.roomNumber,
    },
  });
}
```

#### **Backend: Add Parent Notification on Room Change Approval**
```javascript
// In approveRoomChangeRequest function
// After wallet credit
if (roomChangeRequest.downgradeWalletCredit > 0) {
  // ... existing wallet credit code ...
  
  // ✅ NEW: Notify parent about wallet credit
  const parent = await Parent.findOne({ students: student._id }).populate('user');
  if (parent && parent.user) {
    await createNotification({
      title: `Wallet Credited - ${student.name}`,
      message: `₹${roomChangeRequest.downgradeWalletCredit} has been credited to ${student.name}'s wallet due to room downgrade from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber}. This amount can be used for future payments.`,
      type: 'payment',
      recipient: parent.user._id,
      recipientRole: 'parent',
      studentDetails: {
        name: student.name,
        studentId: student.studentId,
        admissionNumber: student.studentId,
        roomNumber: requestedRoom.roomNumber,
      },
    });
  }
}

// ✅ NEW: Notify parent about upgrade payment
if (roomChangeRequest.upgradePaymentRequired > 0) {
  const parent = await Parent.findOne({ students: student._id }).populate('user');
  if (parent && parent.user) {
    await createNotification({
      title: `Room Change Approved - ${student.name}`,
      message: `Room change for ${student.name} from ${currentRoom.roomNumber} to ${requestedRoom.roomNumber} has been approved. Upgrade payment of ₹${roomChangeRequest.upgradePaymentRequired} has been processed.`,
      type: 'payment',
      recipient: parent.user._id,
      recipientRole: 'parent',
      studentDetails: {
        name: student.name,
        studentId: student.studentId,
        admissionNumber: student.studentId,
        roomNumber: requestedRoom.roomNumber,
      },
    });
  }
}
```

---

### **Solution 4: Backend API Enhancements**

#### **Add Wallet Endpoint to Student Controller**
```javascript
/**
 * Get student wallet balance and transactions
 */
export const getWallet = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    let wallet = await Wallet.findOne({ student: student._id })
      .populate('transactions.roomChangeRequest', 'currentRoom requestedRoom')
      .populate('transactions.payment', 'amount transactionId');
    
    if (!wallet) {
      wallet = await Wallet.create({ student: student._id, balance: 0 });
    }
    
    res.json({
      balance: wallet.balance,
      transactions: wallet.transactions.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
};
```

#### **Add Wallet to Dashboard Stats**
```javascript
// In getDashboardStats function
// After fetching student
const wallet = await Wallet.findOne({ student: student._id });
const walletBalance = wallet ? wallet.balance : 0;

// Add to response
res.json({
  student,
  wallet: {
    balance: walletBalance,
    hasBalance: walletBalance > 0,
  },
  stats: {
    // ... existing stats
  },
  notifications: filteredNotifications
});
```

#### **Add Room Change Status to Dashboard**
```javascript
// In getDashboardStats function
const activeRoomChangeRequest = await RoomChangeRequest.findOne({
  student: student._id,
  status: { $in: ['pending', 'pending_payment', 'under_review'] },
})
  .populate('currentRoom', 'roomNumber block')
  .populate('requestedRoom', 'roomNumber block');

// Add to response
res.json({
  student,
  wallet: { ... },
  roomChangeRequest: activeRoomChangeRequest,
  stats: { ... },
  notifications: [ ... ]
});
```

---

### **Solution 5: Parent Controller Enhancement**

#### **Add Children Wallet Balances**
```javascript
// In getDashboardStats function
const children = await Student.find({ _id: { $in: parent.students } })
  .populate('room', 'roomNumber floor building');

// Fetch wallet balances for all children
const childrenWithWallets = await Promise.all(
  children.map(async (child) => {
    const wallet = await Wallet.findOne({ student: child._id });
    const roomChangeRequest = await RoomChangeRequest.findOne({
      student: child._id,
      status: { $in: ['pending', 'pending_payment', 'under_review'] },
    })
      .populate('currentRoom', 'roomNumber')
      .populate('requestedRoom', 'roomNumber');
    
    return {
      ...child.toObject(),
      walletBalance: wallet ? wallet.balance : 0,
      roomChangeRequest: roomChangeRequest,
    };
  })
);

// Add to response
res.json({
  parent,
  children: childrenWithWallets,
  stats: { ... }
});
```

---

## Implementation Files

### **Files to Modify:**

#### **Backend:**
1. ✅ `backend/controllers/studentController.js`
   - Add `getWallet` function
   - Update `getDashboardStats` to include wallet and room change request
   - Add parent notifications in `requestRoomChange`

2. ✅ `backend/controllers/adminController.js`
   - Add parent notifications in `approveRoomChangeRequest`
   - Add parent notifications in `rejectRoomChangeRequest`

3. ✅ `backend/controllers/parentController.js`
   - Update `getDashboardStats` to include children's wallet balances
   - Update `getChildren` to include wallet and room change info

4. ✅ `backend/routes/student.routes.js`
   - Add `GET /student/wallet` route

#### **Frontend:**
1. ✅ `admin/vite/src/views/admin/StudentDashboard.jsx`
   - Add wallet balance card
   - Add room change request banner
   - Display credit/debit amounts prominently

2. ✅ `admin/vite/src/views/admin/ParentDashboard.jsx`
   - Add wallet balance for each child
   - Add room change request alerts
   - Show credit/debit information

3. ✅ `admin/vite/src/services/studentService.js`
   - Add `getWallet()` API call

---

## User Flow Examples

### **Example 1: Room Downgrade**

#### **Step 1: Student Requests Downgrade**
- Current Room: 101 (₹64,000/year)
- Requested Room: 201 (₹40,000/year)
- Credit: ₹24,000

**Notifications Sent:**
1. ✅ Student: "Room change request submitted. You will receive ₹24,000 wallet credit after approval."
2. ✅ Parent: "John requested room downgrade. ₹24,000 will be credited to wallet on approval."
3. ✅ Admin: "John (13210) requested room change from 101 to 201."

#### **Step 2: Admin Approves**
**Actions:**
1. ✅ Student moved to new room
2. ✅ Wallet credited: ₹24,000
3. ✅ Notifications sent to student & parent

**Student Dashboard:**
- 🏠 Room: 201
- 💰 Wallet: ₹24,000
- 📊 "Your wallet was credited ₹24,000 from room downgrade. Use for future payments!"

**Parent Dashboard:**
- Child: John
- Room: 201
- Wallet: ₹24,000
- 📧 "₹24,000 credited to John's wallet (room downgrade)"

---

### **Example 2: Room Upgrade**

#### **Step 1: Student Requests Upgrade**
- Current Room: 201 (₹40,000/year)
- Requested Room: 101 (₹64,000/year)
- Payment Required: ₹24,000

**Notifications Sent:**
1. ✅ Student: "Room change request submitted. Payment of ₹24,000 required."
2. ✅ Parent: "Jane requested room upgrade. Payment required: ₹24,000"
3. ✅ Admin: "Jane (13218) requested room change from 201 to 101. Payment: ₹24,000"

#### **Step 2: Student Pays**
**Actions:**
1. ✅ Payment of ₹24,000 processed
2. ✅ Request status: pending (awaiting admin approval)

**Student Dashboard:**
- ⏳ Room Change Pending
- 💳 Paid: ₹24,000
- 📊 "Awaiting admin approval for room upgrade to 101"

**Parent Dashboard:**
- Child: Jane
- Status: Room change pending
- Paid: ₹24,000
- 📧 "Jane paid ₹24,000 for room upgrade. Awaiting approval."

#### **Step 3: Admin Approves**
**Actions:**
1. ✅ Student moved to new room
2. ✅ Notifications sent

**Student Dashboard:**
- 🏠 Room: 101
- ✅ "Your room has been upgraded to 101!"

**Parent Dashboard:**
- Child: Jane
- Room: 101
- 📧 "Room upgrade approved. Jane moved to room 101."

---

## Benefits

### **For Students:**
✅ Clear visibility of wallet balance
✅ Understand credit/debit amounts
✅ Track room change status
✅ Know when payment is required
✅ See available funds for future use

### **For Parents:**
✅ Monitor children's wallet balances
✅ Receive timely notifications about room changes
✅ Understand payment requirements
✅ Track credit transactions
✅ Better financial visibility

### **For Admin:**
✅ Better communication with parents
✅ Reduced confusion about payments
✅ Transparent credit/debit system
✅ Improved trust and satisfaction

---

## Next Steps

1. ✅ Implement backend changes (student & parent controllers)
2. ✅ Add parent notifications for room changes
3. ✅ Update student dashboard UI (wallet card + banner)
4. ✅ Update parent dashboard UI (wallet + alerts)
5. ✅ Test all notification flows
6. ✅ Verify wallet transactions display correctly
7. ✅ Document wallet usage for students/parents

---

## Wallet Use Cases

### **Credits (Money IN):**
- ✅ Room downgrade refund
- ✅ General refunds
- ✅ Adjustments (admin corrections)

### **Debits (Money OUT):**
- ✅ Mess fee payment (if wallet has balance)
- ✅ Hostel fee payment (if wallet has balance)
- ✅ Adjustments

### **Future Enhancements:**
- 💡 Allow students to request wallet withdrawals
- 💡 Auto-apply wallet balance to pending fees
- 💡 Wallet transaction receipts
- 💡 Monthly wallet statements

---

## Status: Ready for Implementation

All solutions are documented and ready to be coded. Would you like me to proceed with the implementation?

