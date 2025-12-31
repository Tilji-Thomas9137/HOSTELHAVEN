import { Fragment, useEffect, useRef, useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import OutlinedInput from '@mui/material/OutlinedInput';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import EmptySearch from '@/components/header/empty-state/EmptySearch';
import MainCard from '@/components/MainCard';
import NotificationItem from '@/components/NotificationItem';
import { AvatarSize } from '@/enum';
import { useRouter } from '@/utils/navigation';
import { IconCommand, IconSearch, IconUser, IconDoor, IconCalendar } from '@tabler/icons-react';

import avatar1 from '@/assets/images/users/avatar-1.png';
import avatar2 from '@/assets/images/users/avatar-2.png';

/***************************  HEADER - SEARCH DATA  ***************************/

// Mock hostel data for search
const mockStudents = [
  { id: 1, name: 'John Doe', email: 'john.doe@hostelhaven.com', room: '101A', type: 'student', avatar: avatar1 },
  { id: 2, name: 'Sarah Wilson', email: 'sarah.wilson@hostelhaven.com', room: '205B', type: 'student', avatar: avatar2 },
  { id: 3, name: 'Michael Chen', email: 'michael.chen@hostelhaven.com', room: '305C', type: 'student', avatar: avatar1 },
  { id: 4, name: 'Emily Brown', email: 'emily.brown@hostelhaven.com', room: '202A', type: 'student', avatar: avatar2 }
];

const mockRooms = [
  { id: 1, number: '101A', building: 'Building A', capacity: 2, occupied: 2, type: 'room' },
  { id: 2, number: '205B', building: 'Building B', capacity: 3, occupied: 3, type: 'room' },
  { id: 3, number: '305C', building: 'Building C', capacity: 4, occupied: 2, type: 'room' },
  { id: 4, number: '202A', building: 'Building A', capacity: 2, occupied: 2, type: 'room' }
];

const mockBookings = [
  { id: 1, student: 'John Doe', room: '101A', checkIn: '2024-01-15', status: 'active', type: 'booking' },
  { id: 2, student: 'Sarah Wilson', room: '205B', checkIn: '2024-01-10', status: 'active', type: 'booking' },
  { id: 3, student: 'Michael Chen', room: '305C', checkIn: '2024-01-20', status: 'pending', type: 'booking' }
];

/***************************  HEADER - SEARCH BAR  ***************************/

export default function SearchBar() {
  const theme = useTheme();
  const router = useRouter();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const buttonStyle = { borderRadius: 2, p: 1 };
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEmptySearch, setIsEmptySearch] = useState(true);
  const [isPopperOpen, setIsPopperOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  // Function to open the popper
  const openPopper = (event) => {
    setAnchorEl(inputRef.current);
    setIsPopperOpen(true);
  };

  const handleActionClick = (event) => {
    if (isPopperOpen) {
      // If popper is open, close it
      setIsPopperOpen(false);
      setAnchorEl(null);
    } else {
      openPopper(event);
    }
  };

  const handleInputChange = (event) => {
    const query = event.target.value.trim();
    setSearchQuery(query);
    const isEmpty = query === '';
    setIsEmptySearch(isEmpty);

    if (!isPopperOpen && !isEmpty) {
      openPopper(event);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !isPopperOpen) {
      openPopper(event);
    } else if (event.key === 'Escape' && isPopperOpen) {
      setIsPopperOpen(false);
      setAnchorEl(null);
    } else if (event.ctrlKey && event.key === 'k') {
      event.preventDefault();
      if (!isPopperOpen) {
        openPopper(event);
      }
    }
  };

  const renderSubheader = (title, withMarginTop = false) => (
    <ListSubheader sx={{ color: 'text.disabled', typography: 'caption', py: 0.5, px: 1, mb: 0.5, ...(withMarginTop && { mt: 1.5 }) }}>
      {title}
    </ListSubheader>
  );

  // Filter search results based on query
  const getFilteredResults = () => {
    if (!searchQuery) return { students: [], rooms: [], bookings: [] };

    const query = searchQuery.toLowerCase();
    
    const filteredStudents = mockStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.room.toLowerCase().includes(query)
    );

    const filteredRooms = mockRooms.filter(
      (room) =>
        room.number.toLowerCase().includes(query) ||
        room.building.toLowerCase().includes(query)
    );

    const filteredBookings = mockBookings.filter(
      (booking) =>
        booking.student.toLowerCase().includes(query) ||
        booking.room.toLowerCase().includes(query)
    );

    return { students: filteredStudents, rooms: filteredRooms, bookings: filteredBookings };
  };

  const handleResultClick = (type, item) => {
    setIsPopperOpen(false);
    setAnchorEl(null);
    setSearchQuery('');
    
    // Navigate based on type
    switch (type) {
      case 'student':
        router.push('/app/students');
        break;
      case 'room':
        router.push('/app/rooms');
        break;
      case 'booking':
        router.push('/app/bookings');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        // Check if the search input is not focused before opening the popper
        if (document.activeElement !== inputRef.current) {
          openPopper(event);
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isPopperOpen]);

  return (
    <>
      <OutlinedInput
        inputRef={inputRef}
        value={searchQuery}
        placeholder="Search students, rooms, bookings..."
        startAdornment={
          <InputAdornment position="start">
            <IconSearch />
          </InputAdornment>
        }
        endAdornment={
          <InputAdornment position="end">
            <Stack direction="row" sx={{ gap: 0.25, opacity: 0.8, alignItems: 'center', color: 'grey.600', '& svg': { color: 'inherit' } }}>
              <IconCommand />
              <Typography variant="caption">+ K</Typography>
            </Stack>
          </InputAdornment>
        }
        aria-describedby="Search"
        slotProps={{ input: { 'aria-label': 'search' } }}
        onClick={handleActionClick}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        sx={{ minWidth: { xs: 200, sm: 240 } }}
      />
      <Popper
        placement="bottom"
        id={isPopperOpen ? 'search-action-popper' : undefined}
        open={isPopperOpen}
        anchorEl={anchorEl}
        transition
        popperOptions={{
          modifiers: [{ name: 'offset', options: { offset: [downSM ? 20 : 0, 8] } }]
        }}
      >
        {({ TransitionProps }) => (
          <Fade in={isPopperOpen} {...TransitionProps}>
            <MainCard
              sx={{
                borderRadius: 2,
                boxShadow: theme.customShadows.tooltip,
                width: 1,
                minWidth: { xs: 352, sm: 240 },
                maxWidth: { xs: 352, md: 420 },
                p: 0.5
              }}
            >
              <ClickAwayListener
                onClickAway={() => {
                  setIsPopperOpen(false);
                  setAnchorEl(null);
                }}
              >
                {isEmptySearch ? (
                  <EmptySearch />
                ) : (
                  <List disablePadding sx={{ maxHeight: 400, overflowY: 'auto' }}>
                    {(() => {
                      const results = getFilteredResults();
                      const hasResults = results.students.length > 0 || results.rooms.length > 0 || results.bookings.length > 0;

                      if (!hasResults) {
                        return (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              No results found for "{searchQuery}"
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <>
                          {results.students.length > 0 && (
                            <>
                              {renderSubheader('Students')}
                              {results.students.map((student) => (
                                <ListItemButton
                                  key={student.id}
                                  sx={buttonStyle}
                                  onClick={() => handleResultClick('student', student)}
                                >
                                  <NotificationItem
                                    avatar={{ alt: student.name, src: student.avatar, size: AvatarSize.XS }}
                                    badge={<IconUser size={14} color={theme.palette.text.primary} />}
                                    title={student.name}
                                    subTitle={`Room: ${student.room} • ${student.email}`}
                                  />
                                </ListItemButton>
                              ))}
                            </>
                          )}

                          {results.rooms.length > 0 && (
                            <>
                              {renderSubheader('Rooms', results.students.length > 0)}
                              {results.rooms.map((room) => (
                                <ListItemButton
                                  key={room.id}
                                  sx={buttonStyle}
                                  onClick={() => handleResultClick('room', room)}
                                >
                                  <NotificationItem
                                    avatar={<IconDoor size={16} color={theme.palette.primary.main} />}
                                    title={`Room ${room.number}`}
                                    subTitle={`${room.building} • ${room.occupied}/${room.capacity} Occupied`}
                                  />
                                </ListItemButton>
                              ))}
                            </>
                          )}

                          {results.bookings.length > 0 && (
                            <>
                              {renderSubheader('Bookings', results.students.length > 0 || results.rooms.length > 0)}
                              {results.bookings.map((booking) => (
                                <ListItemButton
                                  key={booking.id}
                                  sx={buttonStyle}
                                  onClick={() => handleResultClick('booking', booking)}
                                >
                                  <NotificationItem
                                    avatar={<IconCalendar size={16} color={theme.palette.primary.main} />}
                                    title={`${booking.student} - Room ${booking.room}`}
                                    subTitle={`Check-in: ${booking.checkIn} • Status: ${booking.status}`}
                                  />
                                </ListItemButton>
                              ))}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </List>
                )}
              </ClickAwayListener>
            </MainCard>
          </Fade>
        )}
      </Popper>
    </>
  );
}
