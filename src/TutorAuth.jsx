import { useState } from 'react';
import { supabase } from './supabaseClient';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

export default function TutorAuth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuthAction = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Handle Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.error_description || error.message);
    } else {
      // Handle Sign Up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName // This metadata is used by our trigger
          }
        }
      });
      if (error) {
        alert(error.error_description || error.message);
      } else {
        alert('Signup successful! Please check your email to verify your account.');
        setIsLogin(true); // Switch back to login view after successful signup
      }
    }
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Tutor {isLogin ? 'Login' : 'Sign Up'}
        </Typography>
        <form onSubmit={handleAuthAction}>
          {!isLogin && (
            <TextField
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth disabled={loading}>
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Sign Up')}
          </Button>
        </form>
        <Button sx={{ mt: 2 }} fullWidth onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
        </Button>
      </Paper>
    </Box>
  );
}