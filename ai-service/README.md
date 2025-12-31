# HostelHaven AI Matching Service

A Python Flask microservice for AI-based roommate matching using K-Means clustering and cosine similarity.

## Features

- **K-Means Clustering**: Groups students with similar preferences into clusters
- **Cosine Similarity**: Calculates compatibility scores between students
- **Preference Encoding**: Converts textual preferences to numerical feature vectors
- **RESTful API**: Clean endpoints for integration with Node.js backend

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the service:
```bash
python app.py
```

The service will run on `http://localhost:5000` by default.

## API Endpoints

### Health Check
```
GET /health
```

### Match Roommates
```
POST /match
Content-Type: application/json

{
  "targetStudent": {
    "_id": "student_id",
    "sleepSchedule": "10 PM - 7 AM (Normal)",
    "cleanliness": 8,
    "studyHabits": "Quiet (Library Style)",
    "noiseTolerance": 3,
    "lifestyle": "Quiet & Reserved"
  },
  "candidates": [...],
  "topK": 5
}
```

### Match Roommate Groups
```
POST /match-groups
Content-Type: application/json

{
  "students": [...],
  "roomCapacity": 2,
  "minGroupScore": 60
}
```

## Preference Encoding

Each preference is encoded to a numerical value (0-1 scale):

- **Sleep Schedule**: Early (0.2) → Normal (0.5) → Late (0.8)
- **Cleanliness**: 1-10 scale normalized to 0-1
- **Study Habits**: Quiet (0.2) → Moderate (0.5) → Group (0.8)
- **Noise Tolerance**: 1-10 scale normalized to 0-1
- **Lifestyle**: Quiet (0.2) → Balanced (0.5) → Social (0.8)

## Algorithm Overview

1. **Feature Vector Creation**: Convert all student preferences to 5-dimensional vectors
2. **Standardization**: Normalize features using StandardScaler
3. **Clustering**: Apply K-Means to group similar students
4. **Similarity Calculation**: Use cosine similarity within clusters
5. **Ranking**: Return top-k matches sorted by compatibility score

## Integration with Node.js

The Node.js backend should call this service when students request AI matches:

```javascript
const response = await axios.post('http://localhost:5000/match', {
  targetStudent: currentStudent,
  candidates: candidateStudents,
  topK: 5
});
```

