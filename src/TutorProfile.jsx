import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import DateTimePicker from 'react-datetime-picker';
import { format } from 'date-fns';

// Import MUI Components
import { 
    Box, Button, TextField, Typography, Paper, CircularProgress, FormGroup, 
    FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails, Divider,
    List, ListItem, ListItemText, IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';

export default function TutorProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({ suburb: '', phone_number: '' });
    const [structuredSubjects, setStructuredSubjects] = useState({});
    const [selectedSubjects, setSelectedSubjects] = useState(new Set());
    
    // --- NEW STATE for Availability ---
    const [unavailability, setUnavailability] = useState([]);
    const [newBlockout, setNewBlockout] = useState({ start_time: new Date(), end_time: new Date() });
    const [isSavingBlockout, setIsSavingBlockout] = useState(false);

    const fetchData = useCallback(async (userId) => {
        // Fetch profile and subjects (unchanged)
        const { data: profileData } = await supabase.from('tutors').select('*, subjects(id)').eq('id', userId).single();
        if (profileData) {
            setProfile(profileData);
            setSelectedSubjects(new Set(profileData.subjects.map(s => s.id)));
        }
        // Fetch all available subjects (unchanged)
        const { data: allSubjectsData } = await supabase.from('subjects').select('*').order('name');
        if (allSubjectsData) {
            const organized = allSubjectsData.reduce((acc, subject) => {
                const { state_curriculum, level, subject_group, id, name } = subject;
                if (!acc[state_curriculum]) acc[state_curriculum] = {};
                if (!acc[state_curriculum][level]) acc[state_curriculum][level] = {};
                const group = subject_group || 'General Subjects';
                if (!acc[state_curriculum][level][group]) acc[state_curriculum][level][group] = [];
                acc[state_curriculum][level][group].push({ id, name });
                return acc;
            }, {});
            setStructuredSubjects(organized);
        }
        // --- NEW: Fetch unavailability blocks ---
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

    const handleSubjectChange = (subjectId) => {
        const newSelection = new Set(selectedSubjects);
        if (newSelection.has(subjectId)) newSelection.delete(subjectId);
        else newSelection.add(subjectId);
        setSelectedSubjects(newSelection);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        await supabase.from('tutors').update({ suburb: profile.suburb, phone_number: profile.phone_number }).eq('id', user.id);
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
                    <TextField label="Suburb" value={profile.suburb || ''} onChange={(e) => setProfile({ ...profile, suburb: e.target.value })} fullWidth required sx={{ mb: 2 }} />
                    <TextField label="Phone Number" value={profile.phone_number || ''} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} fullWidth required sx={{ mb: 2 }} />
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Teaching Subjects</Typography>
                    {Object.keys(structuredSubjects).map(curriculum => (
                        <Accordion key={curriculum} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">{curriculum}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                {Object.keys(structuredSubjects[curriculum]).map(level => (
                                    <Accordion key={level}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography variant="subtitle1">{level}</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {Object.keys(structuredSubjects[curriculum][level]).map(group => (
                                                <Box key={group} sx={{ mb: 2 }}>
                                                    <Typography variant="body1" sx={{fontWeight: 'bold'}}>{group}</Typography>
                                                    <FormGroup>
                                                        {structuredSubjects[curriculum][level][group].map(subject => (
                                                            <FormControlLabel
                                                                key={subject.id}
                                                                control={<Checkbox checked={selectedSubjects.has(subject.id)} onChange={() => handleSubjectChange(subject.id)} />}
                                                                label={subject.name}
                                                            />
                                                        ))}
                                                    </FormGroup>
                                                </Box>
                                            ))}
                                        </AccordionDetails>
                                    </Accordion>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Paper>

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