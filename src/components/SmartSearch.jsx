import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    TextField,
    Chip,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    InputAdornment,
    Fade,
    Stack,
    Button,
    Divider,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Clear as ClearIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';

export const SmartSearchBar = ({ 
    data = [], 
    onFilter, 
    searchFields = ['name', 'email'], 
    placeholder = "Search...",
    filters = [],
    suggestions = [],
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);

    // Smart filtering logic
    const filteredData = useMemo(() => {
        let filtered = data;

        // Apply search term
        if (searchTerm) {
            filtered = filtered.filter(item =>
                searchFields.some(field =>
                    item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        // Apply active filters
        Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue && filterValue !== 'all') {
                filtered = filtered.filter(item => item[filterKey] === filterValue);
            }
        });

        return filtered;
    }, [data, searchTerm, activeFilters, searchFields]);

    useEffect(() => {
        onFilter?.(filteredData);
    }, [filteredData, onFilter]);

    const handleSearch = (value) => {
        setSearchTerm(value);
        if (value && !recentSearches.includes(value)) {
            setRecentSearches(prev => [value, ...prev.slice(0, 4)]);
        }
    };

    const handleFilterChange = (filterKey, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setActiveFilters({});
    };

    const activeFilterCount = Object.values(activeFilters).filter(v => v && v !== 'all').length;

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Search Bar */}
            <TextField
                fullWidth
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon sx={{ color: '#9DA4AE', fontSize: 20 }} />
                        </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                        <InputAdornment position="end">
                            <Button
                                size="small"
                                onClick={() => handleSearch('')}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </Button>
                        </InputAdornment>
                    ),
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        backgroundColor: '#FFFFFF',
                        '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#2D5BFF',
                            },
                        },
                    },
                }}
            />

            {/* Search Suggestions */}
            {showSuggestions && (searchTerm || recentSearches.length > 0) && (
                <Fade in={true}>
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            mt: 1,
                            zIndex: 1000,
                            border: '1px solid #E4E7EB',
                            borderRadius: 2,
                            maxHeight: 300,
                            overflow: 'auto',
                        }}
                    >
                        {recentSearches.length > 0 && !searchTerm && (
                            <Box sx={{ p: 2 }}>
                                <Typography variant="caption" sx={{ color: '#6B7280', mb: 1, display: 'block' }}>
                                    Recent searches
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                    {recentSearches.map((term, index) => (
                                        <Chip
                                            key={index}
                                            label={term}
                                            size="small"
                                            onClick={() => handleSearch(term)}
                                            sx={{
                                                backgroundColor: '#F4F6F8',
                                                color: '#374151',
                                                '&:hover': {
                                                    backgroundColor: '#E4E7EB',
                                                },
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>
                        )}
                        
                        {suggestions.length > 0 && searchTerm && (
                            <List dense>
                                {suggestions
                                    .filter(suggestion => 
                                        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .slice(0, 5)
                                    .map((suggestion, index) => (
                                        <ListItem
                                            key={index}
                                            button
                                            onClick={() => handleSearch(suggestion)}
                                        >
                                            <ListItemText 
                                                primary={suggestion}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    sx: { fontWeight: 500 }
                                                }}
                                            />
                                        </ListItem>
                                    ))
                                }
                            </List>
                        )}
                    </Paper>
                </Fade>
            )}

            {/* Filter Chips */}
            {filters.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterIcon sx={{ fontSize: 16, color: '#6B7280' }} />
                        <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                            Filters
                        </Typography>
                    </Box>
                    
                    {filters.map((filter) => (
                        <Box key={filter.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                {filter.label}:
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                {filter.options.map((option) => (
                                    <Chip
                                        key={option.value}
                                        label={option.label}
                                        size="small"
                                        variant={activeFilters[filter.key] === option.value ? 'filled' : 'outlined'}
                                        onClick={() => handleFilterChange(filter.key, option.value)}
                                        sx={{
                                            backgroundColor: activeFilters[filter.key] === option.value 
                                                ? '#2D5BFF' : 'transparent',
                                            color: activeFilters[filter.key] === option.value 
                                                ? 'white' : '#6B7280',
                                            borderColor: activeFilters[filter.key] === option.value 
                                                ? '#2D5BFF' : '#E4E7EB',
                                            '&:hover': {
                                                backgroundColor: activeFilters[filter.key] === option.value 
                                                    ? '#1E47E6' : '#F4F6F8',
                                            },
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    ))}
                    
                    {(searchTerm || activeFilterCount > 0) && (
                        <Button
                            size="small"
                            onClick={clearAllFilters}
                            sx={{
                                color: '#6B7280',
                                fontSize: '0.75rem',
                                minWidth: 'auto',
                                px: 1,
                            }}
                        >
                            Clear all
                        </Button>
                    )}
                </Box>
            )}

            {/* Results Summary */}
            {(searchTerm || activeFilterCount > 0) && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: '#6B7280' }}>
                        {filteredData.length} result{filteredData.length !== 1 ? 's' : ''} found
                        {searchTerm && ` for "${searchTerm}"`}
                        {activeFilterCount > 0 && ` with ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''}`}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

// Quick action notification
export const QuickNotification = ({ type, message, onClose }) => (
    <Fade in={true}>
        <Box
            sx={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E4E7EB',
                borderRadius: 2,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                maxWidth: 400,
                width: '90%',
            }}
        >
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                {message}
            </Typography>
            {onClose && (
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
            )}
        </Box>
    </Fade>
);
