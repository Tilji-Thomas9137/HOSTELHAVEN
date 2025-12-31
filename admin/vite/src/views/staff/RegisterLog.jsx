import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';

import { IconQrcode, IconCameraRotate, IconCamera } from '@tabler/icons-react';

import ComponentsWrapper from '@/components/ComponentsWrapper';
import PresentationCard from '@/components/cards/PresentationCard';
import TabPanel from '@/components/TabPanel';
import staffService from '@/services/staffService';
import { useSnackbar } from 'notistack';

export default function StaffRegisterLog() {
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState('register');
  const [loading, setLoading] = useState(false);
  const [vendorLogs, setVendorLogs] = useState([]);
  const [manualEntry, setManualEntry] = useState({
    name: '',
    type: 'Visitor',
    direction: 'IN',
    purpose: '',
    admissionNumber: '',
    action: 'exit'
  });
  const [studentDetails, setStudentDetails] = useState(null);
  const [fetchingStudent, setFetchingStudent] = useState(false);
  const [studentVisitorLogs, setStudentVisitorLogs] = useState([]);
  const [loadingStudentVisitors, setLoadingStudentVisitors] = useState(false);
  const [studentVisitorForm, setStudentVisitorForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorEmail: '',
    relation: '',
    studentId: '',
    purpose: 'visit',
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [currentCameraId, setCurrentCameraId] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const scannerRef = useRef(null);
  const qrCodeRegionId = 'qr-reader';

  useEffect(() => {
    if (tab === 'register') {
      fetchVendorLogs();
    } else if (tab === 'student-visitors') {
      fetchStudentVisitorLogs();
    }
  }, [tab]);

  // Cleanup QR scanner when dialog closes
  useEffect(() => {
    if (!qrScannerOpen && scannerRef.current) {
      stopScanner();
    }
    return () => {
      if (scannerRef.current) {
        stopScanner();
      }
    };
  }, [qrScannerOpen]);

  const fetchVendorLogs = async () => {
    try {
      setLoading(true);
      // Fetch visitor logs and filter for vendors only (non-student entries)
      const data = await staffService.getVisitorLogs();
      // Filter to show only vendor/visitor entries (not student-related)
      const vendorEntries = Array.isArray(data) ? data.filter(log => !log.student || log.purpose === 'maintenance' || log.purpose === 'delivery') : [];
      setVendorLogs(vendorEntries);
    } catch (err) {
      console.error('Failed to fetch vendor logs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load register log', { variant: 'error' });
      setVendorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentVisitorLogs = async () => {
    try {
      setLoadingStudentVisitors(true);
      const logs = await staffService.getStudentVisitorLogs({ limit: 100 });
      setStudentVisitorLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching student visitor logs:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load student visitor logs', { variant: 'error' });
    } finally {
      setLoadingStudentVisitors(false);
    }
  };

  const handleCreateStudentVisitor = async () => {
    if (!studentVisitorForm.visitorName || !studentVisitorForm.visitorPhone || !studentVisitorForm.studentId) {
      enqueueSnackbar('Please fill in visitor name, phone, and student ID', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      await staffService.createStudentVisitorLog({
        visitorName: studentVisitorForm.visitorName.trim(),
        visitorPhone: studentVisitorForm.visitorPhone.trim(),
        visitorEmail: studentVisitorForm.visitorEmail?.trim(),
        relation: studentVisitorForm.relation?.trim(),
        admissionNumber: studentVisitorForm.studentId.trim(),
        purpose: studentVisitorForm.purpose,
        remarks: studentVisitorForm.remarks?.trim(),
      });
      enqueueSnackbar('Student visitor logged successfully', { variant: 'success' });
      setStudentVisitorForm({
        visitorName: '',
        visitorPhone: '',
        visitorEmail: '',
        relation: '',
        studentId: '',
        purpose: 'visit',
        remarks: ''
      });
      fetchStudentVisitorLogs();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to log student visitor', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutStudentVisitor = async (visitorId) => {
    try {
      await staffService.checkoutStudentVisitor(visitorId);
      enqueueSnackbar('Visitor checked out successfully', { variant: 'success' });
      fetchStudentVisitorLogs();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to checkout visitor', { variant: 'error' });
    }
  };

  const handleManualEntry = async () => {
    if (!manualEntry.name.trim()) {
      enqueueSnackbar('Please enter a name', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      // Create vendor log entry
      await staffService.logVisitor({
        visitorName: manualEntry.name,
        visitorPhone: '',
        type: manualEntry.type,
        purpose: manualEntry.purpose,
        remarks: manualEntry.purpose,
        direction: manualEntry.direction,
      });
      enqueueSnackbar('Entry logged successfully', { variant: 'success' });
      setManualEntry({ name: '', type: 'Visitor', direction: 'IN', purpose: '' });
      fetchVendorLogs();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to log entry', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleScanQR = async () => {
    setQrScannerOpen(true);
    setScanning(true);
    setCameraError(null);
    
    // Start scanner after dialog content is rendered
    setTimeout(() => {
      // Check if element exists before starting
      const element = document.getElementById(qrCodeRegionId);
      if (element) {
        startScanner();
      } else {
        // Retry after a bit more time if element not found
        setTimeout(() => {
          const retryElement = document.getElementById(qrCodeRegionId);
          if (retryElement) {
            startScanner();
          } else {
            setCameraError('Unable to initialize scanner. Please try again.');
            setScanning(false);
          }
        }, 200);
      }
    }, 300);
  };

  const startScanner = async () => {
    try {
      setScanning(true);
      setCameraError(null);
      
      // Verify element exists before initializing
      const element = document.getElementById(qrCodeRegionId);
      if (!element) {
        throw new Error('Scanner element not found. Please try closing and reopening the scanner.');
      }
      
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      // Get available cameras
      let devices;
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (err) {
        // Handle permission denied or no cameras
        if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else if (err.name === 'NotFoundError' || err.message?.includes('No cameras')) {
          throw new Error('No camera found on this device.');
        } else {
          throw new Error('Unable to access camera. Please check your browser permissions and ensure you are using HTTPS or localhost.');
        }
      }
      
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        
        // Try to use back camera first (usually better for scanning)
        let cameraId = devices[0].id;
        let backCamera = null;
        
        // Method 1: Check device label for back/rear/environment keywords
        backCamera = devices.find(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || 
                 label.includes('rear') || 
                 label.includes('environment') ||
                 label.includes('rear-facing') ||
                 label.includes('back-facing') ||
                 label.includes('external');
        });
        
        // Method 2: Try to get facingMode from MediaDevices API
        if (!backCamera && devices.length > 1) {
          try {
            // Try each camera to check facingMode
            for (const device of devices) {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                  video: { deviceId: { exact: device.id } } 
                });
                const track = stream.getVideoTracks()[0];
                const settings = track.getSettings();
                track.stop();
                
                if (settings.facingMode === 'environment') {
                  backCamera = device;
                  break;
                }
              } catch (e) {
                // Continue to next camera
                continue;
              }
            }
          } catch (e) {
            // If we can't check facingMode, continue with label-based detection
          }
        }
        
        // Method 3: On mobile, if we have 2+ cameras and first is front-facing, use second
        if (!backCamera && devices.length >= 2) {
          const firstLabel = (devices[0].label || '').toLowerCase();
          if (firstLabel.includes('front') || 
              firstLabel.includes('user') || 
              firstLabel.includes('facing') ||
              firstLabel.includes('integrated')) {
            backCamera = devices[1]; // Second camera is likely back camera
          }
        }
        
        if (backCamera) {
          cameraId = backCamera.id;
        }
        setCurrentCameraId(cameraId);
        
        try {
          await html5QrCode.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Success callback
              handleQRScan(decodedText);
            },
            (errorMessage) => {
              // Error callback - ignore, scanner will keep trying
              // console.log('QR scan error:', errorMessage);
            }
          );
          setScanning(false);
        } catch (startError) {
          // If starting fails, try with the first camera
          if (cameraId !== devices[0].id) {
            const fallbackCameraId = devices[0].id;
            setCurrentCameraId(fallbackCameraId);
            await html5QrCode.start(
              fallbackCameraId,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
              },
              (decodedText) => {
                handleQRScan(decodedText);
              },
              () => {}
            );
            setScanning(false);
          } else {
            throw startError;
          }
        }
      } else {
        throw new Error('No cameras found on this device.');
      }
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      let errorMessage = 'Failed to access camera. ';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check permissions and ensure you are using HTTPS or localhost.';
      }
      
      setCameraError(errorMessage);
      setScanning(false);
      
      // Clean up on error
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop().catch(() => {});
          await scannerRef.current.clear().catch(() => {});
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    }
  };

  const handleQRScan = async (qrData) => {
    try {
      // Stop scanner immediately to prevent multiple scans
      await stopScanner();
      setScanning(true);
      
      const data = JSON.parse(qrData);
      
      if (data.type !== 'outpass') {
        enqueueSnackbar('Invalid QR code. Please scan a valid outpass QR code.', { variant: 'error' });
        setQrScannerOpen(false);
        return;
      }

      // Call API to scan and log student exit/return
      const result = await staffService.scanOutpassQR({ outpassId: data.outpassId });
      const action = result.action || 'exit';
      enqueueSnackbar(
        action === 'exit' 
          ? 'Student exit logged successfully' 
          : 'Student return logged successfully', 
        { variant: 'success' }
      );
      setQrScannerOpen(false);
      fetchVendorLogs();
    } catch (err) {
      console.error('QR scan error:', err);
      if (err.response?.data?.message) {
        enqueueSnackbar(err.response.data.message, { variant: 'error' });
      } else if (err.message && err.message.includes('JSON')) {
        enqueueSnackbar('Invalid QR code format. Please scan a valid outpass QR code.', { variant: 'error' });
      } else {
        enqueueSnackbar('Failed to process QR code', { variant: 'error' });
      }
      // Restart scanner on error
      setTimeout(() => {
        startScanner();
      }, 1000);
    }
  };

  const fetchStudentDetails = async (admissionNumber) => {
    if (!admissionNumber?.trim()) {
      setStudentDetails(null);
      return;
    }

    // Don't fetch if admission number is too short (less than 3 characters)
    // This prevents unnecessary API calls while user is typing
    if (admissionNumber.trim().length < 3) {
      setStudentDetails(null);
      return;
    }

    try {
      setFetchingStudent(true);
      const result = await staffService.getStudentByAdmissionNumber(admissionNumber.trim());
      setStudentDetails(result);
    } catch (err) {
      console.error('Error fetching student details:', err);
      // If student exists but no outpass, show student info
      if (err.response?.status === 404 && err.response?.data?.student) {
        setStudentDetails({
          student: err.response.data.student,
          outpass: null,
        });
      } else {
        setStudentDetails(null);
        // Only show error if it's not a 404 (student not found is expected while typing)
        if (err.response?.status !== 404) {
          enqueueSnackbar(err.response?.data?.message || 'Failed to fetch student details', { variant: 'error' });
        }
      }
    } finally {
      setFetchingStudent(false);
    }
  };

  const handleAdmissionNumberChange = (value) => {
    setManualEntry({ ...manualEntry, admissionNumber: value });
    // Debounce the fetch
    if (value.trim()) {
      setTimeout(() => {
        fetchStudentDetails(value);
      }, 500);
    } else {
      setStudentDetails(null);
    }
  };

  const handleManualStudentEntry = async () => {
    if (!manualEntry.admissionNumber?.trim()) {
      enqueueSnackbar('Please enter admission number', { variant: 'warning' });
      return;
    }

    if (!studentDetails || !studentDetails.outpass) {
      enqueueSnackbar('No approved outpass found for this student', { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const result = await staffService.manualStudentExit({
        admissionNumber: manualEntry.admissionNumber.trim(),
        action: manualEntry.action,
      });
      enqueueSnackbar(
        result.action === 'exit' 
          ? 'Student exit logged successfully' 
          : 'Student return logged successfully', 
        { variant: 'success' }
      );
      setManualEntry({ ...manualEntry, admissionNumber: '' });
      setStudentDetails(null);
      fetchVendorLogs();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to log student entry', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseScanner = async () => {
    await stopScanner();
    setQrScannerOpen(false);
    setCameraError(null);
    setScanning(false);
    setCurrentCameraId(null);
    setAvailableCameras([]);
  };

  const switchCamera = async () => {
    if (availableCameras.length < 2) {
      enqueueSnackbar('Only one camera available', { variant: 'info' });
      return;
    }

    try {
      await stopScanner();
      setScanning(true);
      setCameraError(null);

      // Find the other camera
      const currentIndex = availableCameras.findIndex(cam => cam.id === currentCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCameraId = availableCameras[nextIndex].id;

      setCurrentCameraId(nextCameraId);
      
      // Restart scanner with new camera
      setTimeout(() => {
        startScannerWithCamera(nextCameraId);
      }, 100);
    } catch (err) {
      console.error('Error switching camera:', err);
      enqueueSnackbar('Failed to switch camera', { variant: 'error' });
      setScanning(false);
    }
  };

  const startScannerWithCamera = async (cameraId) => {
    try {
      setScanning(true);
      setCameraError(null);
      
      const element = document.getElementById(qrCodeRegionId);
      if (!element) {
        throw new Error('Scanner element not found. Please try closing and reopening the scanner.');
      }
      
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQRScan(decodedText);
        },
        (errorMessage) => {
          // Error callback - ignore, scanner will keep trying
        }
      );
      setScanning(false);
    } catch (err) {
      console.error('Error starting scanner with camera:', err);
      setCameraError(err.message || 'Failed to start camera');
      setScanning(false);
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop().catch(() => {});
          await scannerRef.current.clear().catch(() => {});
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    }
  };

  return (
    <ComponentsWrapper title="Register Log">
      <PresentationCard>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
            <Tab value="register" label="Vendor In/Out Register" />
            <Tab value="manual" label="Manual Entry Log" />
            <Tab value="scan" label="Scan Student QR" />
            <Tab value="student-visitors" label="Student Visitors" />
          </Tabs>

          <TabPanel value={tab} index="register">
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : vendorLogs.length === 0 ? (
              <Alert severity="info">No vendor entries found.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Purpose</strong></TableCell>
                      <TableCell><strong>Direction</strong></TableCell>
                      <TableCell><strong>IN Time</strong></TableCell>
                      <TableCell><strong>OUT Time</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendorLogs.map((entry) => (
                      <TableRow key={entry._id} hover>
                        <TableCell>{entry.vendorName || entry.visitorName || entry.name || 'N/A'}</TableCell>
                        <TableCell>
                          {entry.type || 
                           (entry.purpose === 'maintenance' ? 'Maintenance' :
                            entry.purpose === 'delivery' ? 'Delivery' :
                            entry.purpose === 'official' ? 'Official' : 'Visitor')}
                        </TableCell>
                        <TableCell>{entry.remarks || entry.purpose || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={entry.outTime ? 'OUT' : 'IN'}
                            size="small"
                            color={entry.outTime ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          {entry.inTime 
                            ? new Date(entry.inTime).toLocaleString() 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {entry.outTime 
                            ? new Date(entry.outTime).toLocaleString() 
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tab} index="manual">
            <Stack spacing={3}>
              <Alert severity="info">
                Use this form to manually log vendor/visitor entries. Student entries are handled through the QR code scanning system.
              </Alert>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField 
                    label="Name / Team" 
                    placeholder="Visitor or worker name" 
                    fullWidth 
                    value={manualEntry.name}
                    onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField 
                    label="Entry type" 
                    select 
                    fullWidth 
                    value={manualEntry.type}
                    onChange={(e) => setManualEntry({ ...manualEntry, type: e.target.value })}
                  >
                    {['Visitor', 'Maintenance', 'Contractor', 'Delivery'].map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField 
                    label="Direction" 
                    select 
                    fullWidth 
                    value={manualEntry.direction}
                    onChange={(e) => setManualEntry({ ...manualEntry, direction: e.target.value })}
                  >
                    {['IN', 'OUT'].map((dir) => (
                      <MenuItem key={dir} value={dir}>
                        {dir}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField 
                    label="Purpose / Notes" 
                    multiline 
                    rows={3} 
                    placeholder="e.g., plumbing repair for Block B" 
                    fullWidth 
                    value={manualEntry.purpose}
                    onChange={(e) => setManualEntry({ ...manualEntry, purpose: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
                  <Button 
                    variant="contained" 
                    onClick={handleManualEntry}
                    disabled={submitting}
                  >
                    {submitting ? 'Logging...' : 'Log Entry'}
                  </Button>
                </Grid>
              </Grid>
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index="scan">
            <Stack spacing={3}>
              <Alert severity="info">
                Scan the QR code from a student's approved outpass to log their exit or return. You can also manually log by entering the admission number.
              </Alert>
              
              {/* Manual Entry Form */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Manual Entry
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Admission Number / Student ID"
                      placeholder="Enter admission number"
                      fullWidth
                      value={manualEntry.admissionNumber || ''}
                      onChange={(e) => handleAdmissionNumberChange(e.target.value)}
                      InputProps={{
                        endAdornment: fetchingStudent && <CircularProgress size={20} />,
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Action"
                      select
                      fullWidth
                      value={manualEntry.action || 'exit'}
                      onChange={(e) => setManualEntry({ ...manualEntry, action: e.target.value })}
                      disabled={!studentDetails}
                    >
                      <MenuItem value="exit">Exit</MenuItem>
                      <MenuItem value="return">Return</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleManualStudentEntry}
                      disabled={submitting || !manualEntry.admissionNumber || !studentDetails || fetchingStudent}
                      sx={{ height: '100%' }}
                    >
                      {submitting ? 'Processing...' : 'Log'}
                    </Button>
                  </Grid>
                </Grid>

                {/* Student Details Display */}
                {studentDetails && studentDetails.student && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Student Details
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {studentDetails.student.name}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="body2" color="text.secondary">Student ID</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {studentDetails.student.studentId || studentDetails.student.admissionNumber}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">Course</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {studentDetails.student.course || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">Batch/Year</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {studentDetails.student.batchYear || studentDetails.student.year || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="body2" color="text.secondary">Room</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {studentDetails.student.room?.roomNumber || 'N/A'}
                          {studentDetails.student.room?.block && ` (${studentDetails.student.room.block})`}
                        </Typography>
                      </Grid>
                    </Grid>

                    {studentDetails.outpass && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Outpass Details
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary">Purpose / Reason</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {studentDetails.outpass.purpose}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Destination</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {studentDetails.outpass.destination}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="body2" color="text.secondary">Expected Return</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {new Date(studentDetails.outpass.expectedReturnDate).toLocaleString()}
                            </Typography>
                          </Grid>
                          {studentDetails.outpass.exitTime && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Exit Time</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.main' }}>
                                {new Date(studentDetails.outpass.exitTime).toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                          {studentDetails.outpass.returnTime && (
                            <Grid size={{ xs: 12, md: 6 }}>
                              <Typography variant="body2" color="text.secondary">Return Time</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: 'info.main' }}>
                                {new Date(studentDetails.outpass.returnTime).toLocaleString()}
                              </Typography>
                            </Grid>
                          )}
                          {studentDetails.outpass.exitTime && !studentDetails.outpass.returnTime && (
                            <Grid size={12}>
                              <Alert severity="warning">
                                Student has already exited. Select "Return" action to log their return.
                              </Alert>
                            </Grid>
                          )}
                          {!studentDetails.outpass.exitTime && (
                            <Grid size={12}>
                              <Alert severity="info">
                                Student has not exited yet. Select "Exit" action to log their exit.
                              </Alert>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    )}
                  </Box>
                )}

                {manualEntry.admissionNumber && !fetchingStudent && !studentDetails && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    No approved outpass found for this admission number. Please verify the admission number or ensure the student has an approved outpass request.
                  </Alert>
                )}
              </Paper>

              {/* QR Scanner */}
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<IconQrcode size={24} />}
                  onClick={handleScanQR}
                  sx={{ px: 4, py: 2 }}
                >
                  Open QR Scanner
                </Button>
              </Box>
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index="student-visitors">
            <Stack spacing={3}>
              <Alert severity="info">
                Manage student visitors. Log visitors when they arrive and check them out when they leave.
              </Alert>

              {/* Create Student Visitor Form */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Log Student Visitor
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Visitor Name"
                      fullWidth
                      required
                      value={studentVisitorForm.visitorName}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, visitorName: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Visitor Phone"
                      fullWidth
                      required
                      value={studentVisitorForm.visitorPhone}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, visitorPhone: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Visitor Email (Optional)"
                      type="email"
                      fullWidth
                      value={studentVisitorForm.visitorEmail}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, visitorEmail: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Relation"
                      fullWidth
                      value={studentVisitorForm.relation}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, relation: e.target.value })}
                      placeholder="e.g., Parent, Friend, Relative"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Student ID / Admission Number"
                      fullWidth
                      required
                      value={studentVisitorForm.studentId}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, studentId: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Purpose"
                      select
                      fullWidth
                      value={studentVisitorForm.purpose}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, purpose: e.target.value })}
                    >
                      <MenuItem value="visit">Visit</MenuItem>
                      <MenuItem value="delivery">Delivery</MenuItem>
                      <MenuItem value="maintenance">Maintenance</MenuItem>
                      <MenuItem value="official">Official</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      label="Remarks (Optional)"
                      fullWidth
                      multiline
                      rows={2}
                      value={studentVisitorForm.remarks}
                      onChange={(e) => setStudentVisitorForm({ ...studentVisitorForm, remarks: e.target.value })}
                    />
                  </Grid>
                  <Grid size={12}>
                    <Button
                      variant="contained"
                      onClick={handleCreateStudentVisitor}
                      disabled={submitting}
                    >
                      {submitting ? 'Logging...' : 'Log Visitor'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Student Visitor Logs Table */}
              <Paper variant="outlined">
                <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
                  Student Visitor Logs
                </Typography>
                {loadingStudentVisitors ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : studentVisitorLogs.length === 0 ? (
                  <Alert severity="info" sx={{ m: 2 }}>No student visitor logs found</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                          <TableCell><strong>Visitor</strong></TableCell>
                          <TableCell><strong>Student</strong></TableCell>
                          <TableCell><strong>Relation</strong></TableCell>
                          <TableCell><strong>Phone</strong></TableCell>
                          <TableCell><strong>Check In</strong></TableCell>
                          <TableCell><strong>Check Out</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentVisitorLogs.map((log) => (
                          <TableRow key={log._id} hover>
                            <TableCell>{log.visitorName}</TableCell>
                            <TableCell>
                              <Stack>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {log.student?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {log.student?.studentId || log.student?.admissionNumber || 'N/A'}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{log.relation || 'N/A'}</TableCell>
                            <TableCell>{log.visitorPhone}</TableCell>
                            <TableCell>
                              {log.checkIn ? new Date(log.checkIn).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell>
                              {log.checkOut ? new Date(log.checkOut).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={log.status === 'checked_out' ? 'Checked Out' : 'Checked In'}
                                color={log.status === 'checked_out' ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {log.status === 'checked_in' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleCheckoutStudentVisitor(log._id)}
                                >
                                  Check Out
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Stack>
          </TabPanel>
        </Stack>
      </PresentationCard>

      {/* QR Scanner Dialog */}
      <Dialog open={qrScannerOpen} onClose={handleCloseScanner} maxWidth="sm" fullWidth>
        <DialogTitle>
          Scan Student Outpass QR Code
          <IconButton
            aria-label="close"
            onClick={handleCloseScanner}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {cameraError ? (
              <Stack spacing={2} alignItems="center">
                <Alert severity="error" sx={{ width: '100%' }}>
                  {cameraError}
                </Alert>
                <Alert severity="info" sx={{ width: '100%', mt: 1 }}>
                  <Typography variant="body2" component="div">
                    <strong>Tips:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      <li>Ensure your browser has camera permissions enabled</li>
                      <li>Check browser settings if permission was denied</li>
                      <li>Make sure no other application is using the camera</li>
                      <li>Try refreshing the page and allowing camera access when prompted</li>
                    </ul>
                  </Typography>
                </Alert>
                <Button
                  variant="contained"
                  onClick={startScanner}
                  startIcon={<IconQrcode size={20} />}
                >
                  Retry
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2} alignItems="center" sx={{ position: 'relative' }}>
                {scanning && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10, 
                    bgcolor: 'rgba(255,255,255,0.95)', 
                    p: 3, 
                    borderRadius: 2,
                    boxShadow: 3
                  }}>
                    <Stack spacing={2} alignItems="center">
                      <CircularProgress size={40} />
                      <Typography variant="body2" color="text.secondary">
                        Starting camera...
                      </Typography>
                    </Stack>
                  </Box>
                )}
                <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                  <Box
                    id={qrCodeRegionId}
                    sx={{
                      width: '100%',
                      minHeight: 300,
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: 2,
                      borderColor: 'primary.main',
                      bgcolor: 'black',
                    }}
                  />
                  {availableCameras.length > 1 && !scanning && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={switchCamera}
                      startIcon={<IconCameraRotate size={18} />}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 5,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.8)',
                        },
                      }}
                    >
                      Switch Camera
                    </Button>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Position the QR code within the camera view
                </Typography>
                {availableCameras.length > 1 ? (
                  <Typography variant="caption" color="text.secondary">
                    {availableCameras.find(cam => cam.id === currentCameraId)?.label || 'Camera active'}
                  </Typography>
                ) : availableCameras.length === 1 ? (
                  <Typography variant="caption" color="text.secondary">
                    Only one camera detected. For best results scanning QR codes on phones, use a device with a back camera.
                  </Typography>
                ) : null}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseScanner}>Close</Button>
        </DialogActions>
      </Dialog>
    </ComponentsWrapper>
  );
}
