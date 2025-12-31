/**
 * Utility to handle room allocation errors and prevent duplicate toasts
 */

const ROOM_ALLOCATION_ERROR_KEY = 'roomAllocationErrorShown';
const ROOM_ALLOCATION_MESSAGE = 'You can access this feature after your room is allocated.';

/**
 * Check if error is a room allocation error
 */
export const isRoomAllocationError = (error) => {
  return error?.response?.status === 403 && 
         (error?.response?.data?.message?.includes('room is allocated') ||
          error?.response?.data?.message?.includes('Room allocation'));
};

/**
 * Check if room allocation error toast was already shown in this session
 */
export const hasShownRoomAllocationError = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ROOM_ALLOCATION_ERROR_KEY) === 'true';
};

/**
 * Mark that room allocation error toast was shown
 */
export const markRoomAllocationErrorShown = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ROOM_ALLOCATION_ERROR_KEY, 'true');
  }
};

/**
 * Clear the room allocation error flag (e.g., when room is allocated)
 */
export const clearRoomAllocationErrorFlag = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ROOM_ALLOCATION_ERROR_KEY);
  }
};

/**
 * Should show toast for room allocation error?
 * Returns false if already shown in this session
 */
export const shouldShowRoomAllocationError = (error) => {
  if (!isRoomAllocationError(error)) {
    return false;
  }
  
  // Don't show toast if already shown in this session
  if (hasShownRoomAllocationError()) {
    return false;
  }
  
  // Mark as shown
  markRoomAllocationErrorShown();
  return true;
};

