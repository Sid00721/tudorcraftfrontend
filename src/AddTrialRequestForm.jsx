import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Helper function to serialize data safely for Supabase
const sanitizeForSupabase = (obj) => {
    const sanitized = {};
    Object.entries(obj).forEach(([key, value]) => {
        // Skip undefined, null, empty strings, and empty objects
        if (value === undefined || value === null || value === '') {
            return;
        }
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
            sanitized[key] = value.toISOString();
        } else if (typeof value === 'object' && Object.keys(value).length === 0) {
            // Skip empty objects
            return;
        } else {
            sanitized[key] = value;
        }
    });
    return sanitized;
};
import DateTimePicker from "react-datetime-picker";
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import GooglePlacesAutocomplete from './components/GooglePlacesAutocomplete';
import PhoneNumberInput from './components/PhoneNumberInput';

// --- MUI Components ---
import {
    Button, TextField, CircularProgress, Box, Typography, Accordion,
    AccordionSummary, AccordionDetails, List, ListItemButton,
    ListItemText, Paper, Grid, Card, CardContent, IconButton,
    MenuItem, Select, InputLabel, FormControl, FormHelperText,
    Autocomplete, Chip, InputAdornment
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

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
        { 
            student_name: '', 
            student_grade: '', 
            subject_id: null, 
            lesson_datetime: new Date(), 
            duration_minutes: 60,
            student_level: '', // 'catching_up', 'holding_steady', 'ready_to_excel'
            unit_module: '', // For science subjects: NSW modules 1-8, Other states units 1-4
            english_text: '', // For English subjects: specific text being studied
            lesson_timezone: 'Australia/Sydney' // Add timezone to lesson level
        }
    ]);
    
    const timezones = [
        { value: "Australia/Sydney", label: "NSW/VIC/ACT/TAS (AEST)" },
        { value: "Australia/Brisbane", label: "QLD (AEST)" },
        { value: "Australia/Adelaide", label: "SA (ACST)" },
        { value: "Australia/Darwin", label: "NT (ACST)" },
        { value: "Australia/Perth", label: "WA (AWST)" }
    ];

    // Student level options
    const studentLevelOptions = [
        { value: 'catching_up', label: 'Catching Up' },
        { value: 'holding_steady', label: 'Holding Steady' },
        { value: 'ready_to_excel', label: 'Ready to Excel' }
    ];

    // English texts by region
    const englishTextsByRegion = {
        'NSW': [
            'To Kill a Mockingbird by Harper Lee',
            'Jasper Jones by Craig Silvey',
            'Great Gatsby by F. Scott Fitzgerald',
            'The Catcher in the Rye by J.D. Salinger',
            'The Hunger Games by Suzanne Collins',
            'Romeo and Juliet',
            'The Crucible',
            'A Doll\'s House by Henrik Ibsen',
            'Of Mice and Men by John Steinbeck',
            'Looking for Alibrandi by Melina Marchetta',
            'The Secret River by Kate Grenville',
            'The White Tiger by Aravind Adiga',
            'Animal Farm by George Orwell',
            'The Book Thief by Markus Zusak',
            'A Streetcar Named Desire by Tennessee Williams',
            'The Removalists by David Williamson',
            'Macbeth by William Shakespeare',
            'Waiting for Godot by Samuel Beckett',
            'Death of a Salesman by Arthur Miller',
            'Plath and Hughes',
            'TS Eliot',
            'Keats and Campion',
            'The Matrix (film)',
            'Dead Poets Society (film)',
            'Rabbit-Proof Fence (film)',
            'The Dressmaker (film)',
            'Lion (film)',
            'Paradise Lost by John Milton',
            'Oedipus Rex by Sophocles',
            'King Lear by William Shakespeare',
            'Othello by William Shakespeare'
        ],
        'VIC': [
            'Regeneration by Pat Barker',
            'Jane Eyre by Charlotte Brontë',
            'My Brilliant Career by Miles Franklin',
            'Chronicle of a Death Foretold by Gabriel García Márquez',
            'Orbital by Samantha Harvey',
            'We Have Always Lived in the Castle by Shirley Jackson',
            'Ghost Wall by Sarah Moss',
            'The Memory Police by Yōko Ogawa',
            'Bad Dreams and Other Stories by Tessa Hadley',
            'The Complete Stories by David Malouf',
            'Rainbow\'s End by Jane Harrison',
            'Twelfth Night by William Shakespeare',
            'Oedipus the King by Sophocles',
            'Selected Poems by Langston Hughes',
            'New and Selected Poems, Volume One by Mary Oliver',
            'High Ground (film)',
            'Sunset Boulevard (film)',
            'Requiem for a Beast by Matt Ottley',
            'We Come with This Place by Debra Dank',
            'Born a Crime by Trevor Noah',
            'Macbeth by William Shakespeare'
        ],
        'QLD': [
            'To Kill a Mockingbird by Harper Lee',
            'The Great Gatsby by F. Scott Fitzgerald',
            'Romeo and Juliet by William Shakespeare',
            'Macbeth by William Shakespeare',
            'Othello by William Shakespeare',
            'The Crucible by Arthur Miller',
            'A Streetcar Named Desire by Tennessee Williams',
            'Death of a Salesman by Arthur Miller',
            'Animal Farm by George Orwell',
            'The Book Thief by Markus Zusak',
            'Looking for Alibrandi by Melina Marchetta'
        ],
        'WA': [
            'To Kill a Mockingbird by Harper Lee',
            'The Great Gatsby by F. Scott Fitzgerald',
            'Romeo and Juliet by William Shakespeare',
            'Macbeth by William Shakespeare',
            'The Crucible by Arthur Miller',
            'Animal Farm by George Orwell',
            'The Book Thief by Markus Zusak'
        ],
        'SA': [
            'To Kill a Mockingbird by Harper Lee',
            'The Great Gatsby by F. Scott Fitzgerald',
            'Romeo and Juliet by William Shakespeare',
            'Macbeth by William Shakespeare',
            'The Crucible by Arthur Miller',
            'Animal Farm by George Orwell'
        ],
        'ACT': [
            'To Kill a Mockingbird by Harper Lee',
            'The Great Gatsby by F. Scott Fitzgerald',
            'Romeo and Juliet by William Shakespeare',
            'Macbeth by William Shakespeare',
            'The Crucible by Arthur Miller',
            'Animal Farm by George Orwell'
        ]
    };

    // Helper function to determine curriculum region from subject
    const getCurriculumRegion = (subjectName) => {
        if (!subjectName) return null;
        const name = subjectName.toLowerCase();
        if (name.includes('nsw')) return 'NSW';
        if (name.includes('vic')) return 'VIC';
        if (name.includes('qld')) return 'QLD';
        if (name.includes('wa')) return 'WA';
        if (name.includes('sa')) return 'SA';
        if (name.includes('act')) return 'ACT';
        return null;
    };

    // Helper function to check if subject needs unit/module selection
    const needsUnitModuleSelection = (subjectName, studentGrade) => {
        if (!subjectName || !studentGrade) return false;
        const name = subjectName.toLowerCase();
        const isYear11Or12 = studentGrade.toLowerCase().includes('year 11') || 
                            studentGrade.toLowerCase().includes('year 12') ||
                            studentGrade === '11' || studentGrade === '12';
        
        return isYear11Or12 && (
            name.includes('chemistry') || 
            name.includes('physics') || 
            name.includes('biology')
        );
    };

    // Helper function to check if subject needs English text selection
    const needsEnglishTextSelection = (subjectName) => {
        if (!subjectName) return false;
        const name = subjectName.toLowerCase();
        return name.includes('english');
    };

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
            { 
                student_name: '', 
                student_grade: '', 
                subject_id: null, 
                lesson_datetime: new Date(), 
                duration_minutes: 60,
                student_level: '',
                unit_module: '',
                english_text: '',
                lesson_timezone: 'Australia/Sydney'
            }
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
            // Sanitize sessionDetails to remove undefined/null/empty values and convert dates
            const cleanSessionDetails = sanitizeForSupabase(sessionDetails);

            console.log('Inserting session with data:', cleanSessionDetails);

            // 1. Insert the parent session
            const { data: sessionData, error: sessionError } = await supabase
                .from('trial_sessions')
                .insert([cleanSessionDetails])
                .select('id, parent_name, parent_email, parent_phone, location, created_at')
                .single();

            if (sessionError) {
                console.error('Session insert error:', sessionError);
                throw sessionError;
            }

            console.log('Session created with ID:', sessionData.id);

            // 2. Prepare the lessons with the new session_id, using sanitization
            const lessonsToInsert = lessons.map(lesson => {
                const cleanLesson = sanitizeForSupabase(lesson);
                return {
                    ...cleanLesson,
                    session_id: sessionData.id,
                };
            });

            console.log('Inserting lessons:', lessonsToInsert);

            // 3. Insert all the lessons
            const { data: lessonsData, error: lessonsError } = await supabase.from('trial_lessons').insert(lessonsToInsert);

            if (lessonsError) {
                console.error('Lessons insert error:', lessonsError);
                throw lessonsError;
            }

            console.log('Lessons created successfully');

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

    // --- Helper Functions ---
    const findSubjectName = (subjectId) => {
        const subject = allSubjects.find(s => s.id === subjectId);
        return subject ? subject.name : 'Unknown Subject';
    };

    // Group subjects by curriculum and level for better organization
    const getSubjectsByCategory = () => {
        const grouped = {};
        allSubjects.forEach(subject => {
            const category = `${subject.state_curriculum} - ${subject.level}`;
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(subject);
        });
        return grouped;
    };

    // --- Render ---
    return (
        <Paper sx={{ p: 4, maxWidth: 900, margin: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom>Create New Trial Session</Typography>
            <form onSubmit={handleSubmit}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Parent & Session Details</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField name="parent_name" label="Parent Name" value={sessionDetails.parent_name} onChange={handleSessionChange} fullWidth required /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField name="parent_email" label="Parent Email" type="email" value={sessionDetails.parent_email} onChange={handleSessionChange} fullWidth /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <PhoneNumberInput
                            name="parent_phone"
                            label="Parent Phone"
                            value={sessionDetails.parent_phone}
                            onChange={handleSessionChange}
                            fullWidth
                            helperText="Australian phone number for session updates"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <GooglePlacesAutocomplete
                            value={sessionDetails.location}
                            onChange={(address) => setSessionDetails({...sessionDetails, location: address})}
                            label="Location"
                            placeholder="Start typing an address or enter 'Online'..."
                            required
                            helperText="Enter a full address for in-person sessions, or type 'Online' for virtual sessions"
                            types={['address']}
                            componentRestrictions={{ country: 'AU' }}
                        />
                    </Grid>
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
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                    <TextField name="student_name" label="Student Name" value={lesson.student_name || ''} onChange={(e) => handleLessonChange(index, 'student_name', e.target.value)} fullWidth required />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                    <TextField name="student_grade" label="Student Grade" value={lesson.student_grade} onChange={(e) => handleLessonChange(index, 'student_grade', e.target.value)} fullWidth required />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{pt:1}}>
                                        <DateTimePicker onChange={(val) => handleLessonChange(index, 'lesson_datetime', val)} value={lesson.lesson_datetime} disableClock />
                                    </Box>
                                </Grid>
                                
                                {/* --- IMPROVED SUBJECT SELECTION --- */}
                                <Grid size={{ xs: 12 }}>
                                    <FormControl fullWidth required>
                                        <Autocomplete
                                            options={allSubjects}
                                            groupBy={(option) => `${option.state_curriculum} - ${option.level}`}
                                            getOptionLabel={(option) => option.name}
                                            value={allSubjects.find(s => s.id === lesson.subject_id) || null}
                                            onChange={(event, newValue) => {
                                                handleLessonChange(index, 'subject_id', newValue ? newValue.id : null);
                                            }}
                                            renderInput={(params) => (
                                                <TextField 
                                                    {...params} 
                                                    label="Subject" 
                                                    required
                                                    InputProps={{
                                                        ...params.InputProps,
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            )}
                                            renderOption={(props, option) => (
                                                <Box component="li" {...props}>
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            {option.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {option.state_curriculum} • {option.level}
                                                            {option.subject_group && ` • ${option.subject_group}`}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            renderGroup={(params) => (
                                                <Box key={params.key}>
                                                    <Typography 
                                                        variant="subtitle2" 
                                                        sx={{ 
                                                            px: 2, 
                                                            py: 1, 
                                                            bgcolor: 'grey.100', 
                                                            fontWeight: 'bold',
                                                            position: 'sticky',
                                                            top: 0,
                                                            zIndex: 1
                                                        }}
                                                    >
                                                        {params.group}
                                                    </Typography>
                                                    {params.children}
                                                </Box>
                                            )}
                                            ListboxProps={{
                                                style: { maxHeight: '300px' }
                                            }}
                                            noOptionsText="No subjects found"
                                            placeholder="Search and select subject..."
                                        />
                                    </FormControl>
                                    
                                    {lesson.subject_id && (
                                        <Box mt={1}>
                                            <Chip 
                                                label={findSubjectName(lesson.subject_id)}
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Box>
                                    )}
                                </Grid>

                                {/* --- NEW: Student Level (Compulsory) --- */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Student Level</InputLabel>
                                        <Select
                                            value={lesson.student_level || ''}
                                            label="Student Level"
                                            onChange={(e) => handleLessonChange(index, 'student_level', e.target.value)}
                                        >
                                            {studentLevelOptions.map(option => (
                                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                                            ))}
                                        </Select>
                                        <FormHelperText>How is the student currently performing?</FormHelperText>
                                    </FormControl>
                                </Grid>

                                {/* --- NEW: Unit/Module Selection (Conditional) --- */}
                                {needsUnitModuleSelection(findSubjectName(lesson.subject_id), lesson.student_grade) && (
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Unit/Module (Optional)</InputLabel>
                                            <Select
                                                value={lesson.unit_module || ''}
                                                label="Unit/Module (Optional)"
                                                onChange={(e) => handleLessonChange(index, 'unit_module', e.target.value)}
                                            >
                                                <MenuItem value="">Not specified</MenuItem>
                                                {getCurriculumRegion(findSubjectName(lesson.subject_id)) === 'NSW' ? (
                                                    // NSW: Modules 1-8
                                                    [1,2,3,4,5,6,7,8].map(num => (
                                                        <MenuItem key={num} value={`Module ${num}`}>Module {num}</MenuItem>
                                                    ))
                                                ) : (
                                                    // Other states: Units 1-4  
                                                    [1,2,3,4].map(num => (
                                                        <MenuItem key={num} value={`Unit ${num}`}>Unit {num}</MenuItem>
                                                    ))
                                                )}
                                            </Select>
                                            <FormHelperText>
                                                {getCurriculumRegion(findSubjectName(lesson.subject_id)) === 'NSW' 
                                                    ? 'NSW: Modules 1-4 (Yr 11), 5-8 (Yr 12)'
                                                    : 'Units 1-2 (Yr 11), 3-4 (Yr 12)'
                                                }
                                            </FormHelperText>
                                        </FormControl>
                                    </Grid>
                                )}

                                {/* --- NEW: English Text Selection (Conditional) --- */}
                                {needsEnglishTextSelection(findSubjectName(lesson.subject_id)) && (
                                    <Grid size={{ xs: 12 }}>
                                        <FormControl fullWidth>
                                            <InputLabel>English Text (Optional)</InputLabel>
                                            <Select
                                                value={lesson.english_text || ''}
                                                label="English Text (Optional)"
                                                onChange={(e) => handleLessonChange(index, 'english_text', e.target.value)}
                                            >
                                                <MenuItem value="">Not specified / Any text</MenuItem>
                                                {(() => {
                                                    const region = getCurriculumRegion(findSubjectName(lesson.subject_id)) || 'NSW';
                                                    const texts = englishTextsByRegion[region] || englishTextsByRegion['NSW'];
                                                    return texts.map(text => (
                                                        <MenuItem key={text} value={text}>{text}</MenuItem>
                                                    ));
                                                })()}
                                            </Select>
                                            <FormHelperText>Select the specific text the student is studying</FormHelperText>
                                        </FormControl>
                                    </Grid>
                                )}

                                {/* --- NEW: Timezone Selection --- */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Timezone</InputLabel>
                                        <Select
                                            value={lesson.lesson_timezone || 'Australia/Sydney'}
                                            label="Timezone"
                                            onChange={(e) => handleLessonChange(index, 'lesson_timezone', e.target.value)}
                                        >
                                            {timezones.map(tz => (
                                                <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                            </Grid>
                        </CardContent>
                    </Card>
                ))}

                <Button startIcon={<AddCircleOutlineIcon />} onClick={addLesson} sx={{ mt: 1 }}>Add Another Lesson</Button>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button type="button" onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button type="submit" variant="contained" size="large" disabled={loading || lessons.some(l => !l.subject_id || !l.student_level)}>
                        {loading ? <CircularProgress size={24} /> : 'Save Session'}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
}