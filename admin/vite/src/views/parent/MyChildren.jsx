import { useState, useEffect } from 'react';

// @mui
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// @project
import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import parentService from '@/services/parentService';
import { useSnackbar } from 'notistack';

// @icons
import { IconUsers, IconUser, IconDoor, IconMail, IconPhone, IconId, IconSchool, IconCurrencyDollar, IconHome } from '@tabler/icons-react';

/***************************  MY CHILDREN PAGE  ***************************/

export default function MyChildrenPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const data = await parentService.getChildren();
      setChildren(Array.isArray(data) ? data : []);
      if (data && data.length > 0 && !selectedChild) {
        setSelectedChild(data[0]);
      }
    } catch (err) {
      console.error('Fetch children error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load children', { variant: 'error' });
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleChildSelect = async (childId) => {
    try {
      const child = await parentService.getChildById(childId);
      setSelectedChild(child);
      setValue(1); // Switch to Child Profile tab
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load child details', { variant: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'graduated':
        return 'info';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <ComponentsWrapper title="My Children">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </ComponentsWrapper>
    );
  }

  return (
    <ComponentsWrapper title="My Children">
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Child List" icon={<IconUsers size={18} />} iconPosition="start" />
            <Tab label="Child Profile" icon={<IconUser size={18} />} iconPosition="start" disabled={!selectedChild} />
          </Tabs>
        </Box>

        {/* Child List Tab */}
        <TabPanel value={value} index={0}>
          <PresentationCard>
            {children.length === 0 ? (
              <Alert severity="info">No children found. Please contact administrator if you believe this is an error.</Alert>
            ) : (
              <Grid container spacing={3}>
                {children.map((child) => (
                  <Grid item xs={12} sm={6} md={4} key={child._id}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 3,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                        border: selectedChild?._id === child._id ? 2 : 1,
                        borderColor: selectedChild?._id === child._id ? 'primary.main' : 'divider'
                      }}
                      onClick={() => handleChildSelect(child._id)}
                    >
                      <Stack spacing={2} alignItems="center">
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                          <IconUser size={40} />
                        </Avatar>
                        <Stack spacing={0.5} alignItems="center">
                          <Typography variant="h6" fontWeight={600}>
                            {child.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {child.studentId}
                          </Typography>
                          <Chip
                            label={getStatusLabel(child.status)}
                            color={getStatusColor(child.status)}
                            size="small"
                            sx={{ mt: 1, fontWeight: child.status === 'suspended' ? 600 : 400 }}
                          />
                          {child.status === 'suspended' && (
                            <Alert severity="error" sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}>
                              This account has been suspended
                            </Alert>
                          )}
                        </Stack>
                        {child.room && (
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <IconDoor size={16} />
                            <Typography variant="body2">
                              Room {child.room.roomNumber} - {child.room.building}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </PresentationCard>
        </TabPanel>

        {/* Child Profile Tab */}
        <TabPanel value={value} index={1}>
          {selectedChild ? (
            <PresentationCard>
              {selectedChild.status === 'suspended' && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Account Suspended
                  </Typography>
                  <Typography variant="body2">
                    Your child's account has been suspended. Please contact the administrator for more information.
                  </Typography>
                </Alert>
              )}
              <Grid container spacing={3}>
                {/* Personal Details */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Personal Details</Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconUser size={20} />
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Name</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.name}</Typography>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconId size={20} />
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Student ID</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.studentId}</Typography>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconMail size={20} />
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.email || 'N/A'}</Typography>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconPhone size={20} />
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.phone || 'N/A'}</Typography>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack spacing={1}>
                          <Typography variant="caption" color="text.secondary">Status</Typography>
                          <Chip
                            label={getStatusLabel(selectedChild.status)}
                            color={getStatusColor(selectedChild.status)}
                            size="medium"
                            sx={{ fontWeight: selectedChild.status === 'suspended' ? 600 : 400 }}
                          />
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>

                {/* Academic Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Academic Information</Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconSchool size={20} />
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Course</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.course || 'N/A'}</Typography>
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <IconSchool size={20} />
                        <Stack>
                          <Typography variant="caption" color="text.secondary">Year</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.year || 'N/A'}</Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid>

                {/* Hostel Details */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Hostel Details</Typography>
                    {selectedChild.room ? (
                      <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">Room Number</Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {selectedChild.room.roomNumber || 'N/A'}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">Floor</Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {selectedChild.room.floor !== null && selectedChild.room.floor !== undefined 
                                ? (selectedChild.room.floor === 0 
                                    ? 'Ground Floor' 
                                    : `${selectedChild.room.floor}${selectedChild.room.floor === 1 ? 'st' : selectedChild.room.floor === 2 ? 'nd' : selectedChild.room.floor === 3 ? 'rd' : 'th'} Floor`)
                                : 'N/A'}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">Building</Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {selectedChild.room.building || 'N/A'}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">Capacity</Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {selectedChild.room.capacity || 'N/A'}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    ) : (
                      <Alert severity="info" sx={{ mt: 2 }}>No room allocated yet</Alert>
                    )}
                  </Card>
                </Grid>

                {/* Wallet Balance */}
                {selectedChild.walletBalance !== undefined && selectedChild.walletBalance !== null && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 3, bgcolor: selectedChild.walletBalance > 0 ? 'success.lighter' : 'grey.50' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <IconCurrencyDollar size={24} color={selectedChild.walletBalance > 0 ? 'green' : 'gray'} />
                          <Stack>
                            <Typography variant="caption" color="text.secondary">Wallet Balance</Typography>
                            <Typography variant="h5" fontWeight={600} color={selectedChild.walletBalance > 0 ? 'success.main' : 'text.secondary'}>
                              ₹{selectedChild.walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedChild.walletBalance > 0 ? 'Available for future payments' : 'No balance'}
                            </Typography>
                          </Stack>
                        </Stack>
                        {selectedChild.walletBalance > 0 && (
                          <Chip label="Credit Available" color="success" size="small" />
                        )}
                      </Stack>
                    </Card>
                  </Grid>
                )}

                {/* Room Change Request */}
                {selectedChild.pendingRoomChangeRequest && (
                  <Grid item xs={12}>
                    <Alert 
                      severity={
                        selectedChild.pendingRoomChangeRequest.status === 'pending_payment' 
                          ? 'warning' 
                          : selectedChild.pendingRoomChangeRequest.status === 'approved' 
                            ? 'success' 
                            : 'info'
                      }
                      icon={<IconHome />}
                    >
                      <Stack spacing={1.5}>
                        <Typography variant="h6" fontWeight={600}>
                          Room Change Request - {selectedChild.pendingRoomChangeRequest.status.replace(/_/g, ' ').toUpperCase()}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Current Room</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedChild.pendingRoomChangeRequest.currentRoom?.roomNumber} ({selectedChild.pendingRoomChangeRequest.currentRoom?.roomType})
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Requested Room</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {selectedChild.pendingRoomChangeRequest.requestedRoom?.roomNumber} ({selectedChild.pendingRoomChangeRequest.requestedRoom?.roomType})
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Price Difference</Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={600}
                              color={selectedChild.pendingRoomChangeRequest.priceDifference > 0 ? 'error.main' : selectedChild.pendingRoomChangeRequest.priceDifference < 0 ? 'success.main' : 'text.primary'}
                            >
                              {selectedChild.pendingRoomChangeRequest.priceDifference > 0 ? '+' : ''}
                              ₹{Math.abs(selectedChild.pendingRoomChangeRequest.priceDifference).toLocaleString('en-IN')}
                              {selectedChild.pendingRoomChangeRequest.priceDifference > 0 && ' (Upgrade)'}
                              {selectedChild.pendingRoomChangeRequest.priceDifference < 0 && ' (Downgrade)'}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Payment/Credit Information */}
                        {selectedChild.pendingRoomChangeRequest.upgradePaymentRequired > 0 && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <Stack spacing={0.5}>
                              {selectedChild.pendingRoomChangeRequest.alreadyPaidAmount > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  Already Paid for Current Room: ₹{selectedChild.pendingRoomChangeRequest.alreadyPaidAmount.toLocaleString('en-IN')}
                                </Typography>
                              )}
                              <Typography variant="body2" fontWeight={600}>
                                Remaining Payment Required: ₹{selectedChild.pendingRoomChangeRequest.upgradePaymentRequired.toLocaleString('en-IN')}
                              </Typography>
                              <Typography variant="caption">
                                Your child needs to complete this payment to proceed with the room upgrade.
                              </Typography>
                            </Stack>
                          </Alert>
                        )}

                        {selectedChild.pendingRoomChangeRequest.downgradeWalletCredit > 0 && (
                          <Alert severity="success" sx={{ mt: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              Wallet Credit: ₹{selectedChild.pendingRoomChangeRequest.downgradeWalletCredit.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption">
                              {selectedChild.pendingRoomChangeRequest.status === 'approved' 
                                ? 'This amount has been credited to your child\'s wallet and can be used for future payments (mess fees, hostel fees, etc.).'
                                : 'This amount will be credited to your child\'s wallet upon approval and can be used for future payments (mess fees, hostel fees, etc.).'}
                            </Typography>
                          </Alert>
                        )}

                        {/* Reason */}
                        {selectedChild.pendingRoomChangeRequest.reason && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Reason</Typography>
                            <Typography variant="body2">{selectedChild.pendingRoomChangeRequest.reason}</Typography>
                          </Box>
                        )}

                        {/* Submitted Date */}
                        <Typography variant="caption" color="text.secondary">
                          Submitted on: {new Date(selectedChild.pendingRoomChangeRequest.createdAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </Typography>
                      </Stack>
                    </Alert>
                  </Grid>
                )}

                {/* Contact Details */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Contact Details</Typography>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">Email</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.email || 'N/A'}</Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">Phone</Typography>
                          <Typography variant="body1" fontWeight={500}>{selectedChild.phone || 'N/A'}</Typography>
                        </Stack>
                      </Grid>
                      {selectedChild.address && (
                        <Grid item xs={12}>
                          <Stack spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">Address</Typography>
                            <Typography variant="body1" fontWeight={500}>{selectedChild.address}</Typography>
                          </Stack>
                        </Grid>
                      )}
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            </PresentationCard>
          ) : (
            <PresentationCard>
              <Alert severity="info">Please select a child from the Child List tab to view their profile.</Alert>
            </PresentationCard>
          )}
        </TabPanel>
      </Box>
    </ComponentsWrapper>
  );
}

