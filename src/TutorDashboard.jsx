import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link } from 'react-router-dom';
import { formatInTimeZone } from 'date-fns-tz';
import { usePageTitle, updateFavicon } from './hooks/usePageTitle';
// import { useNotification } from './components/NotificationSystem';

  // Import MUI Components
import { 
    Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
    TableRow, Paper, CircularProgress, Button, Alert, Stack, TextField,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Chip,
    RadioGroup, FormControlLabel, Radio, FormLabel, IconButton, Grid,
    MenuItem, Select, FormControl, InputLabel, Checkbox, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Helper function to categorize and format location display with privacy
function formatLocationForTutor(location, hasAccepted = false) {
  if (!location) return { type: 'Unknown', display: 'Location not specified', color: 'default' };
  
  const loc = location.toLowerCase().trim();
  
  if (loc === 'online' || loc.includes('zoom') || loc.includes('online')) {
    return {
      type: '🌐 Online',
      display: 'Online Session via Zoom',
      color: 'info',
      fullLocation: location
    };
  }
  
  // Determine if it's library or in-home
  const isLibrary = loc.includes('library') || 
                   loc.includes('public library') || 
                   loc.includes('local library') ||
                   loc.includes('state library') ||
                   loc.includes('council library');
  
  if (isLibrary) {
    return {
      type: '📚 Library',
      display: hasAccepted ? location : `Library session (full location revealed upon acceptance)`,
      color: 'secondary',
      fullLocation: location
    };
  } else {
    // In-home
    const suburb = hasAccepted ? location : extractSuburb(location);
    return {
      type: '🏠 In-Home',
      display: hasAccepted ? location : `In-home session in ${suburb} (full address revealed upon acceptance)`,
      color: 'warning',
      fullLocation: location
    };
  }
}

// Helper function to extract suburb from full address
function extractSuburb(address) {
  if (!address) return 'Unknown area';
  
  // Enhanced suburb extraction logic
  const parts = address.split(',').map(part => part.trim());
  if (parts.length >= 2) {
    // Assume the suburb is the second-to-last part (before state/postcode)
    const suburbPart = parts[parts.length - 2];
    // Clean up any numbers or extra info, keep just the suburb name
    return suburbPart.replace(/\d+/g, '').trim() || 'General area';
  } else if (parts.length === 1) {
    // If no commas, try to extract suburb from single string
    const words = address.trim().split(' ');
    // Take first 2-3 words as potential suburb, excluding numbers
    return words.slice(0, Math.min(3, words.length)).join(' ').replace(/\d+/g, '').trim() || 'General area';
  }
  
  return 'General area';
}

export default function TutorDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [confirmedTrials, setConfirmedTrials] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Use notification system for better UX (temporarily disabled)
  // const { notify } = useNotification();
  const notify = {
    success: (msg) => setSuccessMessage(msg),
    error: (msg) => setError(msg),
    info: (msg) => setSuccessMessage(msg),
    warning: (msg) => setSuccessMessage(msg),
  };
  
  // Set dynamic page title
  usePageTitle(profile ? `${profile.full_name || 'Tutor'} Dashboard` : 'Tutor Dashboard');
  
  useEffect(() => {
    updateFavicon('tutor');
  }, []);
  
  // --- NEW STATE for Waitlist feature ---
  const [joinableSessions, setJoinableSessions] = useState([]);
  const [waitlistStatus, setWaitlistStatus] = useState({});

  // --- NEW STATE for Permanent Scheduling ---
  const [continuingSessions, setContinuingSessions] = useState([]);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);
  const [schedulingSession, setSchedulingSession] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [preferredTime, setPreferredTime] = useState('');

  // --- State for Modals ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [trialSuccess, setTrialSuccess] = useState(''); // 'successful', 'unsuccessful', or ''
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State for Diagnostic Form ---
  const [diagnosticData, setDiagnosticData] = useState({
    diagnosticAssessment: '',
    improvementSuggestions: '',
    nextLessonPlan: '',
    attachedResourceIds: [],
    usageNotes: ''
  });

  // --- State for Reflection Form ---
  const [reflectionData, setReflectionData] = useState({
    teachingReflection: '',
    longTermProgram: '',
    attachedResourceIds: [],
    usageNotes: ''
  });

  // --- NEW: Resource Management State ---
  const [availableResources, setAvailableResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // --- MODIFIED: Data fetching logic now uses the new table structure ---
  const fetchAllData = useCallback(async (userId) => {
    try {
      setError(null);
      
      // Fetch pending outreach attempts
      const { data: pendingData, error: pendingError } = await supabase
        .from('outreach_attempts')
        .select('id, trial_sessions:session_id(*, trial_lessons(*, subjects(name)))')
        .eq('tutor_id', userId)
        .eq('status', 'pending');
      
      if (pendingError) throw new Error(`Failed to load pending requests: ${pendingError.message}`);
      setPendingRequests(pendingData || []);

      // Fetch confirmed trials
      const { data: confirmedData, error: confirmedError } = await supabase
        .from('trial_sessions')
        .select('*, trial_lessons(*, subjects(name))')
        .eq('assigned_tutor_id', userId)
        .in('status', ['Confirmed', 'Trial 1 Complete - Diagnostic Submitted', 'Trial 2 Complete - Reflection Submitted', 'Student Continuing - Awaiting Schedule']);

      if (confirmedError) throw new Error(`Failed to load confirmed trials: ${confirmedError.message}`);
      setConfirmedTrials(confirmedData || []);

      // Fetch joinable sessions
      const { data: joinableData, error: joinableError } = await supabase
        .from('trial_sessions')
        .select('*, trial_lessons(*, subjects(name)), session_waitlist(*)')
        .in('status', ['Outreach in Progress', 'Confirmed'])
        .not('assigned_tutor_id', 'eq', userId);

      if (joinableError) throw new Error(`Failed to load available sessions: ${joinableError.message}`);
      setJoinableSessions(joinableData || []);

      // Fetch continuing sessions
      const { data: continuingData, error: continuingError } = await supabase
        .from('trial_sessions')
        .select('*, trial_lessons(*, subjects(name))')
        .eq('assigned_tutor_id', userId)
        .eq('status', 'Student Continuing - Awaiting Schedule');

      if (continuingError) throw new Error(`Failed to load continuing sessions: ${continuingError.message}`);
      setContinuingSessions(continuingData || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    const getInitialData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentUserId = session.user.id;
        setUser(session.user);
        const { data: profileData } = await supabase.from('tutors').select('suburb, phone_number').eq('id', currentUserId).single();
        setProfile(profileData);
        await fetchAllData(currentUserId);
      }
      setLoading(false);
    };
    getInitialData();
  }, [fetchAllData]);

  // --- MODIFIED: Response handler now uses session logic if available ---
  const handleResponse = async (attemptId, response) => {
    setRespondingId(attemptId);
    try {
        const apiResponse = await fetch(`${API_URL}/api/outreach-attempts/${attemptId}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response }),
        });
        const data = await apiResponse.json();
        if (!apiResponse.ok) { throw new Error(data.error || `Failed to submit response.`); }
        alert(`Your response has been recorded. Thank you!`);
        await fetchAllData(user.id);
    } catch (error) {
        console.error('Error responding to outreach:', error);
        alert('Error: ' + error.message);
    }
    setRespondingId(null);
  };
  
  // Modal Handlers
  const handleOpenConfirmModal = (attempt) => { setSelectedItem(attempt); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setSelectedItem(null); };
  const handleFinalConfirm = async () => { if (!selectedItem) return; await handleResponse(selectedItem.id, 'accepted'); handleCloseConfirmModal(); };
  
  // Post-lesson modal handlers are unchanged...

  // --- NEW HANDLER for joining a waitlist ---
  const handleJoinWaitlist = async (sessionId) => {
    setWaitlistStatus(prev => ({ ...prev, [sessionId]: 'loading' }));
    try {
        const response = await fetch(`${API_URL}/api/sessions/${sessionId}/join-waitlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tutorId: user.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to join waitlist.');
        
        alert('You have successfully joined the waitlist!');
        // Update the button status to 'joined'
        setWaitlistStatus(prev => ({ ...prev, [sessionId]: 'joined' }));

    } catch (error) {
        alert('Error: ' + error.message);
        setWaitlistStatus(prev => ({ ...prev, [sessionId]: 'error' }));
    }
  };

  // --- NEW HANDLER for cancelling a trial ---
  const handleOpenCancelModal = (session) => { setSelectedItem(session); setIsCancelModalOpen(true); };
  const handleCloseCancelModal = () => setIsCancelModalOpen(false);
  
  const handleConfirmCancel = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_URL}/api/sessions/${selectedItem.id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cancelingTutorId: user.id }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to cancel assignment.');
        alert('Assignment cancelled successfully.');
        await fetchAllData(user.id); // Refresh all data
        handleCloseCancelModal();
    } catch (error) {
        alert('Error: ' + error.message);
    }
    setIsSubmitting(false);
  };

  // --- ENHANCED HANDLERS for Multiple Feedback Types ---
  
  // Helper function to determine feedback type needed
  const getFeedbackType = (session) => {
    if (!session.status) return 'diagnostic'; // Default for confirmed trials
    
    const status = session.status.toLowerCase();
    if (status.includes('confirmed') || status === 'confirmed') {
      return 'diagnostic'; // First trial
    } else if (status.includes('trial 1 complete') || status.includes('diagnostic')) {
      return 'reflection'; // Second trial
    } else {
      return 'regular'; // Permanent lessons
    }
  };

  const handleOpenAppropriateModal = (session) => {
    const feedbackType = getFeedbackType(session);
    setSelectedItem(session);
    
    if (feedbackType === 'diagnostic') {
      openDiagnosticModal(session);
    } else if (feedbackType === 'reflection') {
      openReflectionModal(session);
    } else {
      setIsFeedbackModalOpen(true);
    }
  };

  const handleCloseDiagnosticModal = () => {
    setIsDiagnosticModalOpen(false);
    setDiagnosticData({
      diagnosticAssessment: '',
      improvementSuggestions: '',
      nextLessonPlan: '',
      attachedResourceIds: [],
      usageNotes: ''
    });
    setSelectedItem(null);
  };

  const handleCloseReflectionModal = () => {
    setIsReflectionModalOpen(false);
    setReflectionData({
      teachingReflection: '',
      longTermProgram: '',
      attachedResourceIds: [],
      usageNotes: ''
    });
    setSelectedItem(null);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setFeedbackText('');
    setTrialSuccess('');
    setSelectedItem(null);
  };

  // --- NEW HANDLERS for Permanent Scheduling ---
  const handleOpenSchedulingModal = (session) => {
    setSchedulingSession(session);
    setIsSchedulingModalOpen(true);
    // Pre-populate with the original trial time as preferred
    if (session.trial_lessons?.[0]?.lesson_datetime) {
      const trialTime = new Date(session.trial_lessons[0].lesson_datetime);
      const dayName = trialTime.toLocaleDateString('en-US', { weekday: 'long' });
      const timeStr = trialTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setPreferredTime(`${dayName} at ${timeStr} (Same as trial)`);
    }
  };

  const handleCloseSchedulingModal = () => {
    setIsSchedulingModalOpen(false);
    setSchedulingSession(null);
    setAvailableSlots([]);
    setPreferredTime('');
  };

  const handleAddTimeSlot = () => {
    setAvailableSlots([...availableSlots, { day: '', time: '' }]);
  };

  const handleUpdateSlot = (index, field, value) => {
    const updated = [...availableSlots];
    updated[index][field] = value;
    setAvailableSlots(updated);
  };

  const handleRemoveSlot = (index) => {
    setAvailableSlots(availableSlots.filter((_, i) => i !== index));
  };

  const handleSubmitAvailability = async () => {
    if (!schedulingSession || availableSlots.length === 0) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/sessions/${schedulingSession.id}/set-permanent-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableSlots: availableSlots.filter(slot => slot.day && slot.time),
          tutorId: user.id,
          preferredTime: preferredTime
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit availability.');

      alert('Availability submitted successfully! Admin will contact you to confirm the permanent lesson time.');
      await fetchAllData(user.id);
      handleCloseSchedulingModal();

    } catch (error) {
      alert('Error: ' + error.message);
    }
    setIsSubmitting(false);
  };

  // --- NEW: Fetch available resources ---
  const fetchAvailableResources = useCallback(async (subjectIds = []) => {
    setLoadingResources(true);
    try {
      const params = new URLSearchParams();
      if (subjectIds.length > 0) {
        params.append('subjectId', subjectIds[0]); // Use first subject for now
      }

      const response = await fetch(`${API_URL}/api/resources/for-feedback?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setAvailableResources(data.resources || []);
      } else {
        console.error('Error fetching resources:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  // --- Enhanced Diagnostic Submission ---
  const handleDiagnosticSubmit = async () => {
    if (!selectedItem || !user) return;

    // Word count validation
    const assessmentWords = diagnosticData.diagnosticAssessment.trim().split(/\s+/).length;
    const suggestionsWords = diagnosticData.improvementSuggestions.trim().split(/\s+/).length;
    const planWords = diagnosticData.nextLessonPlan.trim().split(/\s+/).length;

    if (assessmentWords < 40) {
      alert('Diagnostic assessment must be at least 40 words.');
      return;
    }
    if (suggestionsWords < 30) {
      alert('Improvement suggestions must be at least 30 words.');
      return;
    }
    if (planWords < 30) {
      alert('Next lesson plan must be at least 30 words.');
      return;
    }

    if (!diagnosticData.diagnosticAssessment || !diagnosticData.improvementSuggestions || !diagnosticData.nextLessonPlan) {
      alert('All diagnostic fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/sessions/${selectedItem.id}/submit-diagnostic-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: user.id,
          diagnosticAssessment: diagnosticData.diagnosticAssessment,
          improvementSuggestions: diagnosticData.improvementSuggestions,
          nextLessonPlan: diagnosticData.nextLessonPlan,
          attachedResourceIds: diagnosticData.attachedResourceIds,
          usageNotes: diagnosticData.usageNotes
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Diagnostic feedback submitted successfully!');
        setIsDiagnosticModalOpen(false);
        setDiagnosticData({
          diagnosticAssessment: '',
          improvementSuggestions: '',
          nextLessonPlan: '',
          attachedResourceIds: [],
          usageNotes: ''
        });
        await fetchAllData(user.id);
      } else {
        alert('Error: ' + (data.error || 'Failed to submit diagnostic'));
      }
    } catch (error) {
      console.error('Error submitting diagnostic:', error);
      alert('Failed to submit diagnostic feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Enhanced Reflection Submission ---
  const handleReflectionSubmit = async () => {
    if (!selectedItem || !user) return;

    if (!reflectionData.teachingReflection || !reflectionData.longTermProgram) {
      alert('All reflection fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/sessions/${selectedItem.id}/submit-reflection-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: user.id,
          teachingReflection: reflectionData.teachingReflection,
          longTermProgram: reflectionData.longTermProgram,
          attachedResourceIds: reflectionData.attachedResourceIds,
          usageNotes: reflectionData.usageNotes
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Reflection feedback submitted successfully!');
        setIsReflectionModalOpen(false);
        setReflectionData({
          teachingReflection: '',
          longTermProgram: '',
          attachedResourceIds: [],
          usageNotes: ''
        });
        await fetchAllData(user.id);
      } else {
        alert('Error: ' + (data.error || 'Failed to submit reflection'));
      }
    } catch (error) {
      console.error('Error submitting reflection:', error);
      alert('Failed to submit reflection feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Resource Selection Handlers ---
  const handleResourceToggle = (resourceId, formType) => {
    if (formType === 'diagnostic') {
      setDiagnosticData(prev => ({
        ...prev,
        attachedResourceIds: prev.attachedResourceIds.includes(resourceId)
          ? prev.attachedResourceIds.filter(id => id !== resourceId)
          : [...prev.attachedResourceIds, resourceId]
      }));
    } else if (formType === 'reflection') {
      setReflectionData(prev => ({
        ...prev,
        attachedResourceIds: prev.attachedResourceIds.includes(resourceId)
          ? prev.attachedResourceIds.filter(id => id !== resourceId)
          : [...prev.attachedResourceIds, resourceId]
      }));
    }
  };

  const openDiagnosticModal = (item) => {
    setSelectedItem(item);
    setIsDiagnosticModalOpen(true);
    // Fetch resources based on session subjects
    const subjectIds = item.trial_lessons?.map(lesson => lesson.subject_id) || [];
    fetchAvailableResources(subjectIds);
  };

  const openReflectionModal = (item) => {
    setSelectedItem(item);
    setIsReflectionModalOpen(true);
    // Fetch resources based on session subjects
    const subjectIds = item.trial_lessons?.map(lesson => lesson.subject_id) || [];
    fetchAvailableResources(subjectIds);
  };

  // --- Regular Feedback Submission (for permanent lessons) ---
  const handleSubmitFeedback = async () => {
    if (!selectedItem || !feedbackText || !trialSuccess) return;
    setIsSubmitting(true);
    try {
        const wasSuccessful = trialSuccess === 'successful';
        const response = await fetch(`${API_URL}/api/sessions/${selectedItem.id}/submit-feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                feedback: feedbackText, 
                tutorId: user.id,
                wasSuccessful: wasSuccessful
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to submit feedback.');
        
        alert('Lesson feedback submitted successfully!');
        await fetchAllData(user.id);
        handleCloseFeedbackModal();

    } catch (error) {
        alert('Error: ' + error.message);
    }
    setIsSubmitting(false);
  };

  // Enhanced response handlers with better feedback
  const handleRespondToRequest = async (attemptId, response) => {
    if (respondingId) return; // Prevent double-clicking
    
    setRespondingId(attemptId);
    setError(null);
    setSuccessMessage('');
    
    try {
      const res = await fetch(`${API_URL}/api/outreach-attempts/${attemptId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit response');
      
      // Show smart notifications based on response type
      if (response === 'accepted') {
        notify.success(
          'Session accepted! We\'ll send you meeting details and student information shortly.',
          { title: 'Session Confirmed', duration: 8000 }
        );
      } else if (response === 'declined') {
        notify.info(
          'Response recorded. We\'ll continue finding the right match for this student.',
          { title: 'Response Submitted', duration: 5000 }
        );
      } else if (response === 'require_different_time') {
        notify.warning(
          'Time change request noted. An admin will review and contact you about alternative times.',
          { title: 'Rescheduling Request', duration: 7000 }
        );
      }
      
      await fetchAllData(user.id);
      
    } catch (error) {
      console.error('Error responding to request:', error);
      notify.error(
        `Failed to submit response: ${error.message}`,
        { 
          title: 'Response Failed',
          action: (
            <Button 
              size="small" 
              onClick={() => handleRespondToRequest(attemptId, response)}
              sx={{ color: 'white' }}
            >
              Retry
            </Button>
          )
        }
      );
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Enhanced Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {profile?.full_name || user?.email || 'Tutor'}! 👋
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button component={Link} to="/tutor/resources" variant="contained" color="secondary">
            Resource Hub
          </Button>
          <Button component={Link} to="/tutor/profile" variant="contained">
            Edit Profile
          </Button>
        </Stack>
      </Box>

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Profile Warning */}
      {profile && (!profile.suburb || !profile.phone_number) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Profile Incomplete:</strong> Please update your profile with your suburb and phone number to receive trial requests.
          <Button component={Link} to="/tutor/profile" size="small" sx={{ ml: 2 }}>
            Complete Profile
          </Button>
        </Alert>
      )}

      {/* Enhanced Pending Requests Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          📩 Pending Trial Requests ({pendingRequests.length})
        </Typography>
        
        {pendingRequests.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No pending requests at the moment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We'll notify you when new trial opportunities become available that match your subjects.
            </Typography>
          </Box>
        ) : (
          pendingRequests.map((attempt) => {
            const session = attempt.trial_sessions;
            if (!session?.trial_lessons?.length) return null;
            
            const locInfo = formatLocationForTutor(session.location, false);
            const firstLesson = session.trial_lessons[0];
            const lessonDate = new Date(firstLesson.lesson_datetime);

            return (
              <Card key={attempt.id} sx={{ mb: 2, border: '2px solid', borderColor: 'primary.light' }}>
                <CardContent>
                  {/* Enhanced lesson display */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {session.trial_lessons.map(lesson => lesson.subjects.name).join(', ')} Trial
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        📅 {lessonDate.toLocaleDateString('en-AU', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                      <Typography variant="body1">
                        ⏰ {lessonDate.toLocaleTimeString('en-AU', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} ({firstLesson.duration_minutes} minutes)
                      </Typography>
                      <Chip 
                        label={locInfo.display} 
                        color={locInfo.color} 
                        size="medium" 
                        sx={{ mt: 1, fontWeight: 'bold' }} 
                      />
                    </Box>
                    
                    <Box textAlign="right">
                      <Typography variant="body2" color="text.secondary">
                        Parent: {session.parent_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Students: {session.trial_lessons.map(l => `${l.student_name} (${l.student_grade})`).join(', ')}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Enhanced response buttons */}
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={() => handleRespondToRequest(attempt.id, 'accepted')}
                      disabled={respondingId === attempt.id}
                      sx={{ minWidth: 120 }}
                    >
                      {respondingId === attempt.id ? <CircularProgress size={20} /> : '✅ Accept'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="large"
                      onClick={() => handleRespondToRequest(attempt.id, 'require_different_time')}
                      disabled={respondingId === attempt.id}
                      sx={{ minWidth: 160 }}
                    >
                      {respondingId === attempt.id ? <CircularProgress size={20} /> : '🔄 Different Time'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={() => handleRespondToRequest(attempt.id, 'declined')}
                      disabled={respondingId === attempt.id}
                      sx={{ minWidth: 120 }}
                    >
                      {respondingId === attempt.id ? <CircularProgress size={20} /> : '❌ Decline'}
                    </Button>
                  </Box>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💡 <strong>Need a different time?</strong> Click "Different Time" and an admin will contact you to discuss alternatives.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            );
          })
        )}
      </Paper>

        {/* --- NEW: Permanent Scheduling Section --- */}
        {continuingSessions.length > 0 && (
            <>
                <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'success.main' }}>
                    🎉 Students Continuing - Set Your Availability
                </Typography>
                <Alert severity="success" sx={{ mb: 2 }}>
                    Great news! These students want to continue with permanent lessons. Please set your available times so we can schedule ongoing sessions.
                </Alert>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow><TableCell>Student & Subjects</TableCell><TableCell>Original Trial Time</TableCell><TableCell>Actions</TableCell></TableRow>
                        </TableHead>
                        <TableBody>
                            {continuingSessions.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {session.trial_lessons.map(l => l.student_name).join(', ')}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {session.trial_lessons.map(l => l.subjects.name).join(', ')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {session.trial_lessons[0] ? 
                                            new Date(session.trial_lessons[0].lesson_datetime).toLocaleString() : 
                                            'Time not specified'
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="contained" 
                                            color="success" 
                                            onClick={() => handleOpenSchedulingModal(session)}
                                        >
                                            Set Availability
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </>
        )}
        
        {/* --- MODIFIED: Confirmed Trials Table --- */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Your Confirmed Trials</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow><TableCell>Subjects</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell></TableRow>
                </TableHead>
                <TableBody>
                    {confirmedTrials.length > 0 ? (
                        confirmedTrials.map((session) => (
                            <TableRow key={session.id}>
                                <TableCell>{session.trial_lessons.map(l => l.subjects.name).join(', ')}</TableCell>
                                <TableCell>
                                    {(() => {
                                        const locInfo = formatLocationForTutor(session.location, true); // true = has accepted, show full address
                                        return (
                                            <Box>
                                                <Chip 
                                                    label={locInfo.type} 
                                                    color={locInfo.color} 
                                                    variant="filled" 
                                                    size="small" 
                                                    sx={{ fontWeight: 'bold', mb: 0.5 }}
                                                />
                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {locInfo.display}
                                                </Typography>
                                            </Box>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell><Chip label={session.status} color={session.status === 'Confirmed' ? 'success' : 'default'} size="small" /></TableCell>
                                <TableCell>
                                    {session.status === 'Confirmed' ? (
                                        <Stack direction="row" spacing={1}>
                                            <Button variant="outlined" color="error" size="small" onClick={() => handleOpenCancelModal(session)}>Cancel</Button>
                                            <Button 
                                                variant="contained" 
                                                size="small" 
                                                onClick={() => handleOpenAppropriateModal(session)}
                                            >
                                                {getFeedbackType(session) === 'diagnostic' ? 'Submit Diagnostic' : 
                                                 getFeedbackType(session) === 'reflection' ? 'Submit Reflection' : 
                                                 'Submit Feedback'}
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Alert severity="success" variant="outlined" sx={{py: 0.5}}>{session.status.replace('Completed - ', '')}</Alert>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>You have no confirmed trials.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        {/* --- NEW UI SECTION for Waitlists --- */}
        <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Available Session Waitlists</Typography>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow><TableCell>Subjects</TableCell><TableCell>Location</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow>
                </TableHead>
                <TableBody>
                    {joinableSessions.length > 0 ? (
                        joinableSessions.map((session) => {
                            const hasJoined = session.session_waitlist.some(entry => entry.tutor_id === user.id);
                            const currentWaitlistStatus = waitlistStatus[session.id];

                            return (
                                <TableRow key={session.id}>
                                    <TableCell>
                                        {session.trial_lessons.map(l => l.subjects.name).join(', ')}
                                    </TableCell>
                                    <TableCell>{session.location}</TableCell>
                                    <TableCell><Chip label={session.status} size="small" /></TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            size="small"
                                            disabled={hasJoined || currentWaitlistStatus === 'joined' || currentWaitlistStatus === 'loading'}
                                            onClick={() => handleJoinWaitlist(session.id)}
                                        >
                                            {currentWaitlistStatus === 'loading' && <CircularProgress size={20} color="inherit" />}
                                            {currentWaitlistStatus !== 'loading' && (hasJoined || currentWaitlistStatus === 'joined' ? 'On Waitlist' : 'Join Waitlist')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>There are no available sessions to join a waitlist for.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>

        {/* --- All Modals --- */}
        <Dialog open={isConfirmModalOpen} onClose={handleCloseConfirmModal}>{/* Acceptance Modal */}</Dialog>
        <Dialog open={isCancelModalOpen} onClose={handleCloseCancelModal}>{/* Cancellation Modal */}</Dialog>
        
        {/* Enhanced Diagnostic Feedback Modal */}
        <Dialog open={isDiagnosticModalOpen} onClose={() => setIsDiagnosticModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            📊 First Trial Lesson - Diagnostic Assessment
            <Typography variant="subtitle2" color="text.secondary">
              Provide detailed feedback on the student's current abilities and learning needs
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Student Assessment (minimum 40 words)"
                multiline
                rows={4}
                fullWidth
                value={diagnosticData.diagnosticAssessment}
                onChange={(e) => setDiagnosticData(prev => ({ ...prev, diagnosticAssessment: e.target.value }))}
                placeholder="Describe the student's current strengths, weaknesses, knowledge gaps, and overall performance during the lesson..."
                helperText={`${diagnosticData.diagnosticAssessment.trim().split(/\s+/).filter(word => word).length} words (minimum 40 required)`}
                sx={{ mb: 3 }}
              />

              <TextField
                label="Improvement Suggestions (minimum 30 words)"
                multiline
                rows={3}
                fullWidth
                value={diagnosticData.improvementSuggestions}
                onChange={(e) => setDiagnosticData(prev => ({ ...prev, improvementSuggestions: e.target.value }))}
                placeholder="Provide specific, actionable recommendations for areas where the student can improve..."
                helperText={`${diagnosticData.improvementSuggestions.trim().split(/\s+/).filter(word => word).length} words (minimum 30 required)`}
                sx={{ mb: 3 }}
              />

              <TextField
                label="Next Lesson Plan (minimum 30 words)"
                multiline
                rows={3}
                fullWidth
                value={diagnosticData.nextLessonPlan}
                onChange={(e) => setDiagnosticData(prev => ({ ...prev, nextLessonPlan: e.target.value }))}
                placeholder="Outline what you plan to cover in the second trial lesson based on today's assessment..."
                helperText={`${diagnosticData.nextLessonPlan.trim().split(/\s+/).filter(word => word).length} words (minimum 30 required)`}
                sx={{ mb: 3 }}
              />

              {/* Resource Attachment Section */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachFileIcon sx={{ mr: 1 }} />
                Recommended Resources (Optional)
              </Typography>
              
              {loadingResources ? (
                <CircularProgress size={24} />
              ) : (
                <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, mb: 2 }}>
                  {availableResources.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>
                      No resources available for this subject
                    </Typography>
                  ) : (
                    availableResources.map(resource => (
                      <FormControlLabel
                        key={resource.id}
                        control={
                          <Checkbox
                            checked={diagnosticData.attachedResourceIds.includes(resource.id)}
                            onChange={() => handleResourceToggle(resource.id, 'diagnostic')}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {resource.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {resource.description} • {resource.subjects?.name || 'General'}
                            </Typography>
                          </Box>
                        }
                        sx={{ display: 'block', mb: 1 }}
                      />
                    ))
                  )}
                </Box>
              )}

              {diagnosticData.attachedResourceIds.length > 0 && (
                <TextField
                  label="Resource Usage Notes"
                  multiline
                  rows={2}
                  fullWidth
                  value={diagnosticData.usageNotes}
                  onChange={(e) => setDiagnosticData(prev => ({ ...prev, usageNotes: e.target.value }))}
                  placeholder="How do you recommend the student use these resources?"
                  sx={{ mb: 2 }}
                />
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                This diagnostic will be automatically sent to the parent via email with your assessment and recommendations.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDiagnosticModalOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleDiagnosticSubmit} 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              Submit Diagnostic
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enhanced Reflection Feedback Modal */}
        <Dialog open={isReflectionModalOpen} onClose={() => setIsReflectionModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            🎯 Second Trial Lesson - Teaching Reflection
            <Typography variant="subtitle2" color="text.secondary">
              Reflect on your teaching approach and provide program recommendations
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                label="Teaching Development Reflection"
                multiline
                rows={4}
                fullWidth
                value={reflectionData.teachingReflection}
                onChange={(e) => setReflectionData(prev => ({ ...prev, teachingReflection: e.target.value }))}
                placeholder="Reflect on how your teaching approach evolved between the first and second lessons. What worked well? What would you adjust?"
                sx={{ mb: 3 }}
              />

              <TextField
                label="Long-term Program Recommendation"
                multiline
                rows={4}
                fullWidth
                value={reflectionData.longTermProgram}
                onChange={(e) => setReflectionData(prev => ({ ...prev, longTermProgram: e.target.value }))}
                placeholder="If the student continues with permanent lessons, outline your recommended long-term learning program and goals..."
                sx={{ mb: 3 }}
              />

              {/* Resource Attachment Section */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachFileIcon sx={{ mr: 1 }} />
                Long-term Resources (Optional)
              </Typography>
              
              {loadingResources ? (
                <CircularProgress size={24} />
              ) : (
                <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, mb: 2 }}>
                  {availableResources.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>
                      No resources available for this subject
                    </Typography>
                  ) : (
                    availableResources.map(resource => (
                      <FormControlLabel
                        key={resource.id}
                        control={
                          <Checkbox
                            checked={reflectionData.attachedResourceIds.includes(resource.id)}
                            onChange={() => handleResourceToggle(resource.id, 'reflection')}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {resource.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {resource.description} • {resource.subjects?.name || 'General'}
                            </Typography>
                          </Box>
                        }
                        sx={{ display: 'block', mb: 1 }}
                      />
                    ))
                  )}
                </Box>
              )}

              {reflectionData.attachedResourceIds.length > 0 && (
                <TextField
                  label="Resource Usage Notes"
                  multiline
                  rows={2}
                  fullWidth
                  value={reflectionData.usageNotes}
                  onChange={(e) => setReflectionData(prev => ({ ...prev, usageNotes: e.target.value }))}
                  placeholder="How would these resources support the long-term program?"
                  sx={{ mb: 2 }}
                />
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                Your reflection will help parents decide whether to continue with permanent lessons.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsReflectionModalOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleReflectionSubmit} 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              Submit Reflection
            </Button>
          </DialogActions>
        </Dialog>

        {/* --- NEW: PERMANENT LESSON SCHEDULING MODAL --- */}
        <Dialog open={isSchedulingModalOpen} onClose={handleCloseSchedulingModal} fullWidth maxWidth="md">
            <DialogTitle>Set Your Availability for Permanent Lessons</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{mb: 2}}>
                    Great news! The student wants to continue with permanent lessons. Please set your available times below. 
                    Most lessons continue at the same time as the trial, but providing multiple options helps us find the best time for everyone.
                </DialogContentText>

                <TextField
                    margin="dense"
                    label="Preferred Time (Optional)"
                    fullWidth
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="e.g., Same as trial time, or Wednesday at 4:00 PM"
                    sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Available Time Slots</Typography>
                    <Button startIcon={<AddIcon />} onClick={handleAddTimeSlot} variant="outlined">
                        Add Time Slot
                    </Button>
                </Box>

                {availableSlots.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Click "Add Time Slot" to specify when you're available for permanent lessons.
                    </Alert>
                )}

                {availableSlots.map((slot, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                        <Grid item xs={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Day</InputLabel>
                                <Select
                                    value={slot.day}
                                    label="Day"
                                    onChange={(e) => handleUpdateSlot(index, 'day', e.target.value)}
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <MenuItem key={day} value={day}>{day}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Time"
                                type="time"
                                value={slot.time}
                                onChange={(e) => handleUpdateSlot(index, 'time', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <IconButton color="error" onClick={() => handleRemoveSlot(index)}>
                                <DeleteIcon />
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}

                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Please provide at least one available time slot. The admin will review your availability and coordinate with the student to find the best time.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseSchedulingModal} disabled={isSubmitting}>Cancel</Button>
                <Button 
                    onClick={handleSubmitAvailability} 
                    variant="contained" 
                    disabled={isSubmitting || availableSlots.length === 0}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : "Submit Availability"}
                </Button>
            </DialogActions>
        </Dialog>

        {/* --- ENHANCED FEEDBACK MODAL --- */}
        <Dialog open={isFeedbackModalOpen} onClose={handleCloseFeedbackModal} fullWidth maxWidth="sm">
            <DialogTitle>Submit Lesson Feedback</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{mb: 2}}>
                    Please provide brief feedback on how the trial lesson went and indicate whether it was successful.
                </DialogContentText>

                <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>Was this trial lesson successful?</FormLabel>
                <RadioGroup
                    value={trialSuccess}
                    onChange={(e) => setTrialSuccess(e.target.value)}
                    sx={{ mb: 2 }}
                >
                    <FormControlLabel value="successful" control={<Radio />} label="✅ Successful - Student will likely continue" />
                    <FormControlLabel value="unsuccessful" control={<Radio />} label="❌ Unsuccessful - Student unlikely to continue" />
                </RadioGroup>

                <TextField
                    margin="dense"
                    id="feedback"
                    label="Detailed Lesson Feedback"
                    type="text"
                    fullWidth
                    multiline
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Please describe how the lesson went, what topics were covered, and any observations about the student's engagement..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseFeedbackModal} disabled={isSubmitting}>Cancel</Button>
                <Button 
                    onClick={handleSubmitFeedback} 
                    variant="contained" 
                    disabled={isSubmitting || !feedbackText || !trialSuccess}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : "Submit Feedback"}
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
}