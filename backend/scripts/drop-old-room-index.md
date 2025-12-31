# Drop Old Room Index - Manual Instructions

The old MongoDB index `roomNumber_1` needs to be dropped to allow the same room number in different blocks/genders.

## Option 1: Using MongoDB Shell

1. Open MongoDB Compass or MongoDB Shell
2. Connect to your database (usually `hostelhaven`)
3. Run these commands:

```javascript
use hostelhaven
db.rooms.dropIndex("roomNumber_1")
```

## Option 2: Using MongoDB Compass GUI

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `rooms` collection
4. Go to the "Indexes" tab
5. Find the index named `roomNumber_1`
6. Click the "Drop Index" button next to it

## Option 3: Run the Migration Script

```bash
cd backend
node scripts/fix-room-index.js
```

## Verify the Fix

After dropping the index, verify that the compound index exists:

```javascript
db.rooms.getIndexes()
```

You should see an index like:
```
{
  "v": 2,
  "key": { "roomNumber": 1, "block": 1, "gender": 1 },
  "name": "roomNumber_1_block_1_gender_1",
  "unique": true
}
```

And you should NOT see:
```
{
  "key": { "roomNumber": 1 },
  "name": "roomNumber_1",
  "unique": true
}
```

