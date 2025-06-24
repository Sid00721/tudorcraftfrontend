import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import DateTimePicker from 'react-datetime-picker';

// Import MUI components
import { Button, TextField, CircularProgress, Select, MenuItem, InputLabel, FormControl, Box, Typography } from '@mui/material';

const timezones = [
    { value: 'Australia/Sydney', label: 'NSW/VIC/ACT/TAS (AEST)' },
    { value: 'Australia/Brisbane', label: 'QLD (AEST)' },
    { value: 'Australia/Adelaide', label: 'SA (ACST)' },
    { value: 'Australia/Darwin', label: 'NT (ACST)' },
    { value: 'Australia/Perth', label: 'WA (AWST)' },
];

export default function AddTrialRequestForm({ onTrialRequestAdded, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  
  const [studentGrade, setStudentGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [lessonDateTime, setLessonDateTime] = useState(new Date());
  const [lessonTimezone, setLessonTimezone] = useState('Australia/Sydney');

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from('subjects').select('name').order('name');
      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        // --- THIS IS THE FIX ---
        // Ensure that even if data is null, we set state to an empty array
        setAllSubjects(data || []);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('trial_requests')
      .insert([
        { 
          student_grade: studentGrade, 
          subject: subject, 
          location: location, 
          lesson_datetime: lessonDateTime,
          lesson_timezone: lessonTimezone
        },
      ]);

    if (error) {
      alert('Error adding trial request: ' + error.message);
    } else {
      onTrialRequestAdded();
    }
    setLoading(false);
  };

  return (
    <div className="form-widget">
      <h3>Add New Trial Request</h3>
      <form onSubmit={handleSubmit}>
        <TextField 
          label="Student Grade" 
          value={studentGrade} 
          onChange={(e) => setStudentGrade(e.target.value)} 
          fullWidth required sx={{ mb: 2 }} 
        />
        
        <FormControl fullWidth required sx={{ mb: 2 }}>
          <InputLabel id="subject-select-label">Subject</InputLabel>
          <Select
            labelId="subject-select-label"
            id="subject-select"
            value={subject}
            label="Subject"
            onChange={(e) => setSubject(e.target.value)}
          >
            {allSubjects.map((s) => (
              <MenuItem key={s.name} value={s.name}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField 
          label="Location (Address or 'Online')" 
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          fullWidth required sx={{ mb: 2 }} 
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 2, '.react-datetime-picker': { width: '100%' } }}>
                <Typography variant="caption" display="block" gutterBottom>Lesson Date & Time</Typography>
                <DateTimePicker 
                    onChange={setLessonDateTime} 
                    value={lessonDateTime}
                    disableClock={true}
                    className="custom-datetime-picker"
                />
            </Box>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="timezone-select-label">Timezone</InputLabel>
              <Select
                labelId="timezone-select-label"
                value={lessonTimezone}
                label="Timezone"
                onChange={(e) => setLessonTimezone(e.target.value)}
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
        </Box>

        <div>
          <Button className="button" type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Request'}
          </Button>
          <Button type="button" className="button button-secondary" onClick={onCancel} disabled={loading} sx={{ ml: 1 }}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}