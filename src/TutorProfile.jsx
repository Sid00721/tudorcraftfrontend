import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import DateTimePicker from 'react-datetime-picker';
import { format } from 'date-fns';
import GooglePlacesAutocomplete from './components/GooglePlacesAutocomplete';
import PhoneNumberInput from './components/PhoneNumberInput';
import PhotoCropModal from './components/PhotoCropModal';
import { usePageTitle, updateFavicon } from './hooks/usePageTitle';

// Import MUI Components
import { 
    Box, Button, TextField, Typography, Paper, CircularProgress, FormGroup, 
    FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, Divider,
    List, ListItem, ListItemText, IconButton, FormControl, FormHelperText, Chip,
    Grid, InputAdornment, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions,
    Avatar, Card, CardContent, MenuItem, Select, InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import Alert from '@mui/material/Alert';

export default function TutorProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ 
        suburb: '', 
        phone_number: '', 
        accepts_short_face_to_face_trials: false,
        profile_photo_url: '',
        teaching_bio: '',
        university: '',
        degree: '',
        study_year: '',
        atar: ''
    });
    
    // Photo upload state
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isPhotoCropModalOpen, setIsPhotoCropModalOpen] = useState(false);
    
    // --- IMPROVED Subject Management State ---
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());
    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [selectedCurriculum, setSelectedCurriculum] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    
    // --- Enhanced Availability State with Recurring Support ---
    const [unavailability, setUnavailability] = useState([]);
    const [newBlockout, setNewBlockout] = useState({ 
        start_time: new Date(), 
        end_time: new Date(),
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        reason: ''
    });
    const [isSavingBlockout, setIsSavingBlockout] = useState(false);
    
    // Set dynamic page title
    usePageTitle(profile?.full_name ? `${profile.full_name} - Profile` : 'Tutor Profile');
    
    useEffect(() => {
        updateFavicon('tutor');
    }, []);

    const fetchData = useCallback(async (userId) => {
        // Fetch profile and selected subjects
        const { data: profileData } = await supabase.from('tutors').select('*, subjects(id)').eq('id', userId).single();
        if (profileData) {
            setProfile(profileData);
            setSelectedSubjects(new Set(profileData.subjects.map(s => s.id)));
            // Set photo preview if profile photo exists
            if (profileData.profile_photo_url) {
                setPhotoPreview(profileData.profile_photo_url);
            }
        }
        
        // Fetch all subjects (flattened structure for better UX)
        const { data: allSubjectsData } = await supabase
            .from('subjects')
            .select('*')
            .order('state_curriculum, level, name');
            
        if (allSubjectsData) {
            setAllSubjects(allSubjectsData);
        }
        
        // Fetch unavailability blocks
        const { data: unavailabilityData, error: unavailabilityError } = await supabase
            .from('tutor_unavailability')
            .select('*')
            .eq('tutor_id', userId)
            .order('start_time', { ascending: true });
        // Set unavailability data
        setUnavailability(unavailabilityData || []);
        
        setLoading(false);
    }, []);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session.user);
            if (session.user) {
                await fetchData(session.user.id);
            } else {
                setLoading(false);
            }
        };
        getSession();
    }, [fetchData]);

    // --- IMPROVED Subject Management Functions ---
    const handleSubjectToggle = (subjectId) => {
        const newSelection = new Set(selectedSubjects);
        if (newSelection.has(subjectId)) {
            newSelection.delete(subjectId);
        } else {
            newSelection.add(subjectId);
        }
        setSelectedSubjects(newSelection);
    };

    const getFilteredSubjects = () => {
        return allSubjects.filter(subject => {
            const matchesSearch = subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                                subject.state_curriculum.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                                subject.level.toLowerCase().includes(subjectSearchTerm.toLowerCase());
            const matchesCurriculum = selectedCurriculum === 'All' || subject.state_curriculum === selectedCurriculum;
            const matchesLevel = selectedLevel === 'All' || subject.level === selectedLevel;
            
            return matchesSearch && matchesCurriculum && matchesLevel;
        });
    };

    const getUniqueOptions = (field) => {
        const unique = [...new Set(allSubjects.map(s => s[field]))];
        return unique.sort();
    };

    const getSelectedSubjectNames = () => {
        return allSubjects.filter(s => selectedSubjects.has(s.id)).map(s => s.name);
    };

    // Enhanced photo upload handler with cropping support
    const handlePhotoSave = async (croppedFile) => {
        if (!croppedFile) return;

        setPhotoUploading(true);
        setSuccessMessage('');

        try {
            // Use stable storage path and upsert replace
            const filePath = `tutors/${user.id}/profile.jpg`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('tutor-photos')
                .upload(filePath, croppedFile, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: 'image/jpeg'
                });

            if (uploadError) {
                if (uploadError.message.includes('not found')) {
                    throw new Error('Photo storage bucket not found. Please contact support to set up photo storage.');
                } else if (uploadError.message.includes('policy')) {
                    throw new Error('Permission denied. Please make sure you are logged in as a tutor.');
                } else {
                    throw uploadError;
                }
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('tutor-photos')
                .getPublicUrl(filePath);

            const photoUrl = urlData.publicUrl + '?' + Date.now(); // Cache bust

            // Update profile with photo URL
            const { error: updateError } = await supabase
                .from('tutors')
                .update({ 
                    profile_photo_url: photoUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .single();

            if (updateError) {
                throw updateError;
            }

            // Update local state
            setProfile(prev => ({ ...prev, profile_photo_url: photoUrl }));
            setPhotoPreview(photoUrl);
            setSuccessMessage('✅ Profile photo updated successfully!');

        } catch (error) {
            console.error('Photo upload error details:', error);
            alert('Error uploading photo: ' + (error.message || 'Unknown error occurred.'));
        } finally {
            setPhotoUploading(false);
        }
    };

    // Word count helper for bio
    const getWordCount = (text) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // Australian universities list
    const australianUniversities = [
        'Australian National University',
        'University of Sydney',
        'University of Melbourne',
        'University of Queensland',
        'University of New South Wales',
        'Monash University',
        'University of Western Australia',
        'University of Adelaide',
        'University of Technology Sydney',
        'Queensland University of Technology',
        'RMIT University',
        'Curtin University',
        'Deakin University',
        'Griffith University',
        'La Trobe University',
        'Macquarie University',
        'University of South Australia',
        'University of Tasmania',
        'University of Wollongong',
        'Western Sydney University',
        'Flinders University',
        'James Cook University',
        'Murdoch University',
        'University of Canberra',
        'University of Newcastle',
        'Bond University',
        'Edith Cowan University',
        'Southern Cross University',
        'Swinburne University of Technology',
        'Victoria University',
        'Other'
    ];

    // Graduation year options
    const currentYear = new Date().getFullYear();
    const graduationYears = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        
        // Validate bio word count
        const bioWordCount = getWordCount(profile.teaching_bio);
        if (profile.teaching_bio && bioWordCount < 50) {
            alert('Teaching bio must be at least 50 words. Current count: ' + bioWordCount);
            setSaving(false);
            return;
        }

        // Validate ATAR if provided
        if (profile.atar && (profile.atar < 0 || profile.atar > 99.95)) {
            alert('ATAR must be between 0 and 99.95');
            setSaving(false);
            return;
        }
        
        // Update profile including all new fields
        await supabase.from('tutors').update({ 
            suburb: profile.suburb, 
            phone_number: profile.phone_number,
            accepts_short_face_to_face_trials: profile.accepts_short_face_to_face_trials,
            teaching_bio: profile.teaching_bio,
            university: profile.university,
            degree: profile.degree,
            study_year: profile.study_year,
            atar: profile.atar ? parseFloat(profile.atar) : null
        }).eq('id', user.id);
        
        // Update subjects
        await supabase.from('tutor_subjects').delete().eq('tutor_id', user.id);
        const newSubjectLinks = Array.from(selectedSubjects).map(subjectId => ({ tutor_id: user.id, subject_id: subjectId }));
        if (newSubjectLinks.length > 0) {
            await supabase.from('tutor_subjects').insert(newSubjectLinks);
        }
        setSuccessMessage('Profile updated successfully!');
        setSaving(false);
    };

    // --- ENHANCED HANDLERS for Availability with Recurring Support ---
    const handleAddNewBlockout = async () => {
        if (newBlockout.end_time <= newBlockout.start_time) {
            alert('End time must be after the start time.');
            return;
        }
        
        if (newBlockout.is_recurring && newBlockout.recurrence_end_date <= newBlockout.start_time) {
            alert('Recurrence end date must be after the start time.');
            return;
        }
        
        setIsSavingBlockout(true);
        
        const blockoutData = {
            tutor_id: user.id,
            start_time: newBlockout.start_time.toISOString(),
            end_time: newBlockout.end_time.toISOString(),
            reason: newBlockout.reason || null,
            is_recurring: newBlockout.is_recurring,
            recurrence_pattern: newBlockout.is_recurring ? {
                type: newBlockout.recurrence_pattern,
                end_date: newBlockout.recurrence_end_date.toISOString()
            } : null
        };
        
        const { error } = await supabase
            .from('tutor_unavailability')
            .insert(blockoutData);
            
        if (error) {
            alert('Error adding time block: ' + error.message);
        } else {
            setSuccessMessage(`${newBlockout.is_recurring ? 'Recurring ' : ''}unavailability block added successfully!`);
            // Reset form
            setNewBlockout({ 
                start_time: new Date(), 
                end_time: new Date(),
                is_recurring: false,
                recurrence_pattern: 'weekly',
                recurrence_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                reason: ''
            });
            await fetchData(user.id); // Refresh the list
        }
        setIsSavingBlockout(false);
    };

    const handleDeleteBlockout = async (blockoutId) => {
        const isConfirmed = window.confirm('Are you sure you want to delete this unavailable time block?');
        if (isConfirmed) {
            const { error } = await supabase.from('tutor_unavailability').delete().eq('id', blockoutId);
            if (error) alert('Error deleting time block: ' + error.message);
            else await fetchData(user.id); // Refresh the list
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, margin: 'auto' }}>
            <Typography variant={{ xs: 'h5', md: 'h4' }} gutterBottom>My Profile</Typography>
            <form onSubmit={handleUpdateProfile}>
                {/* Approval Status Alert */}
                {profile.approval_status && (
                    <Alert 
                        severity={
                            profile.approval_status === 'approved' ? 'success' :
                            profile.approval_status === 'rejected' ? 'error' :
                            profile.approval_status === 'suspended' ? 'warning' : 'info'
                        }
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Profile Status: {profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1)}
                        </Typography>
                        <Typography variant="body2">
                            {profile.approval_status === 'pending' && 'Your profile is under review by our admin team. You will be able to receive student assignments once approved.'}
                            {profile.approval_status === 'approved' && 'Your profile has been approved! You can now receive student assignments.'}
                            {profile.approval_status === 'rejected' && 'Your profile needs attention. Please update your information and contact support.'}
                            {profile.approval_status === 'suspended' && 'Your account is temporarily suspended. Please contact support for assistance.'}
                        </Typography>
                        {profile.approval_notes && (
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                Admin notes: {profile.approval_notes}
                            </Typography>
                        )}
                        {!profile.profile_complete && (
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500, color: 'warning.main' }}>
                                ⚠️ Complete all required fields below to be eligible for approval.
                            </Typography>
                        )}
                    </Alert>
                )}

                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                    <Typography variant={{ xs: 'subtitle1', md: 'h6' }} gutterBottom>Contact Information</Typography>
                    <TextField label="Email" value={user?.email || ''} fullWidth disabled sx={{ mb: 2 }} />
                    <GooglePlacesAutocomplete
                        value={profile.suburb}
                        onChange={(address) => setProfile({ ...profile, suburb: address })}
                        label="Suburb"
                        placeholder="Start typing your suburb or area..."
                        required
                        helperText="Enter your suburb or area to help match you with nearby students"
                        types={['(cities)']}
                        componentRestrictions={{ country: 'AU' }}
                        sx={{ mb: 2 }}
                    />
                    <PhoneNumberInput
                        label="Phone Number"
                        value={profile.phone_number || ''}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                        fullWidth
                        required
                        sx={{ mb: 2 }}
                        helperText="This will be used to contact you about trial sessions" 
                    />
                    
                    <FormControl sx={{ mb: 2 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={profile.accepts_short_face_to_face_trials || false}
                                    onChange={(e) => setProfile({ ...profile, accepts_short_face_to_face_trials: e.target.checked })}
                                />
                            }
                            label="I accept short face-to-face trials (less than 1 hour)"
                        />
                        <FormHelperText>
                            Enable this if you're willing to conduct face-to-face tutoring sessions that are shorter than the standard 1 hour duration.
                        </FormHelperText>
                    </FormControl>
                </Paper>

                {/* Profile Information Section */}
                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                    <Typography variant={{ xs: 'subtitle1', md: 'h6' }} gutterBottom>Profile Information</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        This information will be shared with parents when you accept a trial session.
                    </Typography>
                    
                    {/* Profile Photo */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>Profile Photo</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Avatar
                                src={photoPreview}
                                sx={{ 
                                    width: { xs: 80, sm: 100 }, 
                                    height: { xs: 80, sm: 100 },
                                    border: '3px solid',
                                    borderColor: 'primary.main',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    '& img': {
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        width: '100%',
                                        height: '100%',
                                    }
                                }}
                            >
                                <PersonIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
                            </Avatar>
                            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                <Button
                                    variant="outlined"
                                    startIcon={photoUploading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
                                    disabled={photoUploading}
                                    onClick={() => setIsPhotoCropModalOpen(true)}
                                >
                                    {photoUploading ? 'Uploading...' : (photoPreview ? 'Edit Photo' : 'Upload Photo')}
                                </Button>
                                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                    Max 5MB. JPG, PNG, or WebP format. Click to crop and position.
                                </Typography>
                                {photoUploading && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'info.main' }}>
                                        📤 Uploading your photo...
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Teaching Bio */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            label="Why I Teach (Bio)"
                            multiline
                            rows={3}
                            fullWidth
                            value={profile.teaching_bio || ''}
                            onChange={(e) => setProfile({ ...profile, teaching_bio: e.target.value })}
                            placeholder="Share why you love teaching and what motivates you to help students succeed..."
                                helperText={`${getWordCount(profile.teaching_bio || '')} / 50 words minimum`}
                                error={profile.teaching_bio && getWordCount(profile.teaching_bio || '') < 50}
                        />
                    </Box>

                    {/* Education Information */}
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 2 }}>
                        Education Background
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>University</InputLabel>
                                <Select
                                    value={profile.university || ''}
                                    label="University"
                                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                                >
                                    {australianUniversities.map(uni => (
                                        <MenuItem key={uni} value={uni}>{uni}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Degree Program"
                                fullWidth
                                value={profile.degree || ''}
                                onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                                placeholder="e.g., Bachelor of Engineering, Master of Education"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Graduation Year</InputLabel>
                                <Select
                                    value={profile.study_year || ''}
                                    label="Graduation Year"
                                    onChange={(e) => setProfile({ ...profile, study_year: e.target.value })}
                                >
                                    {graduationYears.map((y) => (
                                        <MenuItem key={y} value={y}>{y}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="ATAR (Optional)"
                                type="number"
                                fullWidth
                                value={profile.atar || ''}
                                onChange={(e) => setProfile({ ...profile, atar: e.target.value })}
                                placeholder="e.g., 95.50"
                                inputProps={{ 
                                    min: 0, 
                                    max: 99.95, 
                                    step: 0.05 
                                }}
                                helperText="Australian Tertiary Admission Rank (0-99.95)"
                            />
                        </Grid>
                    </Grid>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Privacy Note:</strong> This profile information will only be shared with parents 
                            after you accept their trial session request. It helps parents understand your background 
                            and teaching approach.
                        </Typography>
                    </Alert>
                </Paper>

                {/* --- COMPLETELY REDESIGNED SUBJECT SELECTION --- */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Teaching Subjects</Typography>
                        <Button 
                            variant="outlined" 
                            startIcon={<SchoolIcon />} 
                            onClick={() => setIsSubjectModalOpen(true)}
                        >
                            Manage Subjects ({selectedSubjects.size})
                        </Button>
                    </Box>
                    
                    {selectedSubjects.size === 0 ? (
                        <Alert severity="warning">
                            No subjects selected. Click "Manage Subjects" to choose your teaching subjects.
                        </Alert>
                    ) : (
                        <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Selected Subjects ({selectedSubjects.size}):
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {getSelectedSubjectNames().map(name => (
                                    <Chip 
                                        key={name} 
                                        label={name} 
                                        color="primary" 
                                        variant="outlined"
                                        icon={<CheckCircleIcon />}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Subject Selection Modal */}
                <Dialog 
                    open={isSubjectModalOpen} 
                    onClose={() => setIsSubjectModalOpen(false)} 
                    maxWidth="md" 
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <SchoolIcon />
                            Select Your Teaching Subjects
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {/* Search and Filter Controls */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    placeholder="Search subjects..."
                                    value={subjectSearchTerm}
                                    onChange={(e) => setSubjectSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={['All', ...getUniqueOptions('state_curriculum')]}
                                    value={selectedCurriculum}
                                    onChange={(event, newValue) => setSelectedCurriculum(newValue)}
                                    renderInput={(params) => <TextField {...params} label="Curriculum" />}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Autocomplete
                                    options={['All', ...getUniqueOptions('level')]}
                                    value={selectedLevel}
                                    onChange={(event, newValue) => setSelectedLevel(newValue)}
                                    renderInput={(params) => <TextField {...params} label="Level" />}
                                />
                            </Grid>
                        </Grid>

                        {/* Subject Selection List */}
                        <Box sx={{ maxHeight: 400, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            {getFilteredSubjects().length === 0 ? (
                                <Box p={3} textAlign="center">
                                    <Typography color="text.secondary">
                                        No subjects found matching your criteria.
                                    </Typography>
                                </Box>
                            ) : (
                                <List>
                                    {getFilteredSubjects().map((subject) => (
                                        <ListItem key={subject.id} divider>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={selectedSubjects.has(subject.id)}
                                                        onChange={() => handleSubjectToggle(subject.id)}
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            {subject.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {subject.state_curriculum} • {subject.level}
                                                            {subject.subject_group && ` • ${subject.subject_group}`}
                                                        </Typography>
                                                    </Box>
                                                }
                                                sx={{ margin: 0, width: '100%' }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>

                        <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                            <Typography variant="body2" color="primary" fontWeight="bold">
                                Selected: {selectedSubjects.size} subjects
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setIsSubjectModalOpen(false)}>
                            Done ({selectedSubjects.size} selected)
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* --- NEW My Availability SECTION --- */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>My Availability</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{mb: 2}}>Block out times when you are unavailable for new trial lessons.</Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>Current Unavailable Times</Typography>
                    <List dense>
                        {unavailability.length > 0 ? unavailability.map(block => (
                            <ListItem
                                key={block.id}
                                secondaryAction={<IconButton edge="end" aria-label="delete" onClick={() => handleDeleteBlockout(block.id)}><DeleteIcon /></IconButton>}
                            >
                                <ListItemText 
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {`${format(new Date(block.start_time), 'd MMM yyyy, h:mm a')} - ${format(new Date(block.end_time), 'd MMM yyyy, h:mm a')}`}
                                            </Typography>
                                            {block.is_recurring && (
                                                <Chip 
                                                    size="small" 
                                                    label={`Recurring ${block.recurrence_pattern?.type || 'weekly'}`}
                                                    color="info"
                                                    variant="outlined"
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            {block.reason && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Reason: {block.reason}
                                                </Typography>
                                            )}
                                            {block.is_recurring && block.recurrence_pattern?.end_date && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                    Repeats until: {format(new Date(block.recurrence_pattern.end_date), 'd MMM yyyy')}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        )) : <Typography variant="body2" sx={{p:1}}>You have no unavailable times scheduled.</Typography>}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{fontWeight: 'bold', mb: 2}}>Add New Unavailable Time</Typography>
                    
                    {/* Recurring Checkbox */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newBlockout.is_recurring}
                                onChange={(e) => setNewBlockout(prev => ({ ...prev, is_recurring: e.target.checked }))}
                            />
                        }
                        label="Make this a recurring unavailability"
                        sx={{ mb: 2 }}
                    />
                    
                    {/* Reason Field */}
                    <TextField
                        fullWidth
                        label="Reason (optional)"
                        value={newBlockout.reason}
                        onChange={(e) => setNewBlockout(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="e.g., University classes, Work commitments"
                        sx={{ mb: 2 }}
                        helperText="Providing a reason helps with scheduling decisions"
                    />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                        <Box>
                            <Typography variant="caption">Start Time</Typography>
                            <TextField
                                type="datetime-local"
                                value={format(newBlockout.start_time, "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => setNewBlockout({ ...newBlockout, start_time: new Date(e.target.value) })}
                                inputProps={{ step: 60 }}
                                sx={{ minWidth: 240 }}
                            />
                        </Box>
                        <Box>
                            <Typography variant="caption">End Time</Typography>
                            <TextField
                                type="datetime-local"
                                value={format(newBlockout.end_time, "yyyy-MM-dd'T'HH:mm")}
                                onChange={(e) => setNewBlockout({ ...newBlockout, end_time: new Date(e.target.value) })}
                                inputProps={{ step: 60, min: format(newBlockout.start_time, "yyyy-MM-dd'T'HH:mm") }}
                                sx={{ minWidth: 240 }}
                            />
                        </Box>
                    </Box>
                    
                    {/* Recurring Options */}
                    {newBlockout.is_recurring && (
                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, mb: 2, bgcolor: 'rgba(33, 150, 243, 0.04)' }}>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                                🔄 Recurring Settings
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <FormControl sx={{ minWidth: 150 }}>
                                    <InputLabel>Repeat Pattern</InputLabel>
                                    <Select
                                        value={newBlockout.recurrence_pattern}
                                        label="Repeat Pattern"
                                        onChange={(e) => setNewBlockout(prev => ({ ...prev, recurrence_pattern: e.target.value }))}
                                    >
                                        <MenuItem value="weekly">Weekly (every 7 days)</MenuItem>
                                        <MenuItem value="fortnightly">Fortnightly (every 14 days)</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                <Box>
                                    <Typography variant="caption">Repeat Until</Typography>
                                    <TextField
                                        type="datetime-local"
                                        value={format(newBlockout.recurrence_end_date, "yyyy-MM-dd'T'HH:mm")}
                                        onChange={(e) => setNewBlockout(prev => ({ ...prev, recurrence_end_date: new Date(e.target.value) }))}
                                        inputProps={{ step: 60, min: format(newBlockout.start_time, "yyyy-MM-dd'T'HH:mm") }}
                                        sx={{ minWidth: 240 }}
                                    />
                                </Box>
                            </Box>
                            
                            <Alert severity="info" sx={{ mt: 1 }}>
                                <Typography variant="caption">
                                    This will create recurring unavailability blocks {newBlockout.recurrence_pattern} 
                                    from {format(newBlockout.start_time, 'MMM d, yyyy')} until {format(newBlockout.recurrence_end_date, 'MMM d, yyyy')}.
                                    Each block will be {Math.round((newBlockout.end_time - newBlockout.start_time) / (1000 * 60 * 60))} hours long.
                                </Typography>
                            </Alert>
                        </Box>
                    )}
                    
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={handleAddNewBlockout} 
                        disabled={isSavingBlockout}
                        size="large"
                        sx={{ 
                            minWidth: 200,
                            background: newBlockout.is_recurring 
                                ? 'linear-gradient(135deg, #2196F3 0%, #FF9800 100%)' 
                                : undefined
                        }}
                    >
                        {isSavingBlockout ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            `Add ${newBlockout.is_recurring ? 'Recurring ' : ''}Unavailable Time`
                        )}
                    </Button>
                </Paper>

                {/* Photo Crop Modal */}
                <PhotoCropModal
                    open={isPhotoCropModalOpen}
                    onClose={() => setIsPhotoCropModalOpen(false)}
                    onSave={handlePhotoSave}
                    currentPhotoUrl={photoPreview}
                />
                
                <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={saving}>
                    {saving ? <CircularProgress size={24} /> : 'Save Full Profile'}
                </Button>
                {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
            </form>
        </Box>
    );
}