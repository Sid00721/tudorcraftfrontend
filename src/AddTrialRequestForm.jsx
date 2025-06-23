import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Import MUI components
import { Button, TextField, CircularProgress, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

export default function AddTrialRequestForm({ onTrialRequestAdded, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  
  // State for the form fields
  const [studentGrade, setStudentGrade] = useState('');
  const [subject, setSubject] = useState(''); // This will now hold the selected subject name
  const [location, setLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Fetch all available subjects when the form first loads
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase.from('subjects').select('name').order('name');
      if (error) {
        console.error('Error fetching subjects:', error);
      } else {
        setAllSubjects(data);
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
        { student_grade: studentGrade, subject: subject, location: location, preferred_time: preferredTime },
      ]);

    if (error) {
      alert('Error adding trial request: ' + error.message);
    } else {
      onTrialRequestAdded(); // This is passed from Dashboard.jsx to refresh the list
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
        
        {/* --- THIS IS THE NEW DROPDOWN --- */}
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
        <TextField 
          label="Preferred Date/Time" 
          value={preferredTime} 
          onChange={(e) => setPreferredTime(e.target.value)} 
          fullWidth sx={{ mb: 2 }} 
        />
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