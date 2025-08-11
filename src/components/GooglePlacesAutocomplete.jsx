import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Box, TextField, Typography } from '@mui/material';

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Start typing an address...", 
  label,
  required = false,
  error = false,
  helperText = '',
  fullWidth = true,
  sx = {},
  types = ['address'],
  componentRestrictions = { country: 'AU' }
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const apiKey = import.meta.env.VITE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoadError('Google Maps API key not found');
      console.error('Google Maps API key not found. Please add VITE_MAPS_API_KEY to your environment variables.');
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places'],
      region: 'AU',
      language: 'en'
    });

    loader.load().then(() => {
      if (inputRef.current && window.google) {
        try {
          // Initialize the autocomplete
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: types,
              componentRestrictions: componentRestrictions,
              fields: ['formatted_address', 'geometry', 'name']
            }
          );

          // Add listener for place selection
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (place && place.formatted_address) {
              setInputValue(place.formatted_address);
              onChange(place.formatted_address);
            }
          });

          setIsLoaded(true);
          console.log('✅ Google Places Autocomplete initialized successfully');
        } catch (error) {
          console.error('Error initializing autocomplete:', error);
          setLoadError(`Autocomplete initialization failed: ${error.message}`);
        }
      } else {
        setLoadError('Google Maps API not available');
      }
    }).catch((error) => {
      console.error('Error loading Google Maps:', error);
      setLoadError(`Failed to load Google Maps: ${error.message}`);
    });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey, types, componentRestrictions, onChange]);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleInputChange = (event) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // If user is typing manually (not from autocomplete), update parent
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  if (loadError) {
    return (
      <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
        <TextField
          label={label}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          error={true}
          helperText={`Google Maps error: ${loadError}`}
          fullWidth={fullWidth}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto', ...sx }}>
      <TextField
        inputRef={inputRef}
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        InputProps={{
          endAdornment: !isLoaded && (
            <Typography variant="caption" color="text.secondary">
              Loading...
            </Typography>
          )
        }}
      />
    </Box>
  );
};

export default GooglePlacesAutocomplete;