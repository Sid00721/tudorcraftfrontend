import { useState } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';

/**
 * Australian phone number input component with automatic +61 formatting
 * Supports both mobile (04xx xxx xxx) and landline formats
 */
export default function PhoneNumberInput({
    value = '',
    onChange,
    name,
    label = 'Phone Number',
    required = false,
    fullWidth = true,
    error = false,
    helperText = '',
    ...otherProps
}) {
    const [displayValue, setDisplayValue] = useState(value);

    // Format Australian phone numbers
    const formatAustralianPhone = (input) => {
        // Remove all non-digit characters
        const digits = input.replace(/\D/g, '');
        
        // Handle different input scenarios
        let formattedDigits = digits;
        
        // If starts with 61, it's already international format
        if (digits.startsWith('61')) {
            formattedDigits = digits;
        }
        // If starts with 0 (Australian format), convert to international
        else if (digits.startsWith('0')) {
            formattedDigits = '61' + digits.slice(1);
        }
        // If starts with 4 (mobile without 0), add 61
        else if (digits.startsWith('4')) {
            formattedDigits = '61' + digits;
        }
        // If it's just digits without country code, assume it's Australian
        else if (digits.length >= 8 && digits.length <= 10) {
            formattedDigits = '61' + digits;
        }
        
        // Format for display based on length
        if (formattedDigits.startsWith('61')) {
            const localPart = formattedDigits.slice(2);
            
            // Mobile format: +61 4xx xxx xxx
            if (localPart.startsWith('4') && localPart.length === 9) {
                return `+61 ${localPart.slice(0, 3)} ${localPart.slice(3, 6)} ${localPart.slice(6)}`;
            }
            // Landline format: +61 x xxxx xxxx
            else if (localPart.length === 9) {
                return `+61 ${localPart.slice(0, 1)} ${localPart.slice(1, 5)} ${localPart.slice(5)}`;
            }
            // Partial number - show what we have
            else if (localPart.length > 0) {
                return `+61 ${localPart}`;
            }
        }
        
        // Fallback - just add +61 prefix if digits exist
        return digits.length > 0 ? `+61 ${digits}` : '';
    };

    // Validate Australian phone number
    const validateAustralianPhone = (phone) => {
        const digits = phone.replace(/\D/g, '');
        
        // Should be 11 digits total (61 + 9 digits)
        if (digits.startsWith('61')) {
            const localPart = digits.slice(2);
            
            // Mobile: starts with 4, 9 digits total
            if (localPart.startsWith('4') && localPart.length === 9) {
                return true;
            }
            
            // Landline: starts with 2, 3, 7, or 8, 9 digits total
            if (['2', '3', '7', '8'].includes(localPart[0]) && localPart.length === 9) {
                return true;
            }
        }
        
        return false;
    };

    const handleChange = (event) => {
        const inputValue = event.target.value;
        // Allow free typing/deletion; do not force +61 while editing
        setDisplayValue(inputValue);

        if (onChange) {
            onChange({
                ...event,
                target: {
                    ...event.target,
                    value: inputValue
                }
            });
        }
    };

    const handleBlur = (event) => {
        // Always format to +61 format on blur
        const formatted = formatAustralianPhone(displayValue);
        setDisplayValue(formatted);

        const isValid = formatted ? validateAustralianPhone(formatted) : true;

        if (onChange) {
            onChange({
                ...event,
                target: {
                    ...event.target,
                    value: formatted
                }
            });
        }

        if (otherProps.onBlur) {
            otherProps.onBlur({
                ...event,
                target: {
                    ...event.target,
                    value: formatted,
                    validity: { valid: isValid }
                }
            });
        }
    };

    // Determine helper text
    const getHelperText = () => {
        if (helperText) return helperText;
        
        const digits = displayValue.replace(/\D/g, '');
        if (digits.length === 0) {
            return 'Enter Australian phone number (e.g., 04xx xxx xxx)';
        } else if (displayValue.startsWith('+61') && !validateAustralianPhone(displayValue)) {
            return 'Please enter a valid Australian phone number';
        }
        return 'Valid Australian phone number ✓';
    };

    // Determine if there's an error
    const hasError = error || (displayValue.startsWith('+61') && displayValue.length > 0 && !validateAustralianPhone(displayValue));

    return (
        <TextField
            {...otherProps}
            name={name}
            label={label}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth={fullWidth}
            required={required}
            error={hasError}
            helperText={getHelperText()}
            placeholder="+61 4xx xxx xxx"
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <PhoneIcon color={hasError ? 'error' : 'action'} />
                    </InputAdornment>
                ),
                inputProps: {
                    maxLength: 17, // +61 4xx xxx xxx = 17 characters max
                }
            }}
            sx={{
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: hasError ? 'error.main' : undefined,
                    },
                },
            }}
        />
    );
}
