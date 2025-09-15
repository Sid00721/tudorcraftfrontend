import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import DateTimePicker from 'react-datetime-picker';
import { format } from 'date-fns';
import GooglePlacesAutocomplete from './components/GooglePlacesAutocomplete';
import PhoneNumberInput from './components/PhoneNumberInput';
import { SectionCard, FormField, StatusAlert, ActionButton, Badge } from './components/FormComponents-Premium';

import { 
    Box, Button, TextField, Typography, CircularProgress, FormGroup, 
    FormControlLabel, Checkbox, Divider, List, ListItem, ListItemText, 
    IconButton, FormControl, Chip, Grid, Autocomplete, Dialog, 
    DialogTitle, DialogContent, DialogActions, Avatar, MenuItem, 
    Select, InputLabel, Container, Stack, Card, CardContent,
} from '@mui/material';

import {
    Delete as DeleteIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    School as SchoolIcon,
    PhotoCamera as PhotoCameraIcon,
    Person as PersonIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Email as EmailIcon,
    CalendarToday as CalendarIcon,
    Repeat as RepeatIcon,
} from '@mui/icons-material';

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
    
    // Subject management state
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());
    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [selectedCurriculum, setSelectedCurriculum] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    
    // Availability state
    const [unavailability, setUnavailability] = useState([]);
    const [newBlockout, setNewBlockout] = useState({ 
        start_time: new Date(), 
        end_time: new Date(),
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurrence_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        reason: ''
    });
    const [isSavingBlockout, setIsSavingBlockout] = useState(false);

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
        'Other'
    ];

    const fetchData = useCallback(async (userId) => {
        // Fetch profile and selected subjects
        const { data: profileData } = await supabase.from('tutors').select('*, subjects(id)').eq('id', userId).single();
        if (profileData) {
            setProfile(profileData);
            setSelectedSubjects(new Set(profileData.subjects?.map(s => s.id) || []));
            if (profileData.profile_photo_url) {
                setPhotoPreview(profileData.profile_photo_url);
            }
        }
        
        // Fetch all subjects
        const { data: allSubjectsData } = await supabase
            .from('subjects')
            .select('*')
            .order('state_curriculum, level, name');
            
        if (allSubjectsData) {
            setAllSubjects(allSubjectsData);
        }
        
        // Fetch unavailability blocks
        const { data: unavailabilityData } = await supabase
            .from('tutor_unavailability')
            .select('*')
            .eq('tutor_id', userId)
            .order('start_time', { ascending: true });
        setUnavailability(unavailabilityData || []);
        
        setLoading(false);
    }, []);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user);
            if (session?.user) {
                await fetchData(session.user.id);
            } else {
                setLoading(false);
            }
        };
        getSession();
    }, [fetchData]);

    // Enhanced photo upload handler
    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type.toLowerCase())) {
            alert('Please select a valid image file (JPG, PNG, GIF, or WebP).');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(`File size is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please select an image smaller than 5MB.`);
            return;
        }

        setPhotoUploading(true);
        setSuccessMessage('');

        try {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const filePath = `tutors/${user.id}/profile.${fileExt}`;

            // Upload new photo (upsert replace)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('tutor-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                if (uploadError.message.includes('not found')) {
                    throw new Error('Photo storage not set up. Please contact support.');
                }
                throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('tutor-photos')
                .getPublicUrl(filePath);

            const photoUrl = urlData.publicUrl;

            // Update profile
            const { error: updateError } = await supabase
                .from('tutors')
                .update({ profile_photo_url: photoUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, profile_photo_url: photoUrl }));
            setPhotoPreview(photoUrl);
            setSuccessMessage('✅ Profile photo updated successfully!');
            event.target.value = '';

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo: ' + (error.message || 'Unknown error'));
        } finally {
            setPhotoUploading(false);
        }
    };

    const getWordCount = (text) => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');

        try {
            // Validate bio word count
            const wordCount = getWordCount(profile.teaching_bio || '');
            if (wordCount < 40 || wordCount > 50) {
                alert('Teaching bio must be between 40-50 words. Current count: ' + wordCount);
                setSaving(false);
                return;
            }

            // Validate ATAR
            if (profile.atar && (profile.atar < 0 || profile.atar > 99.95)) {
                alert('ATAR must be between 0 and 99.95');
                setSaving(false);
                return;
            }
            
            // Update profile
            await supabase.from('tutors').update({ 
                suburb: profile.suburb, 
                phone_number: profile.phone_number,
                accepts_short_face_to_face_trials: profile.accepts_short_face_to_face_trials,
                teaching_bio: profile.teaching_bio,
                university: profile.university,
                degree: profile.degree,
                study_year: profile.study_year,
                atar: profile.atar ? parseFloat(profile.atar) : null,
                full_name: profile.full_name
            }).eq('id', user.id);
            
            // Update subjects
            await supabase.from('tutor_subjects').delete().eq('tutor_id', user.id);
            const newSubjectLinks = Array.from(selectedSubjects).map(subjectId => ({ 
                tutor_id: user.id, 
                subject_id: subjectId 
            }));
            if (newSubjectLinks.length > 0) {
                await supabase.from('tutor_subjects').insert(newSubjectLinks);
            }
            
            setSuccessMessage('✅ Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Box sx={{ backgroundColor: '#FAFBFC', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <Box sx={{ mb: 6 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: '#111827',
                            mb: 2,
                        }}
                    >
                        My Profile
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#6B7280',
                        }}
                    >
                        Complete your profile to start receiving student assignments
                    </Typography>
                </Box>

                <form onSubmit={handleUpdateProfile}>
                    {/* Approval Status */}
                    {profile.approval_status && (
                        <StatusAlert
                            type={
                                profile.approval_status === 'approved' ? 'success' :
                                profile.approval_status === 'rejected' ? 'error' :
                                profile.approval_status === 'suspended' ? 'warning' : 'info'
                            }
                            title={`Profile Status: ${profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1)}`}
                            message={
                                profile.approval_status === 'pending' ? 'Your profile is under review. You will receive student assignments once approved.' :
                                profile.approval_status === 'approved' ? 'Your profile has been approved! You can now receive student assignments.' :
                                profile.approval_status === 'rejected' ? 'Your profile needs attention. Please update your information and contact support.' :
                                'Your account is temporarily suspended. Please contact support for assistance.'
                            }
                            sx={{ mb: 4 }}
                        />
                    )}

                    {/* Contact Information */}
                    <SectionCard 
                        title="Contact Information" 
                        description="Your basic contact details"
                        icon={PersonIcon}
                    >
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormField label="Email Address" description="Your login email address">
                                    <TextField 
                                        value={user?.email || ''} 
                                        fullWidth 
                                        disabled
                                        InputProps={{
                                            startAdornment: <EmailIcon sx={{ color: '#9DA4AE', mr: 1, fontSize: 20 }} />
                                        }}
                                    />
                                </FormField>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <FormField label="Full Name" required>
                                    <TextField
                                        value={profile.full_name || ''}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        fullWidth
                                        required
                                        placeholder="Enter your full name"
                                    />
                                </FormField>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <FormField label="Phone Number" required>
                                    <PhoneNumberInput
                                        value={profile.phone_number || ''}
                                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                                        fullWidth
                                        required
                                    />
                                </FormField>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <FormField label="Location" required>
                                    <GooglePlacesAutocomplete
                                        value={profile.suburb}
                                        onChange={(address) => setProfile({ ...profile, suburb: address })}
                                        label="Suburb or Area"
                                        placeholder="Start typing your suburb..."
                                        required
                                        types={['(cities)']}
                                        componentRestrictions={{ country: 'AU' }}
                                    />
                                </FormField>
                            </Grid>
                        </Grid>
                    </SectionCard>

                    {/* Profile Information */}
                    <SectionCard 
                        title="Profile Information" 
                        description="This information will be shared with parents when you accept sessions"
                        icon={SchoolIcon}
                    >
                        {/* Profile Photo */}
                        <FormField label="Profile Photo" required>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Avatar
                                    src={photoPreview}
                                    sx={{ 
                                        width: 80, 
                                        height: 80,
                                        border: '2px solid #E4E7EB'
                                    }}
                                >
                                    <PersonIcon sx={{ fontSize: 32 }} />
                                </Avatar>
                                <Box>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="photo-upload"
                                        type="file"
                                        onChange={handlePhotoUpload}
                                    />
                                    <label htmlFor="photo-upload">
                                        <ActionButton
                                            variant="outline"
                                            component="span"
                                            loading={photoUploading}
                                            startIcon={<PhotoCameraIcon />}
                                        >
                                            {photoUploading ? 'Uploading...' : 'Upload Photo'}
                                        </ActionButton>
                                    </label>
                                    <Typography variant="caption" display="block" sx={{ mt: 1, color: '#6B7280' }}>
                                        Max 5MB. JPG, PNG, GIF, or WebP format.
                                    </Typography>
                                </Box>
                            </Box>
                        </FormField>

                        {/* Teaching Bio */}
                        <FormField 
                            label="Why I Teach" 
                            description="A brief explanation of your teaching motivation (40-50 words)"
                            required
                        >
                            <TextField
                                multiline
                                rows={3}
                                fullWidth
                                value={profile.teaching_bio || ''}
                                onChange={(e) => setProfile({ ...profile, teaching_bio: e.target.value })}
                                placeholder="Explain why you love teaching and what drives your passion for education..."
                                helperText={`Word count: ${getWordCount(profile.teaching_bio || '')} / 40-50 words`}
                                error={(() => {
                                    const count = getWordCount(profile.teaching_bio || '');
                                    return count > 0 && (count < 40 || count > 50);
                                })()}
                            />
                        </FormField>

                        {/* Education Details */}
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <FormField label="University" required>
                                    <Autocomplete
                                        options={australianUniversities}
                                        value={profile.university || ''}
                                        onChange={(event, newValue) => setProfile({ ...profile, university: newValue || '' })}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Select your university"
                                                required
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <FormField label="Degree Program" required>
                                    <TextField
                                        value={profile.degree || ''}
                                        onChange={(e) => setProfile({ ...profile, degree: e.target.value })}
                                        fullWidth
                                        required
                                        placeholder="e.g., Bachelor of Engineering"
                                    />
                                </FormField>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <FormField label="Graduation Year">
                                    <Select
                                        value={profile.study_year || ''}
                                        onChange={(e) => setProfile({ ...profile, study_year: e.target.value })}
                                        fullWidth
                                        displayEmpty
                                    >
                                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                            <MenuItem key={y} value={y}>{y}</MenuItem>
                                        ))}
                                    </Select>
                                </FormField>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <FormField label="ATAR Score" description="Optional - helps parents understand your academic achievement">
                                    <TextField
                                        type="number"
                                        value={profile.atar || ''}
                                        onChange={(e) => setProfile({ ...profile, atar: e.target.value })}
                                        fullWidth
                                        placeholder="e.g., 95.50"
                                        inputProps={{ min: 0, max: 99.95, step: 0.05 }}
                                    />
                                </FormField>
                            </Grid>
                        </Grid>
                    </SectionCard>

                    {/* Subjects */}
                    <SectionCard 
                        title="Teaching Subjects" 
                        description="Select the subjects you can teach"
                        icon={SchoolIcon}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <ActionButton
                                variant="outline"
                                onClick={() => setIsSubjectModalOpen(true)}
                                startIcon={<SchoolIcon />}
                            >
                                Manage Subjects
                            </ActionButton>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                Selected: {selectedSubjects.size} subjects
                            </Typography>
                        </Box>
                        
                        {selectedSubjects.size > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {Array.from(selectedSubjects).map(subjectId => {
                                    const subject = allSubjects.find(s => s.id === subjectId);
                                    return subject ? (
                                        <Badge key={subjectId} variant="primary" size="small">
                                            {subject.name}
                                        </Badge>
                                    ) : null;
                                })}
                            </Box>
                        )}
                    </SectionCard>

                    {/* Preferences */}
                    <SectionCard 
                        title="Teaching Preferences" 
                        description="Configure your availability and preferences"
                        icon={CalendarIcon}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={profile.accepts_short_face_to_face_trials || false}
                                    onChange={(e) => setProfile({ 
                                        ...profile, 
                                        accepts_short_face_to_face_trials: e.target.checked 
                                    })}
                                />
                            }
                            label="I accept short face-to-face trials (less than 1 hour)"
                        />
                        <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
                            Enable this if you're willing to conduct in-person sessions shorter than 1 hour
                        </Typography>
                    </SectionCard>

                    {/* Success Message */}
                    {successMessage && (
                        <StatusAlert 
                            type="success"
                            message={successMessage}
                            onClose={() => setSuccessMessage('')}
                            sx={{ mb: 3 }}
                        />
                    )}

                    {/* Submit Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <ActionButton
                            type="submit"
                            variant="primary"
                            size="large"
                            loading={saving}
                        >
                            {saving ? 'Saving Profile...' : 'Save Profile'}
                        </ActionButton>
                    </Box>
                </form>

                {/* Subject Selection Modal */}
                <Dialog 
                    open={isSubjectModalOpen} 
                    onClose={() => setIsSubjectModalOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle sx={{ pb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Select Teaching Subjects
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 3 }}>
                            <TextField
                                fullWidth
                                placeholder="Search subjects..."
                                value={subjectSearchTerm}
                                onChange={(e) => setSubjectSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: '#9DA4AE', mr: 1 }} />
                                }}
                            />
                        </Box>
                        
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {allSubjects
                                .filter(subject => 
                                    subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
                                )
                                .map(subject => (
                                    <Box 
                                        key={subject.id}
                                        sx={{
                                            p: 2,
                                            border: '1px solid #E4E7EB',
                                            borderRadius: 2,
                                            mb: 1,
                                            cursor: 'pointer',
                                            backgroundColor: selectedSubjects.has(subject.id) ? '#EBF0FF' : '#FFFFFF',
                                            '&:hover': {
                                                backgroundColor: selectedSubjects.has(subject.id) ? '#DBEAFE' : '#F4F6F8',
                                            }
                                        }}
                                        onClick={() => {
                                            const newSelection = new Set(selectedSubjects);
                                            if (newSelection.has(subject.id)) {
                                                newSelection.delete(subject.id);
                                            } else {
                                                newSelection.add(subject.id);
                                            }
                                            setSelectedSubjects(newSelection);
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {subject.name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                            {subject.state_curriculum} • {subject.level}
                                        </Typography>
                                    </Box>
                                ))
                            }
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <ActionButton variant="ghost" onClick={() => setIsSubjectModalOpen(false)}>
                            Cancel
                        </ActionButton>
                        <ActionButton variant="primary" onClick={() => setIsSubjectModalOpen(false)}>
                            Save Selection ({selectedSubjects.size})
                        </ActionButton>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}
