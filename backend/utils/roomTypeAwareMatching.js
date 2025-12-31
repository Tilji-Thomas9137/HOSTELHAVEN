/**
 * Room-Type Aware AI Matching
 * Matches students based on selected room type and preferred roommates
 */

import { calculateCompatibilityScore, findBestMatches } from './roommateMatching.js';
import Student from '../models/Student.model.js';
import RoommateGroup from '../models/RoommateGroup.model.js';

/**
 * Get room capacity based on room type
 */
export const getRoomCapacity = (roomType) => {
  const capacityMap = {
    'Single': 1,
    'Double': 2,
    'Triple': 3,
    'Quad': 4,
  };
  return capacityMap[roomType] || 1;
};

/**
 * Get number of roommates needed based on room type
 */
export const getRequiredRoommates = (roomType) => {
  return getRoomCapacity(roomType) - 1; // Excluding the student themselves
};

/**
 * Find AI-matched roommates for a student based on room type
 * Prioritizes preferred roommates, then fills remaining slots with AI matches
 * 
 * @param {Object} student - Student to find matches for
 * @param {String} roomType - 'Double', 'Triple', or 'Quad'
 * @param {number} minScore - Minimum compatibility score (default: 50)
 * @returns {Object} - { preferredRoommates: [], aiMatches: [], totalMatches: number }
 */
export const findRoomTypeAwareMatches = async (student, roomType, minScore = 50) => {
  if (roomType === 'Single') {
    return {
      preferredRoommates: [],
      aiMatches: [],
      totalMatches: 0,
      message: 'Single room selected - no roommate matching required',
    };
  }

  const requiredRoommates = getRequiredRoommates(roomType);
  const result = {
    preferredRoommates: [],
    aiMatches: [],
    totalMatches: 0,
    roomType,
    requiredRoommates,
  };

  // Step 1: Get preferred roommates (siblings, best friends)
  if (student.preferredRoommates && student.preferredRoommates.length > 0) {
    const preferredIds = student.preferredRoommates.map(id => id.toString());
    
    const preferred = await Student.find({
      _id: { $in: student.preferredRoommates },
      gender: student.gender, // Must be same gender
      status: 'active',
      $or: [
        { room: { $exists: false } },
        { room: null },
        { temporaryRoom: { $exists: false } },
        { temporaryRoom: null },
      ],
      // Must not be in an active group
      $or: [
        { roommateGroup: { $exists: false } },
        { roommateGroup: null },
      ],
    })
    .populate('preferredRoommates', 'name studentId course year')
    .limit(requiredRoommates);

    // Check if preferred roommates are in active groups
    const validPreferred = [];
    for (const pref of preferred) {
      const activeGroup = await RoommateGroup.findOne({
        members: pref._id,
        status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] },
      });
      
      if (!activeGroup) {
        validPreferred.push(pref);
      }
    }

    result.preferredRoommates = validPreferred.slice(0, requiredRoommates);
  }

  // Step 2: Calculate remaining slots needed
  const slotsFilled = result.preferredRoommates.length;
  const slotsRemaining = Math.max(0, requiredRoommates - slotsFilled);

  // Step 3: Fill remaining slots with AI matches
  if (slotsRemaining > 0) {
    // Get all eligible candidates (same gender, no room, not in active group)
    const eligibleStudents = await Student.find({
      gender: student.gender,
      status: 'active',
      _id: { $ne: student._id }, // Exclude self
      $or: [
        { room: { $exists: false } },
        { room: null },
        { temporaryRoom: { $exists: false } },
        { temporaryRoom: null },
      ],
    }).populate('aiPreferences');

    // Filter out students in active groups
    const candidateIds = eligibleStudents.map(s => s._id.toString());
    const activeGroups = await RoommateGroup.find({
      members: { $in: candidateIds },
      status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] },
    });

    const studentsInActiveGroups = new Set();
    activeGroups.forEach(group => {
      group.members.forEach(memberId => {
        studentsInActiveGroups.add(memberId.toString());
      });
    });

    const availableCandidates = eligibleStudents.filter(
      s => !studentsInActiveGroups.has(s._id.toString()) &&
           !result.preferredRoommates.some(p => p._id.toString() === s._id.toString())
    );

    // Get AI matches for remaining slots
    const aiMatches = findBestMatches(student, availableCandidates, minScore, slotsRemaining);
    result.aiMatches = aiMatches.map(m => m.student);
  }

  result.totalMatches = result.preferredRoommates.length + result.aiMatches.length;

  return result;
};

/**
 * Form a roommate group with preferred roommates and AI matches
 * 
 * @param {Object} student - Group creator
 * @param {String} roomType - 'Double', 'Triple', or 'Quad'
 * @param {Array} selectedRoommateIds - IDs of selected roommates (preferred + AI)
 * @returns {Object} - RoommateGroup object
 */
export const formRoommateGroup = async (student, roomType, selectedRoommateIds = []) => {
  const requiredRoommates = getRequiredRoommates(roomType);
  
  if (selectedRoommateIds.length !== requiredRoommates) {
    throw new Error(`Room type ${roomType} requires exactly ${requiredRoommates} roommate(s), but ${selectedRoommateIds.length} provided`);
  }

  // Validate all selected roommates
  const roommates = await Student.find({
    _id: { $in: selectedRoommateIds },
    gender: student.gender,
    status: 'active',
    $or: [
      { room: { $exists: false } },
      { room: null },
      { temporaryRoom: { $exists: false } },
      { temporaryRoom: null },
    ],
  });

  if (roommates.length !== selectedRoommateIds.length) {
    throw new Error('Some selected roommates are invalid or already have rooms');
  }

  // Check if any are in active groups
  for (const roommate of roommates) {
    const activeGroup = await RoommateGroup.findOne({
      members: roommate._id,
      status: { $in: ['pending', 'confirmed', 'room_selected', 'payment_pending'] },
    });
    
    if (activeGroup) {
      throw new Error(`${roommate.name} is already in an active roommate group`);
    }
  }

  // Create group with all members
  const groupMembers = [student._id, ...selectedRoommateIds];
  
  // Determine formation method
  const preferredIds = student.preferredRoommates?.map(id => id.toString()) || [];
  const hasPreferred = selectedRoommateIds.some(id => preferredIds.includes(id.toString()));
  const hasAIMatches = selectedRoommateIds.some(id => !preferredIds.includes(id.toString()));
  
  let formationMethod = 'manual';
  if (hasPreferred && hasAIMatches) {
    formationMethod = 'mixed';
  } else if (hasPreferred) {
    formationMethod = 'manual';
  } else if (hasAIMatches) {
    formationMethod = 'ai_matched';
  }

  const group = await RoommateGroup.create({
    members: groupMembers,
    createdBy: student._id,
    status: 'pending',
    roomType,
    formationMethod,
  });

  // Update all members' roommateGroup reference
  await Student.updateMany(
    { _id: { $in: groupMembers } },
    { $set: { roommateGroup: group._id } }
  );

  return group;
};

/**
 * Validate room selection for a group
 * Ensures room capacity matches group size and room type
 */
export const validateRoomForGroup = async (groupId, roomId) => {
  const group = await RoommateGroup.findById(groupId).populate('members');
  if (!group) {
    throw new Error('Roommate group not found');
  }

  const Room = (await import('../models/Room.model.js')).default;
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error('Room not found');
  }

  // Validate room capacity matches group size
  if (room.capacity !== group.members.length) {
    throw new Error(`Room capacity (${room.capacity}) does not match group size (${group.members.length})`);
  }

  // Validate room type matches group room type
  if (room.roomType !== group.roomType) {
    throw new Error(`Room type (${room.roomType}) does not match group room type (${group.roomType})`);
  }

  // Validate room gender matches group gender
  const groupGender = group.members[0]?.gender;
  if (room.gender !== groupGender) {
    throw new Error(`Room gender (${room.gender}) does not match group gender (${groupGender})`);
  }

  return { group, room };
};

