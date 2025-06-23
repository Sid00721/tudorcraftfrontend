import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Box, Button, TextField, Typography, Paper, CircularProgress, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import Alert from '@mui/material/Alert';

export default function TutorProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ suburb: '', phone_number: '' });
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchProfileAndSubjects = useCallback(async (userId) => {
    // Fetch tutor's own profile
    const { data: profileData, error: profileError } = await supabase.from('tutors').select('*, subjects(id)').eq('id', userId).single();
    if (profileError) console.error('Error fetching profile:', profileError);
    else {
      setProfile(profileData);
      // Pre-select checkboxes for subjects the tutor already has
      const initialSelected = new Set(profileData.subjects.map(s => s.id));
      setSelectedSubjects(initialSelected);
    }

    // Fetch all available subjects from the master list
    const { data: subjectsData, error: subjectsError } = await supabase.from('subjects').select('*');
    if (subjectsError) console.error('Error fetching subjects:', subjectsError);
    else setAllSubjects(subjectsData);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session.user);
      if (session.user) {
        fetchProfileAndSubjects(session.user.id);
      } else {
        setLoading(false);
      }
    };
    getSession();
  }, [fetchProfileAndSubjects]);

  const handleSubjectChange = (subjectId) => {
    const newSelection = new Set(selectedSubjects);
    if (newSelection.has(subjectId)) {
      newSelection.delete(subjectId);
    } else {
      newSelection.add(subjectId);
    }
    setSelectedSubjects(newSelection);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');

    // 1. Update the main profile details
    const { error: profileUpdateError } = await supabase.from('tutors').update({
      suburb: profile.suburb,
      phone_number: profile.phone_number
    }).eq('id', user.id);
    if (profileUpdateError) {
      alert('Error updating profile: ' + profileUpdateError.message);
      setSaving(false);
      return;
    }

    // 2. Update the subjects in the join table
    // 2a. Delete all existing subject links for this tutor
    await supabase.from('tutor_subjects').delete().eq('tutor_id', user.id);
    
    // 2b. Insert the new links based on the selected checkboxes
    const newLinks = Array.from(selectedSubjects).map(subjectId => ({
      tutor_id: user.id,
      subject_id: subjectId
    }));
    if (newLinks.length > 0) {
        const { error: subjectsUpdateError } = await supabase.from('tutor_subjects').insert(newLinks);
        if (subjectsUpdateError) {
            alert('Error updating subjects: ' + subjectsUpdateError.message);
            setSaving(false);
            return;
        }
    }
    
    setSuccessMessage('Profile updated successfully!');
    setSaving(false);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleUpdateProfile}>
          <TextField
            label="Email"
            value={user?.email || ''}
            fullWidth
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            label="Suburb"
            value={profile.suburb || ''}
            onChange={(e) => setProfile({ ...profile, suburb: e.target.value })}
            fullWidth
            required
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

          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>My Subjects</Typography>
          <FormGroup>
            {allSubjects.map(subject => (
              <FormControlLabel
                key={subject.id}
                control={
                  <Checkbox
                    checked={selectedSubjects.has(subject.id)}
                    onChange={() => handleSubjectChange(subject.id)}
                  />
                }
                label={subject.name}
              />
            ))}
          </FormGroup>

          <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save Profile'}
          </Button>
          {successMessage && <Alert severity="success" sx={{ mt: 2 }}>{successMessage}</Alert>}
        </form>
      </Paper>
    </Box>
  );
}