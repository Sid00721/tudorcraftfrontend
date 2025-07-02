import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import DateTimePicker from "react-datetime-picker";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// --- MUI Components ---
import {
    Button, TextField, CircularProgress, Box, Typography, Accordion,
    AccordionSummary, AccordionDetails, List, ListItemButton,
    ListItemText, Paper, Grid, Card, CardContent, IconButton
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';

// NOTE: The timezones data is now part of the component state for simplicity
// but can be moved back out if preferred.

export default function AddTrialRequestForm({ onTrialRequestAdded, onCancel }) {
    const navigate = useNavigate(); // Hook for navigation
    
    // --- Component State ---
    const [loading, setLoading] = useState(false);
    const [structuredSubjects, setStructuredSubjects] = useState({});
    const [allSubjects, setAllSubjects] = useState([]); // Store flat list of subjects

    // --- NEW State Structure for Multi-Lesson Form ---
    const [sessionDetails, setSessionDetails] = useState({
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        location: '',
    });

    const [lessons, setLessons] = useState([
        { student_name: '', student_grade: '', subject_id: null, lesson_datetime: new Date(), duration_minutes: 60 }
    ]);
    
    const timezones = [
        { value: "Australia/Sydney", label: "NSW/VIC/ACT/TAS (AEST)" },
        { value: "Australia/Brisbane", label: "QLD (AEST)" },
        { value: "Australia/Adelaide", label: "SA (ACST)" },
        { value: "Australia/Darwin", label: "NT (ACST)" },
        { value: "Australia/Perth", label: "WA (AWST)" }
    ];

    // --- Side-Effects ---
    useEffect(() => {
        const fetchSubjects = async () => {
            const { data: allSubjectsData, error } = await supabase
                .from("subjects")
                .select("id, name, state_curriculum, level, subject_group") // Ensure ID is selected
                .order("name");

            if (error) {
                console.error("Error fetching subjects:", error);
                return;
            }
            
            setAllSubjects(allSubjectsData || []); // Store flat list

            // PRESERVED: Your logic for creating the structured accordion
            const organised = (allSubjectsData || []).reduce((acc, subj) => {
                const { id, state_curriculum, level, subject_group, name } = subj;
                if (!state_curriculum || !level || !name) return acc;

                acc[state_curriculum] = acc[state_curriculum] || {};
                acc[state_curriculum][level] = acc[state_curriculum][level] || {};
                const group = subject_group || "General Subjects";
                acc[state_curriculum][level][group] = acc[state_curriculum][level][group] || [];
                acc[state_curriculum][level][group].push({ id, name }); // Store ID along with name

                return acc;
            }, {});

            setStructuredSubjects(organised);
        };

        fetchSubjects();
    }, []);

    // --- Handlers ---
    const handleSessionChange = (e) => {
        const { name, value } = e.target;
        setSessionDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleLessonChange = (index, fieldName, value) => {
        const updatedLessons = [...lessons];
        updatedLessons[index][fieldName] = value;
        setLessons(updatedLessons);
    };

    const addLesson = () => {
        setLessons([
            ...lessons,
            { student_name: '', student_grade: '', subject_id: null, lesson_datetime: new Date(), duration_minutes: 60 }
        ]);
    };

    const removeLesson = (index) => {
        if (lessons.length <= 1) return;
        const updatedLessons = lessons.filter((_, i) => i !== index);
        setLessons(updatedLessons);
    };

    // REPLACED: Submission logic now handles sessions and multiple lessons
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            // 1. Insert the parent session
            const { data: sessionData, error: sessionError } = await supabase
                .from('trial_sessions')
                .insert([sessionDetails])
                .select()
                .single();

            if (sessionError) throw sessionError;

            // 2. Prepare the lessons with the new session_id
            const lessonsToInsert = lessons.map(lesson => ({
                ...lesson,
                session_id: sessionData.id,
            }));
            
            // 3. Insert all the lessons
            const { error: lessonsError } = await supabase.from('trial_lessons').insert(lessonsToInsert);

            if (lessonsError) throw lessonsError;

            alert('Trial session created successfully!');
            if(onTrialRequestAdded) {
                onTrialRequestAdded(); // Call original prop
            } else {
                navigate('/'); // Fallback navigation
            }

        } catch (error) {
            console.error('Error creating trial session:', error);
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const findSubjectName = (id) => allSubjects.find(s => s.id === id)?.name || '';

    // --- Render ---
    return (
        <Paper sx={{ p: 4, maxWidth: 900, margin: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom>Create New Trial Session</Typography>
            <form onSubmit={handleSubmit}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Parent & Session Details</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}><TextField name="parent_name" label="Parent Name" value={sessionDetails.parent_name} onChange={handleSessionChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="parent_email" label="Parent Email" type="email" value={sessionDetails.parent_email} onChange={handleSessionChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="parent_phone" label="Parent Phone" value={sessionDetails.parent_phone} onChange={handleSessionChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="location" label="Location (Address or 'Online')" value={sessionDetails.location} onChange={handleSessionChange} fullWidth required /></Grid>
                </Grid>

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Lessons</Typography>
                {lessons.map((lesson, index) => (
                    <Card key={index} sx={{ mb: 2, position: 'relative', border: '1px solid #ddd' }}>
                        <CardContent>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <Typography variant="subtitle1" gutterBottom>Lesson {index + 1}</Typography>
                                {lessons.length > 1 && (
                                    <IconButton onClick={() => removeLesson(index)} size="small"><DeleteIcon /></IconButton>
                                )}
                            </Box>
                            
                            <Grid container spacing={2} sx={{ mt: 0 }}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField name="student_name" label="Student Name" value={lesson.student_name || ''} onChange={(e) => handleLessonChange(index, 'student_name', e.target.value)} fullWidth required />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField name="student_grade" label="Student Grade" value={lesson.student_grade} onChange={(e) => handleLessonChange(index, 'student_grade', e.target.value)} fullWidth required />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField 
                                        name="duration_minutes"
                                        label="Duration (mins)"
                                        type="number"
                                        value={lesson.duration_minutes}
                                        onChange={(e) => handleLessonChange(index, 'duration_minutes', e.target.value)}
                                        fullWidth
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{pt:1}}>
                                        <DateTimePicker onChange={(val) => handleLessonChange(index, 'lesson_datetime', val)} value={lesson.lesson_datetime} disableClock />
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 2, border: "1px solid #ddd" }}>
                                        <Typography variant="h6">Select Subject</Typography>
                                        <Typography color="primary" sx={{ mb: 1 }}>
                                            Selected: <strong>{lesson.subject_id ? findSubjectName(lesson.subject_id) : 'Please select one subject'}</strong>
                                        </Typography>
                                        
                                        {/* PRESERVED: Your accordion structure */}
                                        {Object.keys(structuredSubjects).map((curriculum) => (
                                          <Accordion key={curriculum} TransitionProps={{ unmountOnExit: true }}>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{curriculum}</Typography></AccordionSummary>
                                            <AccordionDetails sx={{ p: 0 }}>
                                              {Object.keys(structuredSubjects[curriculum]).map((level) => (
                                                <Accordion key={level} TransitionProps={{ unmountOnExit: true }}>
                                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>{level}</Typography></AccordionSummary>
                                                  <AccordionDetails>
                                                    {Object.keys(structuredSubjects[curriculum][level]).map((group) => (
                                                      <Box key={group} sx={{ mb: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold", ml: 2 }}>{group}</Typography>
                                                        <List dense>
                                                          {structuredSubjects[curriculum][level][group].map((s) => (
                                                            <ListItemButton key={s.id} onClick={() => handleLessonChange(index, 'subject_id', s.id)} selected={lesson.subject_id === s.id}>
                                                              <ListItemText primary={s.name} />
                                                            </ListItemButton>
                                                          ))}
                                                        </List>
                                                      </Box>
                                                    ))}
                                                  </AccordionDetails>
                                                </Accordion>
                                              ))}
                                            </AccordionDetails>
                                          </Accordion>
                                        ))}
                                    </Paper>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ))}

                <Button startIcon={<AddCircleOutlineIcon />} onClick={addLesson} sx={{ mt: 1 }}>Add Another Lesson</Button>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button type="button" onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="contained" size="large" disabled={loading || lessons.some(l => !l.subject_id)}>
                        {loading ? <CircularProgress size={24} /> : 'Save Session'}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
}