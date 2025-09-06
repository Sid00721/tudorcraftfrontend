import { useState } from 'react';
import { supabase } from './supabaseClient';
import GooglePlacesAutocomplete from './components/GooglePlacesAutocomplete';
import PhoneNumberInput from './components/PhoneNumberInput';
import { 
  Box, Button, TextField, Typography, Paper, Grid 
} from '@mui/material';

export default function AddTutorForm({ onTutorAdded, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [suburb, setSuburb] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('tutors')
      .insert([
        { full_name: fullName, email: email, phone_number: phone, suburb: suburb },
      ]);

    if (error) {
      alert('Error adding tutor: ' + error.message);
    } else {
      // This function is passed from the Dashboard to tell it to refresh the data
      onTutorAdded(); 
    }
    
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, margin: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Add New Tutor</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField 
              label="Full Name"
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              fullWidth 
              required 
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField 
              label="Email"
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              fullWidth 
              required 
            />
          </Grid>
          
          <Grid item xs={12}>
            <PhoneNumberInput
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              fullWidth
              required
              helperText="Australian phone number for contact purposes"
            />
          </Grid>
          
          <Grid item xs={12}>
            <GooglePlacesAutocomplete
              value={suburb}
              onChange={(address) => setSuburb(address)}
              label="Suburb"
              placeholder="Start typing the tutor's suburb or area..."
              helperText="Enter the suburb or area where the tutor is located"
              types={['(cities)']}
              componentRestrictions={{ country: 'AU' }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button 
                type="button" 
                onClick={onCancel} 
                disabled={loading}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                variant="contained"
              >
                {loading ? 'Saving...' : 'Save Tutor'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}