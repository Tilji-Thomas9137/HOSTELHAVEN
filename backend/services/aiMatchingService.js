/**
 * AI Matching Service
 * Client for communicating with Python Flask AI matching microservice
 */

import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

class AIMatchingService {
  /**
   * Check if AI service is available
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('AI service health check failed:', error.message);
      return null;
    }
  }

  /**
   * Get AI-based roommate matches for a student
   * @param {Object} targetStudent - The student to find matches for
   * @param {Array} candidates - List of candidate students
   * @param {number} topK - Number of top matches to return
   * @returns {Promise<Object>} Matching results
   */
  async getMatches(targetStudent, candidates, topK = 5) {
    try {
      // Prepare student data for AI service
      const targetStudentData = {
        _id: targetStudent._id.toString(),
        name: targetStudent.name,
        studentId: targetStudent.studentId,
        sleepSchedule: targetStudent.aiPreferences?.sleepSchedule || null,
        cleanliness: targetStudent.aiPreferences?.cleanliness || null,
        studyHabits: targetStudent.aiPreferences?.studyHabits || null,
        noiseTolerance: targetStudent.aiPreferences?.noiseTolerance || null,
        lifestyle: targetStudent.aiPreferences?.lifestyle || null
      };

      const candidatesData = candidates.map(candidate => ({
        _id: candidate._id.toString(),
        name: candidate.name,
        studentId: candidate.studentId,
        email: candidate.email,
        course: candidate.course,
        year: candidate.year,
        sleepSchedule: candidate.aiPreferences?.sleepSchedule || null,
        cleanliness: candidate.aiPreferences?.cleanliness || null,
        studyHabits: candidate.aiPreferences?.studyHabits || null,
        noiseTolerance: candidate.aiPreferences?.noiseTolerance || null,
        lifestyle: candidate.aiPreferences?.lifestyle || null
      }));

      const response = await axios.post(
        `${AI_SERVICE_URL}/match`,
        {
          targetStudent: targetStudentData,
          candidates: candidatesData,
          topK: topK
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI matching service error:', error.message);
      
      // Fallback to basic matching if AI service is unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('AI matching service is unavailable. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * Form roommate groups using AI clustering
   * @param {Array} students - List of all students to group
   * @param {number} roomCapacity - Capacity of the room (2, 3, 4)
   * @param {number} minGroupScore - Minimum compatibility score
   * @returns {Promise<Object>} Grouped results
   */
  async formGroups(students, roomCapacity, minGroupScore = 60) {
    try {
      const studentsData = students.map(student => ({
        _id: student._id.toString(),
        name: student.name,
        studentId: student.studentId,
        email: student.email,
        course: student.course,
        year: student.year,
        sleepSchedule: student.aiPreferences?.sleepSchedule || null,
        cleanliness: student.aiPreferences?.cleanliness || null,
        studyHabits: student.aiPreferences?.studyHabits || null,
        noiseTolerance: student.aiPreferences?.noiseTolerance || null,
        lifestyle: student.aiPreferences?.lifestyle || null
      }));

      const response = await axios.post(
        `${AI_SERVICE_URL}/match-groups`,
        {
          students: studentsData,
          roomCapacity: roomCapacity,
          minGroupScore: minGroupScore
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('AI group matching service error:', error.message);
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new Error('AI matching service is unavailable. Please try again later.');
      }
      
      throw error;
    }
  }
}

export default new AIMatchingService();

