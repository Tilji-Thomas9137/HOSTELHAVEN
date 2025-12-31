# ROOM PRICING REFERENCE GUIDE

## 🏠 QUICK REFERENCE

### Standard Pricing (Per Student)

```
┌─────────────┬──────────┬─────────────────┬──────────────────┐
│  Room Type  │ Capacity │  Per Student    │  Total Revenue   │
├─────────────┼──────────┼─────────────────┼──────────────────┤
│  Single     │    1     │    ₹40,000      │    ₹40,000       │
│  Double     │    2     │    ₹30,000      │    ₹60,000       │
│  Triple     │    3     │    ₹25,000      │    ₹75,000       │
│  Quad       │    4     │    ₹20,000      │    ₹80,000       │
└─────────────┴──────────┴─────────────────┴──────────────────┘
```

### Amenities Pricing (Per Student)

```
┌──────────────────────┬─────────────────┐
│      Amenity         │  Per Student    │
├──────────────────────┼─────────────────┤
│  AC                  │    +₹5,000      │
│  Attached Bathroom   │    +₹3,000      │
│  Geyser              │    +₹2,000      │
│  WiFi                │    +₹1,500      │
│  Extra Furniture     │    +₹1,000      │
└──────────────────────┴─────────────────┘
```

---

## 💡 EXAMPLES

### Example 1: Double Room (No Amenities)

- **Room Type:** Double
- **Base Amount:** ₹30,000 per student
- **Amenities:** None
- **Total per Student:** ₹30,000

**Student A Payment:** ₹30,000  
**Student B Payment:** ₹30,000  
**Total Revenue:** ₹60,000

---

### Example 2: Triple Room with AC

- **Room Type:** Triple
- **Base Amount:** ₹25,000 per student
- **Amenities:** AC (+₹5,000)
- **Total per Student:** ₹30,000

**Student A Payment:** ₹30,000  
**Student B Payment:** ₹30,000  
**Student C Payment:** ₹30,000  
**Total Revenue:** ₹90,000

---

### Example 3: Quad Room with AC + WiFi

- **Room Type:** Quad
- **Base Amount:** ₹20,000 per student
- **Amenities:** 
  - AC: +₹5,000
  - WiFi: +₹1,500
- **Total per Student:** ₹26,500

**Student A Payment:** ₹26,500  
**Student B Payment:** ₹26,500  
**Student C Payment:** ₹26,500  
**Student D Payment:** ₹26,500  
**Total Revenue:** ₹1,06,000

---

## ❌ COMMON MISTAKES TO AVOID

### Mistake 1: Splitting Base Amount

**❌ WRONG:**
```
Double Room = ₹30,000 total
Student A pays: ₹15,000 (30000 / 2)
Student B pays: ₹15,000 (30000 / 2)
```

**✅ CORRECT:**
```
Double Room = ₹30,000 per student
Student A pays: ₹30,000
Student B pays: ₹30,000
Total Revenue: ₹60,000
```

### Mistake 2: Dividing Amenities Cost

**❌ WRONG:**
```
Triple Room + AC (₹5,000)
Each student pays: 5000 / 3 = ₹1,667 for AC
```

**✅ CORRECT:**
```
Triple Room + AC (₹5,000 per student)
Each student pays: ₹5,000 for AC
```

### Mistake 3: Partial Payment from Some Members

**❌ WRONG:**
```
Triple Room = ₹25,000 per student
Student A pays: ₹25,000 ✅
Student B pays: ₹12,500 (half) ❌
Room status: Confirmed ❌
```

**✅ CORRECT:**
```
Triple Room = ₹25,000 per student
Student A pays: ₹25,000 ✅
Student B pays: ₹25,000 ✅
Student C pays: ₹25,000 ✅
Room status: Confirmed ✅
```

---

## 🧮 PRICING CALCULATOR

### Formula

```javascript
// Base amount per student (based on room type)
const baseAmounts = {
  'Single': 40000,
  'Double': 30000,
  'Triple': 25000,
  'Quad': 20000,
};

// Amenities pricing (per student)
const amenitiesPricing = {
  ac: 5000,
  attachedBathroom: 3000,
  geyser: 2000,
  wifi: 1500,
  extraFurniture: 1000,
};

// Calculate total price per student
function calculatePricePerStudent(roomType, amenities) {
  let total = baseAmounts[roomType];
  
  if (amenities.ac) total += amenitiesPricing.ac;
  if (amenities.attachedBathroom) total += amenitiesPricing.attachedBathroom;
  if (amenities.geyser) total += amenitiesPricing.geyser;
  if (amenities.wifi) total += amenitiesPricing.wifi;
  if (amenities.extraFurniture) total += amenitiesPricing.extraFurniture;
  
  return total;
}

// Example usage
const roomType = 'Triple';
const amenities = { ac: true, wifi: true };
const pricePerStudent = calculatePricePerStudent(roomType, amenities);
// Result: 25000 + 5000 + 1500 = ₹31,500 per student

const capacity = 3;
const totalRevenue = pricePerStudent * capacity;
// Result: 31500 × 3 = ₹94,500
```

---

## 📊 REVENUE PROJECTION

### Scenario: 100-Room Hostel

| Room Type | Quantity | Capacity | Per Student | Total Revenue |
|-----------|----------|----------|-------------|---------------|
| Single    | 10       | 10       | ₹40,000     | ₹4,00,000     |
| Double    | 30       | 60       | ₹30,000     | ₹18,00,000    |
| Triple    | 40       | 120      | ₹25,000     | ₹30,00,000    |
| Quad      | 20       | 80       | ₹20,000     | ₹16,00,000    |
| **TOTAL** | **100**  | **270**  | -           | **₹68,00,000**|

**Average per Student:** ₹68,00,000 / 270 = ₹25,185

---

## 🔍 VERIFICATION CHECKLIST

Before deployment, verify:

- [ ] `Room.basePrice` matches pricing table above
- [ ] `Room.totalPrice = basePrice + amenitiesPrice` (per student)
- [ ] `Fee.amount` equals `Room.totalPrice` (not divided by capacity)
- [ ] Each student in group has individual `Fee` record
- [ ] All `Fee.amount` values are equal for students in same room
- [ ] `Student.amountToPay` equals `Room.totalPrice` (not shared)
- [ ] Payment total equals `Room.totalPrice × capacity`

### Database Query for Verification

```javascript
// MongoDB query to verify pricing
db.rooms.find().forEach(room => {
  const studentsInRoom = db.students.find({ room: room._id }).toArray();
  const expectedRevenue = room.totalPrice * studentsInRoom.length;
  
  const actualPayments = db.payments.find({
    student: { $in: studentsInRoom.map(s => s._id) },
    status: 'completed'
  }).toArray();
  
  const actualRevenue = actualPayments.reduce((sum, p) => sum + p.amount, 0);
  
  if (expectedRevenue !== actualRevenue) {
    print(`❌ Room ${room.roomNumber}: Expected ${expectedRevenue}, Got ${actualRevenue}`);
  } else {
    print(`✅ Room ${room.roomNumber}: Correct`);
  }
});
```

---

## 📝 PAYMENT RECEIPT TEMPLATE

```
═══════════════════════════════════════════════════
           HOSTEL PAYMENT RECEIPT
═══════════════════════════════════════════════════

Student Name:    John Doe
Student ID:      STU001
Room Number:     A-201
Room Type:       Triple

───────────────────────────────────────────────────
PAYMENT BREAKDOWN
───────────────────────────────────────────────────

Base Amount (Triple Room):          ₹25,000
Amenities:
  • AC                              + ₹5,000
  • WiFi                            + ₹1,500
                                    ─────────
TOTAL AMOUNT (PER STUDENT):           ₹31,500
═══════════════════════════════════════════════════

Payment Method:  UPI
Transaction ID:  TXN123456789
Payment Date:    2024-12-23
Status:          Completed ✅

───────────────────────────────────────────────────
NOTE: This amount is per student. Each roommate
pays the same amount individually.
───────────────────────────────────────────────────

Signature: ____________________
           Admin/Accountant

═══════════════════════════════════════════════════
```

---

## 🎯 SUMMARY

**Key Principle:** 
> Each student pays the FULL base amount + amenities price.  
> NO COST SPLITTING under any circumstances.

**Why This Model?**

1. **Simplicity:** Each student pays same amount
2. **Fairness:** No disputes over who pays more
3. **Accounting:** Clear revenue per room
4. **Standard Practice:** Used by most real hostels

**Total Revenue Formula:**
```
Total Revenue = (Base Amount + Amenities) × Capacity
```

**NOT:**
```
❌ Total Revenue = Base Amount (split among students)
```

---

**Last Updated:** 2024  
**Document Version:** 1.0

