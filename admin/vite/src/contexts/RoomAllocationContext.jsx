import { createContext, useContext, useState, useEffect } from 'react';
import studentService from '@/services/studentService';
import useAuth from '@/hooks/useAuth';

const RoomAllocationContext = createContext({
  hasRoom: false,
  loading: true,
  checkRoomAllocation: () => {},
});

export const useRoomAllocation = () => {
  const context = useContext(RoomAllocationContext);
  if (!context) {
    throw new Error('useRoomAllocation must be used within RoomAllocationProvider');
  }
  return context;
};

export const RoomAllocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [hasRoom, setHasRoom] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkRoomAllocation = async () => {
    // Only check room allocation for students
    if (!user || user.role !== 'student') {
      setHasRoom(false);
      setLoading(false);
      return false;
    }

    try {
      setLoading(true);
      // Use profile endpoint instead of dashboard stats - profile doesn't require room allocation
      // This prevents 403 errors when checking room status
      const data = await studentService.getProfile();
      
      if (!data || !data.student) {
        setHasRoom(false);
        return false;
      }
      
      // Check if student has room allocated (confirmed or pending payment)
      const roomAllocated = (data.student.room && data.student.room !== null) || 
                           (data.student.temporaryRoom && data.student.temporaryRoom !== null);
      setHasRoom(roomAllocated);
      return roomAllocated;
    } catch (error) {
      // Only log unexpected errors (not 403/404 for non-students)
      if (error.response?.status !== 404 && error.response?.status !== 403) {
        console.error('Error checking room allocation:', error);
      }
      setHasRoom(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only check room allocation for students
    if (!user || user.role !== 'student') {
      setLoading(false);
      return;
    }

    // Check on mount and when user changes
    let isMounted = true;
    checkRoomAllocation().then(() => {
      if (!isMounted) return;
    });
    
    return () => {
      isMounted = false;
    };
  }, [user?.role, user?._id]); // Added user._id to re-check when user data updates

  return (
    <RoomAllocationContext.Provider value={{ hasRoom, loading, checkRoomAllocation }}>
      {children}
    </RoomAllocationContext.Provider>
  );
};

