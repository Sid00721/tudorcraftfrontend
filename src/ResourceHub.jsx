import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Link as RouterLink } from 'react-router-dom';

// Import MUI Components
import {
    Box, Button, Typography, Paper, CircularProgress, Accordion, AccordionSummary,
    AccordionDetails, List, ListItem, ListItemText, Link, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';

export default function ResourceHub() {
    const [loading, setLoading] = useState(true);
    const [resourcesByCategory, setResourcesByCategory] = useState({});
    // New state for loading indicator on a specific button
    const [viewingFileId, setViewingFileId] = useState(null);

    const fetchResources = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('resources')
            .select('*, subjects(name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching resources:", error.message);
        } else {
            // Group resources by subject name
            const grouped = (data || []).reduce((acc, resource) => {
                const category = resource.subjects?.name || 'General Resources';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(resource);
                return acc;
            }, {});
            setResourcesByCategory(grouped);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    // The updated function to securely view a file
    const handleViewFile = async (resource) => {
        if (!resource.storage_path) {
            alert('Error: This resource has no file path specified.');
            return;
        }
        setViewingFileId(resource.id);

        try {
            // 1. Get the user's authentication token
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('Authentication error. Please log in again.');
            }
            const token = session.access_token;

            // 2. Call our new backend endpoint with the token
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${backendUrl}/api/resource/get-signed-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ storage_path: resource.storage_path })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to retrieve file.');
            }

            // 3. Open the secure, temporary link in a new tab
            window.open(data.signedUrl, '_blank', 'noopener,noreferrer');

        } catch (error) {
            console.error("Error viewing file:", error);
            alert(`Error: ${error.message}`);
        } finally {
            // 4. Reset the loading state for the button
            setViewingFileId(null);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Resource Hub</Typography>
                <Button component={RouterLink} to="/tutor/dashboard"> &larr; Back to Dashboard</Button>
            </Box>
            <Typography color="text.secondary">A library of materials to help you with your lessons.</Typography>

            <Box sx={{mt: 4}}>
                {Object.keys(resourcesByCategory).length > 0 ? Object.entries(resourcesByCategory).map(([category, resources]) => (
                    <Accordion key={category} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">{category}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List>
                                {resources.map(resource => (
                                    <ListItem key={resource.id} divider>
                                        <ListItemText
                                            primary={resource.title}
                                            secondary={resource.description}
                                        />
                                        {resource.resource_type === 'link' ? (
                                            <Button
                                                variant="contained"
                                                href={resource.resource_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                startIcon={<LinkIcon />}
                                            >
                                                Open Link
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                onClick={() => handleViewFile(resource)}
                                                startIcon={viewingFileId === resource.id ? <CircularProgress size={20} color="inherit" /> : <ArticleIcon />}
                                                disabled={viewingFileId === resource.id}
                                            >
                                                {viewingFileId === resource.id ? 'Loading...' : 'View File'}
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                )) : <Typography>No resources have been uploaded yet.</Typography>}
            </Box>
        </Box>
    );
}