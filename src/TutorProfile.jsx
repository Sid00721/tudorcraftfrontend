import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import DateTimePicker from 'react-datetime-picker';
import { format } from 'date-fns';
import GooglePlacesAutocomplete from './components/GooglePlacesAutocomplete';

// Import MUI Components
import { 
    Box, Button, TextField, Typography, Paper, CircularProgress, FormGroup, 
    FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, Divider,
    List, ListItem, ListItemText, IconButton, FormControl, FormHelperText, Chip,
    Grid, InputAdornment, Autocomplete, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import Alert from '@mui/material/Alert';

export default function TutorProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ 
        suburb: '', 
        phone_number: '', 
        accepts_short_face_to_face_trials: false 
    });
    
    // --- IMPROVED Subject Management State ---
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());
    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [selectedCurriculum, setSelectedCurriculum] = useState('All');
    const [selectedLevel, setSelectedLevel] = useState('All');
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    
    // --- Availability State (unchanged) ---
    const [unavailability, setUnavailability] = useState([]);
    const [newBlockout, setNewBlockout] = useState({ start_time: new Date(), end_time: new Date() });
    const [isSavingBlockout, setIsSavingBlockout] = useState(false);

    const fetchData = useCallback(async (userId) => {
        // Fetch profile and selected subjects
        const { data: profileData } = await supabase.from('tutors').select('*, subjects(id)').eq('id', userId).single();
        if (profileData) {
            setProfile(profileData);
            setSelectedSubjects(new Set(profileData.subjects.map(s => s.id)));
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
        if (unavailabilityError) console.error("Error fetching unavailability:", unavailabilityError);
        else setUnavailability(unavailabilityData || []);
        
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

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        
        // Update profile including the new short trial preference
        await supabase.from('tutors').update({ 
            suburb: profile.suburb, 
            phone_number: profile.phone_number,
            accepts_short_face_to_face_trials: profile.accepts_short_face_to_face_trials
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

    // --- NEW HANDLERS for Availability ---
    const handleAddNewBlockout = async () => {
        if (newBlockout.end_time <= newBlockout.start_time) {
            alert('End time must be after the start time.');
            return;
        }
        setIsSavingBlockout(true);
        const { error } = await supabase
            .from('tutor_unavailability')
            .insert({
                tutor_id: user.id,
                start_time: newBlockout.start_time.toISOString(),
                end_time: newBlockout.end_time.toISOString(),
            });
        if (error) alert('Error adding time block: ' + error.message);
        else await fetchData(user.id); // Refresh the list
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
        <Box sx={{ p: 3, maxWidth: 900, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>My Profile</Typography>
            <form onSubmit={handleUpdateProfile}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Contact Information</Typography>
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
                    <TextField 
                        label="Phone Number" 
                        value={profile.phone_number || ''} 
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} 
                        fullWidth 
                        required 
                        sx={{ mb: 2 }} 
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
                                    primary={`From: ${format(new Date(block.start_time), 'd MMM yyyy, h:mm a')}`}
                                    secondary={`To: ${format(new Date(block.end_time), 'd MMM yyyy, h:mm a')}`}
                                />
                            </ListItem>
                        )) : <Typography variant="body2" sx={{p:1}}>You have no unavailable times scheduled.</Typography>}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{fontWeight: 'bold', mb: 2}}>Add New Unavailable Time</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="caption">Start Time</Typography>
                            <DateTimePicker onChange={(val) => setNewBlockout({...newBlockout, start_time: val})} value={newBlockout.start_time} />
                        </Box>
                        <Box>
                            <Typography variant="caption">End Time</Typography>
                            <DateTimePicker onChange={(val) => setNewBlockout({...newBlockout, end_time: val})} value={newBlockout.end_time} />
                        </Box>
                        <Button variant="contained" color="secondary" onClick={handleAddNewBlockout} disabled={isSavingBlockout}>
                            {isSavingBlockout ? <CircularProgress size={24} /> : 'Save Unavailable Time'}
                        </Button>
                    </Box>
                </Paper>
                
                <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={saving}>
                    {saving ? <CircularProgress size={24} /> : 'Save Full Profile'}
                </Button>
                {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
            </form>
        </Box>
    );
}