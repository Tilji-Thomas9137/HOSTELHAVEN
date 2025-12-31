# 🏠 Room Management Guide

## Overview
This guide explains the room management system and best practices for handling rooms in the HostelHaven system.

---

## 🎯 Room Status Management

### Room Statuses
The system uses the following room statuses:

| Status | Description | Visibility to Students | Can Edit | Can Delete |
|--------|-------------|----------------------|----------|------------|
| **Available** | Room is ready for allocation | ✅ Visible | ⚠️ Limited | ❌ Not Recommended |
| **Reserved** | Room selected, payment pending | ❌ Hidden | ❌ No | ❌ No |
| **Occupied** | Students living in room | ❌ Hidden | ❌ No | ❌ No |
| **Under Maintenance** | Room being repaired | ❌ Hidden | ✅ Yes | ❌ Not Recommended |
| **Blocked** | Room unavailable | ❌ Hidden | ✅ Yes | ❌ Not Recommended |

---

## 🚫 Room Deletion Policy

### **Rooms Should NOT Be Deleted**

The system is designed to prevent room deletion for several important reasons:

#### ❌ Why Deletion is Restricted:
1. **Data Integrity**: Deleting rooms breaks historical records
2. **Student Records**: Students' room history would be lost
3. **Payment Records**: Payment records linked to rooms would be orphaned
4. **Audit Trail**: No way to track what happened to the room

#### ✅ What to Do Instead:

##### **For Temporary Unavailability:**
Set room to **"Under Maintenance"**
- Room is hidden from students
- Can be edited when needed
- Can be reactivated later
- Preserves all historical data

##### **For Permanent Unavailability:**
Set room to **"Blocked"**
- Room is permanently marked as unavailable
- Still visible in admin panel
- Can be unblocked if needed
- All data preserved

---

## 🔒 Protection Mechanisms

### 1. **Occupied Room Protection**
When a room has students allocated:
- ✅ Shown with occupied count in room list
- ❌ Edit button disabled (except maintenance status)
- ❌ Delete button disabled
- ⚠️ Deletion attempt shows helpful error message

**Example Message:**
```
Cannot delete room. 2 student(s) are currently allocated to this room.
Please deallocate students first or set room to maintenance status.
```

### 2. **Reserved Room Protection**
When a room is selected but payment is pending:
- ✅ Status shown as "Reserved"
- ✅ Occupied count shows pending allocations
- ❌ Cannot be deleted
- ⚠️ Deletion attempt shows detailed error

**Example Message:**
```
Cannot delete room. 2 student(s) have selected this room (pending payment).
Please resolve allocations first or set room to maintenance status.
```

### 3. **General Deletion Prevention**
Even for empty rooms:
- ⚠️ Warning dialog explains alternatives
- ✅ Suggests using maintenance status
- ✅ Reminds about data preservation

**Warning Dialog:**
```
Room deletion is not recommended.

Instead, you can:
• Set room to "Under Maintenance" to block it from students
• Set room to "Blocked" to mark it unavailable

This preserves room history and allows reactivation later.

Continue with deletion anyway?
```

---

## 📋 Room Management Workflows

### Workflow 1: Taking Room Offline for Repairs

1. Go to **Rooms** → **Room List**
2. Find the room
3. Click **Edit** icon
4. Change **Maintenance Status** to **"Under Maintenance"**
5. Click **Save**

**Result:**
- ✅ Room hidden from student selection
- ✅ Current students unaffected
- ✅ Room can be edited anytime
- ✅ Can be reactivated by changing status back to "None"

---

### Workflow 2: Permanently Blocking a Room

1. Go to **Rooms** → **Room List**
2. Find the room
3. Click **Edit** icon
4. Change **Maintenance Status** to **"Blocked"**
5. Click **Save**

**Result:**
- ✅ Room marked as permanently unavailable
- ✅ Hidden from student selection
- ✅ Still visible in admin reports
- ✅ Can be unblocked if plans change

---

### Workflow 3: Deallocating Students from Room

**Before you can modify an occupied room:**

1. Go to **Students** → **View All Students**
2. Filter by the room number
3. For each student in the room:
   - Click **Edit**
   - Navigate to **Room Allocation** section
   - Click **Deallocate Room**
   - Confirm the action
4. Return to **Rooms** → **Room List**
5. Room is now available for modification

**Important Notes:**
- 📝 Deallocation should be done carefully
- 💰 Check if students have paid fees
- 📧 Send notification to affected students
- 🏠 Consider providing alternative room

---

## 🎨 Visual Indicators

### Room Status Colors

| Status | Color | Badge |
|--------|-------|-------|
| Available | 🟢 Green | `success` |
| Reserved | 🔵 Blue | `info` |
| Occupied | 🔴 Red | `error` |
| Under Maintenance | 🟡 Yellow | `warning` |
| Blocked | 🔴 Red | `error` |

### Occupancy Display

```
Occupied: 2
Available: 2
```

This shows:
- **2** students currently in the room
- **2** spaces still available (for 4-capacity room)

### Button States

| Action | Available Room | Reserved Room | Occupied Room |
|--------|---------------|---------------|---------------|
| Edit | 🟦 Enabled (limited) | ❌ Disabled | ❌ Disabled |
| Delete | 🟦 Enabled (warned) | ❌ Disabled | ❌ Disabled |
| Maintenance | ✅ Always Enabled | ✅ Always Enabled | ✅ Always Enabled |

---

## 🔧 Maintenance Status Management

### When to Use Each Status:

#### **None** (Default)
- Room is fully operational
- Available for student selection
- No restrictions

#### **Under Maintenance**
- Room needs repairs
- Temporary unavailability
- Can be fixed and reactivated
- Examples:
  - Plumbing repair
  - Painting
  - Electrical work
  - AC servicing

#### **Blocked**
- Long-term unavailability
- Structural issues
- Not safe for occupancy
- Examples:
  - Major structural damage
  - Safety concerns
  - Pending renovation
  - Reserved for staff use

---

## 📊 Room Allocation States

### State Flow:

```
Available
    ↓ (Student selects room)
Reserved (Payment Pending)
    ↓ (Payment completed)
Occupied (Student living there)
    ↓ (Student leaves/deallocated)
Available
```

### Under Maintenance Flow:

```
Available/Occupied
    ↓ (Set to maintenance)
Under Maintenance
    ↓ (Repairs complete, status set to "None")
Available
```

---

## ⚠️ Important Reminders

### ✅ DO:
- Set rooms to maintenance when undergoing repairs
- Use blocked status for long-term unavailability
- Deallocate students properly before major room changes
- Keep room data for historical records
- Update maintenance status promptly

### ❌ DON'T:
- Delete rooms with students allocated
- Delete rooms with payment history
- Delete rooms to "hide" them (use blocked status)
- Forget to notify students about room changes
- Delete rooms without checking dependencies

---

## 🆘 Troubleshooting

### Problem: Cannot Delete Room

**Error:** "Cannot delete room. X student(s) are currently allocated."

**Solution:**
1. Don't delete the room
2. Instead, set to "Under Maintenance" or "Blocked"
3. If deletion is absolutely necessary:
   - Deallocate all students first
   - Check for pending payments
   - Verify no active bookings

---

### Problem: Cannot Edit Occupied Room

**Issue:** Edit button is disabled or fields are locked

**Explanation:** This is intentional protection

**What You CAN Edit:**
- ✅ Maintenance Status
- ✅ Room status changes

**What You CANNOT Edit:**
- ❌ Room number
- ❌ Room type
- ❌ Capacity
- ❌ Amenities
- ❌ Gender restriction

**Solution:** Deallocate students first if changes are essential

---

### Problem: Room Not Showing in Student Selection

**Possible Reasons:**

1. **Status is not "Available"**
   - Check room status
   - Ensure not in maintenance or blocked

2. **Capacity is full**
   - Check occupied vs capacity
   - Room may be fully booked

3. **Gender Mismatch**
   - Room gender must match student gender
   - Boys rooms only show to boys, girls rooms to girls

4. **Under Maintenance**
   - Room is being repaired
   - Change status to "None" when ready

---

## 📈 Best Practices

### For Daily Operations:
1. **Regular Status Reviews**
   - Check maintenance status weekly
   - Update room availability promptly
   - Clear blocked rooms when resolved

2. **Student Communication**
   - Notify students before maintenance
   - Provide timeline for repairs
   - Offer alternative arrangements if needed

3. **Data Maintenance**
   - Keep room records up to date
   - Document maintenance activities
   - Track occupancy trends

### For Long-term Management:
1. **Preserve Historical Data**
   - Never delete rooms unnecessarily
   - Maintain complete audit trail
   - Keep payment and allocation records

2. **Plan Maintenance Windows**
   - Schedule repairs during breaks
   - Minimize student disruption
   - Batch similar repairs together

3. **Monitor Room Utilization**
   - Track occupancy rates
   - Identify underutilized rooms
   - Optimize room assignments

---

## 🎓 Summary

**Remember:**
- 🏠 Rooms are permanent assets - manage, don't delete
- 🔧 Use maintenance statuses to control availability
- 👥 Always consider student impact
- 📊 Preserve data for reporting and auditing
- ✅ Follow workflows for proper management

**The system is designed to prevent mistakes and preserve data integrity. Work with it, not against it!**

---

**Last Updated**: December 24, 2025  
**System Version**: 1.0.0  
**Status**: ✅ Production Ready

