"""
HostelHaven AI Matching Service
Flask microservice for AI-based roommate matching using K-Means clustering and cosine similarity
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import logging
from typing import List, Dict, Tuple
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests from Node.js backend

# Configuration
HOSTEL_ID = os.getenv('HOSTEL_ID', 'default')
MIN_CLUSTERS = 2
MAX_CLUSTERS = 10


class PreferenceEncoder:
    """
    Encodes student preferences into numerical feature vectors
    Each preference is mapped to a numerical value for machine learning
    """
    
    @staticmethod
    def encode_sleep_schedule(schedule: str) -> float:
        """
        Encode sleep schedule to numerical value (0-1 scale)
        Early sleepers get lower values, late sleepers get higher values
        """
        if not schedule:
            return 0.5  # Default neutral value
        
        schedule_lower = schedule.lower()
        
        # Map sleep schedules to numerical values
        if 'early' in schedule_lower or '10 pm' in schedule_lower or '11 pm' in schedule_lower:
            return 0.2  # Early sleeper
        elif 'normal' in schedule_lower or '12 am' in schedule_lower or '1 am' in schedule_lower:
            return 0.5  # Normal schedule
        elif 'late' in schedule_lower or '2 am' in schedule_lower or '3 am' in schedule_lower:
            return 0.8  # Late sleeper
        else:
            return 0.5  # Default
    
    @staticmethod
    def encode_cleanliness(cleanliness: int) -> float:
        """
        Encode cleanliness level (1-10 scale) to normalized value (0-1)
        """
        if cleanliness is None:
            return 0.5
        return cleanliness / 10.0
    
    @staticmethod
    def encode_study_habits(habits: str) -> float:
        """
        Encode study habits to numerical value
        Quiet study gets lower values, group study gets higher values
        """
        if not habits:
            return 0.5
        
        habits_lower = habits.lower()
        
        if 'quiet' in habits_lower or 'library' in habits_lower or 'silent' in habits_lower:
            return 0.2  # Prefers quiet study
        elif 'moderate' in habits_lower or 'flexible' in habits_lower:
            return 0.5  # Moderate study environment
        elif 'group' in habits_lower or 'music' in habits_lower or 'social' in habits_lower:
            return 0.8  # Prefers group/music study
        else:
            return 0.5
    
    @staticmethod
    def encode_noise_tolerance(tolerance: int) -> float:
        """
        Encode noise tolerance (1-10 scale) to normalized value (0-1)
        Lower values = prefers quiet, Higher values = noise friendly
        """
        if tolerance is None:
            return 0.5
        return tolerance / 10.0
    
    @staticmethod
    def encode_lifestyle(lifestyle: str) -> float:
        """
        Encode lifestyle preference to numerical value
        Quiet/reserved gets lower values, social/outgoing gets higher values
        """
        if not lifestyle:
            return 0.5
        
        lifestyle_lower = lifestyle.lower()
        
        if 'quiet' in lifestyle_lower or 'reserved' in lifestyle_lower or 'introvert' in lifestyle_lower:
            return 0.2  # Quiet lifestyle
        elif 'balanced' in lifestyle_lower or 'moderate' in lifestyle_lower or 'ambivert' in lifestyle_lower:
            return 0.5  # Balanced lifestyle
        elif 'social' in lifestyle_lower or 'outgoing' in lifestyle_lower or 'extrovert' in lifestyle_lower or 'party' in lifestyle_lower:
            return 0.8  # Social lifestyle
        else:
            return 0.5
    
    @staticmethod
    def encode_preferences(student: Dict) -> np.ndarray:
        """
        Convert student preferences to a feature vector
        Returns a 5-dimensional vector: [sleep_schedule, cleanliness, study_habits, noise_tolerance, lifestyle]
        """
        features = np.array([
            PreferenceEncoder.encode_sleep_schedule(student.get('sleepSchedule')),
            PreferenceEncoder.encode_cleanliness(student.get('cleanliness')),
            PreferenceEncoder.encode_study_habits(student.get('studyHabits')),
            PreferenceEncoder.encode_noise_tolerance(student.get('noiseTolerance')),
            PreferenceEncoder.encode_lifestyle(student.get('lifestyle'))
        ])
        
        return features


class RoommateMatcher:
    """
    Main class for AI-based roommate matching using K-Means clustering and cosine similarity
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.kmeans = None
        self.feature_vectors = None
        self.students = None
        self.clusters = None
    
    def prepare_data(self, students: List[Dict]) -> np.ndarray:
        """
        Prepare feature vectors for all students
        Args:
            students: List of student dictionaries with preferences
        Returns:
            numpy array of feature vectors (n_students x 5_features)
        """
        self.students = students
        feature_vectors = []
        
        for student in students:
            features = PreferenceEncoder.encode_preferences(student)
            feature_vectors.append(features)
        
        self.feature_vectors = np.array(feature_vectors)
        
        # Standardize features (mean=0, std=1) for better clustering
        self.feature_vectors = self.scaler.fit_transform(self.feature_vectors)
        
        return self.feature_vectors
    
    def perform_clustering(self, n_clusters: int = None) -> np.ndarray:
        """
        Apply K-Means clustering to group students with similar preferences
        Args:
            n_clusters: Number of clusters (auto-determined if None)
        Returns:
            Cluster labels for each student
        """
        n_students = len(self.feature_vectors)
        
        # Determine optimal number of clusters
        if n_clusters is None:
            # Use elbow method: try different k values
            # For academic project, use simple heuristic: sqrt(n/2)
            n_clusters = max(MIN_CLUSTERS, min(MAX_CLUSTERS, int(np.sqrt(n_students / 2))))
        
        # Ensure we don't have more clusters than students
        n_clusters = min(n_clusters, n_students)
        
        logger.info(f"Performing K-Means clustering with {n_clusters} clusters for {n_students} students")
        
        # Apply K-Means clustering
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        self.clusters = self.kmeans.fit_predict(self.feature_vectors)
        
        return self.clusters
    
    def find_compatible_roommates(self, target_student_id: str, top_k: int = 5) -> List[Dict]:
        """
        Find compatible roommates for a target student using cosine similarity
        Args:
            target_student_id: ID of the student to find matches for
            top_k: Number of top matches to return
        Returns:
            List of compatible roommates with compatibility scores
        """
        # Find target student index
        target_idx = None
        for i, student in enumerate(self.students):
            if student.get('_id') == target_student_id or student.get('id') == target_student_id:
                target_idx = i
                break
        
        if target_idx is None:
            logger.error(f"Target student {target_student_id} not found in student list")
            return []
        
        # Get target student's cluster
        target_cluster = self.clusters[target_idx]
        target_vector = self.feature_vectors[target_idx].reshape(1, -1)
        
        logger.info(f"Target student is in cluster {target_cluster}")
        
        # Find all students in the same cluster (excluding target)
        cluster_members = []
        for i, cluster_label in enumerate(self.clusters):
            if i != target_idx and cluster_label == target_cluster:
                cluster_members.append(i)
        
        if len(cluster_members) == 0:
            logger.warning(f"No other students found in cluster {target_cluster}")
            # Fallback: search in all clusters
            cluster_members = [i for i in range(len(self.students)) if i != target_idx]
        
        # Calculate cosine similarity with all cluster members
        similarities = []
        for member_idx in cluster_members:
            member_vector = self.feature_vectors[member_idx].reshape(1, -1)
            
            # Calculate cosine similarity (ranges from -1 to 1)
            similarity = cosine_similarity(target_vector, member_vector)[0][0]
            
            # Convert to compatibility score (0-100 scale)
            compatibility_score = int((similarity + 1) * 50)  # Scale from [-1,1] to [0,100]
            
            similarities.append({
                'student': self.students[member_idx],
                'compatibility_score': compatibility_score,
                'similarity': float(similarity),
                'cluster': int(self.clusters[member_idx])
            })
        
        # Filter matches to only include 50-100% compatibility scores
        filtered_similarities = [
            match for match in similarities 
            if 50 <= match['compatibility_score'] <= 100
        ]
        
        # Sort by compatibility score (descending)
        filtered_similarities.sort(key=lambda x: x['compatibility_score'], reverse=True)
        
        # Return top k matches (only 60-100% matches)
        return filtered_similarities[:top_k]


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ai-matching'}), 200


@app.route('/match', methods=['POST'])
def match_roommates():
    """
    Main endpoint for AI-based roommate matching
    Request body:
    {
        "targetStudent": {
            "_id": "student_id",
            "sleepSchedule": "10 PM - 7 AM (Normal)",
            "cleanliness": 8,
            "studyHabits": "Quiet (Library Style)",
            "noiseTolerance": 3,
            "lifestyle": "Quiet & Reserved"
        },
        "candidates": [
            {
                "_id": "candidate_id",
                "sleepSchedule": "...",
                "cleanliness": 7,
                ...
            },
            ...
        ],
        "topK": 5  // optional, default 5
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        target_student = data.get('targetStudent')
        candidates = data.get('candidates', [])
        top_k = data.get('topK', 5)
        
        if not target_student:
            return jsonify({'error': 'targetStudent is required'}), 400
        
        if not candidates:
            return jsonify({
                'matches': [],
                'message': 'No candidates provided for matching'
            }), 200
        
        logger.info(f"Processing matching request for student {target_student.get('_id')} with {len(candidates)} candidates")
        
        # Combine target student with candidates for clustering
        all_students = [target_student] + candidates
        
        # Initialize matcher and prepare data
        matcher = RoommateMatcher()
        matcher.prepare_data(all_students)
        
        # Perform K-Means clustering
        matcher.perform_clustering()
        
        # Find compatible roommates
        matches = matcher.find_compatible_roommates(
            target_student.get('_id'),
            top_k=top_k
        )
        
        # Format response
        response = {
            'targetStudent': {
                '_id': target_student.get('_id'),
                'name': target_student.get('name'),
                'cluster': int(matcher.clusters[0])  # Target is first in list
            },
            'matches': [
                {
                    'student': {
                        '_id': match['student'].get('_id'),
                        'name': match['student'].get('name'),
                        'studentId': match['student'].get('studentId'),
                        'email': match['student'].get('email'),
                        'course': match['student'].get('course'),
                        'year': match['student'].get('year')
                    },
                    'compatibilityScore': match['compatibility_score'],
                    'similarity': match['similarity'],
                    'cluster': match['cluster']
                }
                for match in matches
            ],
            'totalCandidates': len(candidates),
            'matchesFound': len(matches)
        }
        
        logger.info(f"Found {len(matches)} matches for student {target_student.get('_id')}")
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"Error in match_roommates: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/match-groups', methods=['POST'])
def match_roommate_groups():
    """
    Endpoint for forming roommate groups using K-Means clustering
    Request body:
    {
        "students": [...],  // List of all students
        "roomCapacity": 2,  // Capacity of the room (2 for Double, 3 for Triple, etc.)
        "minGroupScore": 60  // Optional minimum compatibility score
    }
    """
    try:
        data = request.json
        
        students = data.get('students', [])
        room_capacity = data.get('roomCapacity', 2)
        min_group_score = data.get('minGroupScore', 60)
        
        if len(students) < room_capacity:
            return jsonify({
                'groups': [],
                'message': f'Not enough students ({len(students)}) for room capacity {room_capacity}'
            }), 200
        
        logger.info(f"Forming groups for {len(students)} students with capacity {room_capacity}")
        
        # Prepare data and cluster
        matcher = RoommateMatcher()
        matcher.prepare_data(students)
        matcher.perform_clustering()
        
        # Form groups within each cluster
        groups = []
        used_students = set()
        
        # Group students by cluster
        cluster_students = {}
        for i, cluster_id in enumerate(matcher.clusters):
            if cluster_id not in cluster_students:
                cluster_students[cluster_id] = []
            cluster_students[cluster_id].append(i)
        
        # Form groups within each cluster
        for cluster_id, student_indices in cluster_students.items():
            cluster_members = [students[i] for i in student_indices if i not in used_students]
            
            # Form groups of room_capacity size
            for i in range(0, len(cluster_members), room_capacity):
                group = cluster_members[i:i + room_capacity]
                
                if len(group) == room_capacity:
                    # Calculate average compatibility score for the group
                    group_vectors = [matcher.feature_vectors[students.index(s)] for s in group]
                    total_similarity = 0
                    pair_count = 0
                    
                    for j in range(len(group)):
                        for k in range(j + 1, len(group)):
                            similarity = cosine_similarity(
                                group_vectors[j].reshape(1, -1),
                                group_vectors[k].reshape(1, -1)
                            )[0][0]
                            total_similarity += similarity
                            pair_count += 1
                    
                    avg_similarity = total_similarity / pair_count if pair_count > 0 else 0
                    avg_score = int((avg_similarity + 1) * 50)  # Convert to 0-100 scale
                    
                    # Only include groups with 50-100% compatibility scores
                    if avg_score >= min_group_score and avg_score <= 100:
                        groups.append({
                            'students': [
                                {
                                    '_id': s.get('_id'),
                                    'name': s.get('name'),
                                    'studentId': s.get('studentId')
                                }
                                for s in group
                            ],
                            'averageScore': avg_score,
                            'cluster': int(cluster_id)
                        })
                        
                        # Mark students as used
                        for s in group:
                            used_students.add(students.index(s))
        
        response = {
            'groups': groups,
            'totalGroups': len(groups),
            'roomCapacity': room_capacity
        }
        
        logger.info(f"Formed {len(groups)} groups")
        
        return jsonify(response), 200
    
    except Exception as e:
        logger.error(f"Error in match_roommate_groups: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))  # Changed to 5001 to avoid conflict with Node.js backend on 5000
    app.run(host='0.0.0.0', port=port, debug=True)

