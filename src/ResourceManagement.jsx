import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link as RouterLink } from 'react-router-dom';

// Import MUI Components
import {
    Box, Button, Typography, Paper, CircularProgress, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Link, Chip,
    TextField, Grid, Select, MenuItem, InputLabel, FormControl, RadioGroup,
    FormControlLabel, Radio, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';

export default function ResourceManagement() {
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [subjects, setSubjects] = useState([]);
    
    // --- State for the new resource form ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newResource, setNewResource] = useState({
        title: '',
        description: '',
        resource_type: 'link', // Default to 'link'
        subject_id: '',
        resource_url: '',
    });
    const [uploadFile, setUploadFile] = useState(null);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('resources').select('*, subjects(name)').order('created_at', { ascending: false });
        if (error) console.error("Error fetching resources:", error.message);
        else setResources(data || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            await fetchResources();
            const { data: subjectsData } = await supabase.from('subjects').select('id, name').order('name');
            setSubjects(subjectsData || []);
        };
        fetchInitialData();
    }, [fetchResources]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewResource(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploadFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (newResource.resource_type === 'link') {
                // Logic for submitting a link
                const { error } = await supabase.from('resources').insert({
                    title: newResource.title,
                    description: newResource.description,
                    resource_type: 'link',
                    resource_url: newResource.resource_url,
                    subject_id: newResource.subject_id || null,
                });
                if (error) throw error;

            } else if (newResource.resource_type === 'file') {
                // Logic for submitting a file
                if (!uploadFile) throw new Error('Please select a file to upload.');
                
                // 1. Upload file to Supabase Storage
                const filePath = `public/${Date.now()}_${uploadFile.name}`;
                const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, uploadFile);
                if (uploadError) throw uploadError;

                // 2. Insert metadata into the database
                const { error: dbError } = await supabase.from('resources').insert({
                    title: newResource.title,
                    description: newResource.description,
                    resource_type: 'file',
                    storage_path: filePath,
                    subject_id: newResource.subject_id || null,
                });
                if (dbError) throw dbError;
            }
            alert('Resource added successfully!');
            setNewResource({ title: '', description: '', resource_type: 'link', subject_id: '', resource_url: '' });
            setUploadFile(null);
            fetchResources(); // Refresh the list

        } catch (error) {
            alert('Error adding resource: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (resource) => {
        if (!window.confirm(`Are you sure you want to delete "${resource.title}"?`)) return;

        try {
            // If it's a file, delete from storage first
            if (resource.resource_type === 'file' && resource.storage_path) {
                const { error: storageError } = await supabase.storage.from('resources').remove([resource.storage_path]);
                if (storageError) throw storageError;
            }

            // Then delete from the database table
            const { error: dbError } = await supabase.from('resources').delete().eq('id', resource.id);
            if (dbError) throw dbError;

            alert('Resource deleted successfully.');
            fetchResources(); // Refresh the list

        } catch (error) {
            alert('Error deleting resource: ' + error.message);
        }
    };

    if (loading && resources.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Resource Management</Typography>
                <Button component={RouterLink} to="/"> &larr; Back to Dashboard</Button>
            </Box>
            
            <Paper sx={{p: 3, mt: 4}}>
                <Typography variant="h6" gutterBottom>Add New Resource</Typography>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl>
                                <RadioGroup row name="resource_type" value={newResource.resource_type} onChange={handleInputChange}>
                                    <FormControlLabel value="link" control={<Radio />} label="External Link" />
                                    <FormControlLabel value="file" control={<Radio />} label="File Upload" />
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}><TextField name="title" label="Title" value={newResource.title} onChange={handleInputChange} fullWidth required /></Grid>
                        <Grid item xs={12}><TextField name="description" label="Description" value={newResource.description} onChange={handleInputChange} fullWidth multiline rows={2} /></Grid>
                        
                        {newResource.resource_type === 'link' ? (
                            <Grid item xs={12}><TextField name="resource_url" label="Resource URL" value={newResource.resource_url} onChange={handleInputChange} fullWidth required /></Grid>
                        ) : (
                            <Grid item xs={12}><Button variant="contained" component="label">Upload File<input type="file" hidden onChange={handleFileChange} /></Button> {uploadFile && <Typography variant="body2" component="span" sx={{ml: 2}}>{uploadFile.name}</Typography>}</Grid>
                        )}
                        
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Optional: Assign to Subject</InputLabel>
                                <Select name="subject_id" value={newResource.subject_id} label="Optional: Assign to Subject" onChange={handleInputChange}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={24}/> : 'Add Resource'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            <TableContainer component={Paper} sx={{ mt: 4 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {resources.length > 0 ? resources.map(resource => (
                            <TableRow key={resource.id}>
                                <TableCell>
                                    <Chip 
                                        icon={resource.resource_type === 'file' ? <ArticleIcon /> : <LinkIcon />} 
                                        label={resource.resource_type} 
                                        size="small" 
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>{resource.title}</TableCell>
                                <TableCell>{resource.subjects?.name || 'N/A'}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleDelete(resource)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No resources found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}