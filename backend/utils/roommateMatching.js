/**
 * AI-based Roommate Matching Algorithm
 * Matches students based on personality attributes and preferences
 */

/**
 * Calculate compatibility score between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {number} Compatibility score (0-100)
 */
export const calculateCompatibilityScore = (student1, student2) => {
  let score = 0;
  let factors = 0;

  const prefs1 = student1.personalityAttributes || {};
  const prefs2 = student2.personalityAttributes || {};
  const aiPrefs1 = student1.aiPreferences || {};
  const aiPrefs2 = student2.aiPreferences || {};

  // 1. Sleeping Habits (20 points)
  if (prefs1.sleepingHabits && prefs2.sleepingHabits) {
    factors++;
    if (prefs1.sleepingHabits === prefs2.sleepingHabits) {
      score += 20;
    } else {
      score += 5; // Partial match
    }
  } else if (aiPrefs1.sleepSchedule && aiPrefs2.sleepSchedule) {
    factors++;
    // Compare sleep schedules (simplified)
    const schedule1 = aiPrefs1.sleepSchedule.toLowerCase();
    const schedule2 = aiPrefs2.sleepSchedule.toLowerCase();
    if (schedule1 === schedule2) {
      score += 20;
    } else if (
      (schedule1.includes('early') && schedule2.includes('early')) ||
      (schedule1.includes('late') && schedule2.includes('late'))
    ) {
      score += 15;
    } else {
      score += 5;
    }
  }

  // 2. Study Preference (20 points)
  if (prefs1.studyPreference && prefs2.studyPreference) {
    factors++;
    if (prefs1.studyPreference === prefs2.studyPreference) {
      score += 20;
    } else {
      score += 8;
    }
  } else if (aiPrefs1.studyHabits && aiPrefs2.studyHabits) {
    factors++;
    const habits1 = aiPrefs1.studyHabits.toLowerCase();
    const habits2 = aiPrefs2.studyHabits.toLowerCase();
    if (habits1 === habits2) {
      score += 20;
    } else if (
      (habits1.includes('quiet') && habits2.includes('quiet')) ||
      (habits1.includes('group') && habits2.includes('group'))
    ) {
      score += 15;
    } else {
      score += 8;
    }
  }

  // 3. Cleanliness Level (15 points)
  if (prefs1.cleanlinessLevel && prefs2.cleanlinessLevel) {
    factors++;
    const diff = Math.abs(
      ['low', 'medium', 'high'].indexOf(prefs1.cleanlinessLevel) -
      ['low', 'medium', 'high'].indexOf(prefs2.cleanlinessLevel)
    );
    if (diff === 0) {
      score += 15;
    } else if (diff === 1) {
      score += 10;
    } else {
      score += 3;
    }
  } else if (aiPrefs1.cleanliness && aiPrefs2.cleanliness) {
    factors++;
    const diff = Math.abs(aiPrefs1.cleanliness - aiPrefs2.cleanliness);
    if (diff === 0) {
      score += 15;
    } else if (diff <= 2) {
      score += 12;
    } else if (diff <= 4) {
      score += 8;
    } else {
      score += 3;
    }
  }

  // 4. Noise Tolerance (15 points)
  if (prefs1.noiseTolerance && prefs2.noiseTolerance) {
    factors++;
    if (prefs1.noiseTolerance === prefs2.noiseTolerance) {
      score += 15;
    } else {
      const diff = Math.abs(
        ['low', 'medium', 'high'].indexOf(prefs1.noiseTolerance) -
        ['low', 'medium', 'high'].indexOf(prefs2.noiseTolerance)
      );
      if (diff === 1) {
        score += 10;
      } else {
        score += 3;
      }
    }
  } else if (aiPrefs1.noiseTolerance && aiPrefs2.noiseTolerance) {
    factors++;
    const diff = Math.abs(aiPrefs1.noiseTolerance - aiPrefs2.noiseTolerance);
    if (diff === 0) {
      score += 15;
    } else if (diff <= 2) {
      score += 12;
    } else if (diff <= 4) {
      score += 8;
    } else {
      score += 3;
    }
  }

  // 5. Sociability/Lifestyle (10 points)
  if (prefs1.sociability && prefs2.sociability) {
    factors++;
    if (prefs1.sociability === prefs2.sociability) {
      score += 10;
    } else {
      // Introvert-Extrovert can work, but ambivert is flexible
      if (
        prefs1.sociability === 'ambivert' ||
        prefs2.sociability === 'ambivert'
      ) {
        score += 8;
      } else {
        score += 5;
      }
    }
  } else if (aiPrefs1.lifestyle && aiPrefs2.lifestyle) {
    factors++;
    const lifestyle1 = aiPrefs1.lifestyle.toLowerCase();
    const lifestyle2 = aiPrefs2.lifestyle.toLowerCase();
    
    // Exact match
    if (lifestyle1 === lifestyle2) {
      score += 10;
    } else {
      // Check for similar lifestyles
      const quietTerms = ['quiet', 'reserved', 'introvert'];
      const socialTerms = ['social', 'outgoing', 'extrovert', 'party'];
      const balancedTerms = ['balanced', 'ambivert', 'moderate'];
      
      const isQuiet1 = quietTerms.some(term => lifestyle1.includes(term));
      const isQuiet2 = quietTerms.some(term => lifestyle2.includes(term));
      const isSocial1 = socialTerms.some(term => lifestyle1.includes(term));
      const isSocial2 = socialTerms.some(term => lifestyle2.includes(term));
      const isBalanced1 = balancedTerms.some(term => lifestyle1.includes(term));
      const isBalanced2 = balancedTerms.some(term => lifestyle2.includes(term));
      
      if ((isQuiet1 && isQuiet2) || (isSocial1 && isSocial2)) {
        score += 8;
      } else if (isBalanced1 || isBalanced2) {
        score += 7;
      } else {
        score += 5;
      }
    }
  }

  // 6. AC/Fan Preference (10 points)
  if (prefs1.acFanPreference && prefs2.acFanPreference) {
    factors++;
    if (prefs1.acFanPreference === prefs2.acFanPreference) {
      score += 10;
    } else if (prefs1.acFanPreference === 'both' || prefs2.acFanPreference === 'both') {
      score += 7;
    } else {
      score += 2;
    }
  }

  // 7. Course/Year Similarity (10 points)
  if (student1.course && student2.course && student1.course === student2.course) {
    score += 5;
  }
  if (student1.year && student2.year && student1.year === student2.year) {
    score += 5;
  }

  // Normalize score based on available factors
  if (factors > 0) {
    // Calculate maximum possible score based on factors
    const maxPossibleScore = factors * 20; // Each factor can contribute up to 20 points
    score = Math.min(100, Math.round((score / maxPossibleScore) * 100));
  } else {
    // If no preferences available, give a base score (but lower to encourage preference setting)
    score = 30;
  }

  return score;
};

/**
 * Find best roommate matches for a student
 * @param {Object} student - Student to find matches for
 * @param {Array} candidateStudents - Array of candidate students
 * @param {number} minScore - Minimum compatibility score (default: 50)
 * @param {number} maxResults - Maximum number of results (default: 10)
 * @returns {Array} Array of matched students with scores, sorted by score
 */
export const findBestMatches = (student, candidateStudents, minScore = 50, maxResults = 10) => {
  const matches = candidateStudents
    .filter(candidate => {
      // Exclude self
      if (candidate._id.toString() === student._id.toString()) {
        return false;
      }
      // Must have same gender
      if (candidate.gender !== student.gender) {
        return false;
      }
      // Must be active
      if (candidate.status !== 'active') {
        return false;
      }
      // Must not have a room already (confirmed or temporary)
      if (candidate.room || candidate.temporaryRoom) {
        return false;
      }
      return true;
    })
    .map(candidate => ({
      student: candidate,
      score: calculateCompatibilityScore(student, candidate),
    }))
    .filter(match => match.score >= minScore && match.score <= 100) // Only 50-100% matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return matches;
};

/**
 * Form roommate groups using AI matching
 * @param {Array} students - Array of students to match
 * @param {number} roomCapacity - Capacity of the room (e.g., 2 for Double)
 * @param {number} minGroupScore - Minimum average score for a group (default: 50)
 * @returns {Array} Array of matched groups
 */
export const formRoommateGroups = (students, roomCapacity, minGroupScore = 50) => {
  const groups = [];
  const usedStudents = new Set();

  // Sort students by number of preferences (more preferences = better matching)
  // Consider both personalityAttributes and aiPreferences
  const sortedStudents = [...students].sort((a, b) => {
    const prefsA = Object.keys(a.personalityAttributes || {}).filter(k => a.personalityAttributes[k] !== null).length +
                   Object.keys(a.aiPreferences || {}).filter(k => a.aiPreferences[k] !== null).length;
    const prefsB = Object.keys(b.personalityAttributes || {}).filter(k => b.personalityAttributes[k] !== null).length +
                   Object.keys(b.aiPreferences || {}).filter(k => b.aiPreferences[k] !== null).length;
    return prefsB - prefsA;
  });

  for (const student of sortedStudents) {
    if (usedStudents.has(student._id.toString())) {
      continue;
    }

    const group = [student];
    usedStudents.add(student._id.toString());

    // Find compatible roommates
    const candidates = sortedStudents.filter(s => 
      !usedStudents.has(s._id.toString()) &&
      s.gender === student.gender &&
      s.status === 'active' &&
      !s.room &&
      !s.temporaryRoom
    );

    if (candidates.length === 0) {
      // Single student group (for Single rooms)
      if (roomCapacity === 1) {
        groups.push({
          students: group,
          averageScore: 100, // Perfect match for single
          scores: {},
        });
      }
      continue;
    }

    // Find best matches
    const matches = findBestMatches(student, candidates, minGroupScore, roomCapacity - 1);

    // Add matches to group
    for (const match of matches) {
      if (group.length < roomCapacity) {
        group.push(match.student);
        usedStudents.add(match.student._id.toString());
      }
    }

    // Calculate average compatibility score for the group
    let totalScore = 0;
    let pairCount = 0;
    const scores = {};

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const score = calculateCompatibilityScore(group[i], group[j]);
        totalScore += score;
        pairCount++;
        scores[`${group[i]._id}-${group[j]._id}`] = score;
      }
    }

    const averageScore = pairCount > 0 ? totalScore / pairCount : 100;

    // Only add groups with average score between 50-100%
    if ((averageScore >= minGroupScore && averageScore <= 100) || group.length === 1) {
      groups.push({
        students: group,
        averageScore: Math.round(averageScore),
        scores,
      });
    }
  }

  return groups;
};

