import { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Card,
    CardContent,
    LinearProgress,
    Alert,
    Fade,
    Chip,
    Stack,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';

// Smart form field with real-time validation
export const SmartField = ({ 
    label, 
    value, 
    onChange, 
    validation = [], 
    suggestions = [],
    type = 'text',
    required = false,
    ...props 
}) => {
    const [focused, setFocused] = useState(false);
    const [touched, setTouched] = useState(false);
    const [validationResults, setValidationResults] = useState([]);

    useEffect(() => {
        if (touched && value) {
            const results = validation.map(rule => ({
                ...rule,
                passed: rule.test(value)
            }));
            setValidationResults(results);
        }
    }, [value, touched, validation]);

    const hasErrors = validationResults.some(r => !r.passed);
    const allPassed = validationResults.length > 0 && validationResults.every(r => r.passed);

    return (
        <Box sx={{ mb: 3 }}>
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 600,
                    color: '#374151',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                {label}
                {required && <Typography component="span" sx={{ color: '#EF4444' }}>*</Typography>}
                {allPassed && <CheckIcon sx={{ fontSize: 16, color: '#10B981' }} />}
            </Typography>
            
            <TextField
                fullWidth
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                    setFocused(false);
                    setTouched(true);
                }}
                error={touched && hasErrors}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '&.Mui-focused': {
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: hasErrors ? '#EF4444' : allPassed ? '#10B981' : '#2D5BFF',
                                boxShadow: hasErrors 
                                    ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                                    : allPassed 
                                        ? '0 0 0 3px rgba(16, 185, 129, 0.1)'
                                        : '0 0 0 3px rgba(45, 91, 255, 0.1)',
                            },
                        },
                    },
                }}
                {...props}
            />

            {/* Real-time validation feedback */}
            {touched && validationResults.length > 0 && (
                <Fade in={true}>
                    <Box sx={{ mt: 2 }}>
                        <Stack spacing={1}>
                            {validationResults.map((result, index) => (
                                <Box 
                                    key={index}
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1,
                                        color: result.passed ? '#10B981' : '#EF4444'
                                    }}
                                >
                                    {result.passed ? (
                                        <CheckIcon sx={{ fontSize: 14 }} />
                                    ) : (
                                        <UncheckedIcon sx={{ fontSize: 14 }} />
                                    )}
                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                        {result.message}
                                    </Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                </Fade>
            )}

            {/* Smart suggestions */}
            {focused && suggestions.length > 0 && value.length > 0 && (
                <Fade in={true}>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ color: '#6B7280', mb: 1, display: 'block' }}>
                            Suggestions:
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {suggestions
                                .filter(s => s.toLowerCase().includes(value.toLowerCase()))
                                .slice(0, 3)
                                .map((suggestion, index) => (
                                    <Chip
                                        key={index}
                                        label={suggestion}
                                        size="small"
                                        onClick={() => onChange({ target: { value: suggestion } })}
                                        sx={{
                                            backgroundColor: '#F4F6F8',
                                            color: '#374151',
                                            '&:hover': {
                                                backgroundColor: '#E4E7EB',
                                            },
                                        }}
                                    />
                                ))
                            }
                        </Stack>
                    </Box>
                </Fade>
            )}
        </Box>
    );
};

// Multi-step form with progress tracking
export const StepperForm = ({ steps, onComplete, onCancel }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [stepValidation, setStepValidation] = useState({});

    const handleNext = () => {
        if (activeStep < steps.length - 1) {
            setActiveStep(activeStep + 1);
        } else {
            onComplete?.(formData);
        }
    };

    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    const updateFormData = (stepData) => {
        setFormData(prev => ({ ...prev, ...stepData }));
    };

    const updateStepValidation = (stepIndex, isValid) => {
        setStepValidation(prev => ({ ...prev, [stepIndex]: isValid }));
    };

    const getStepProgress = () => {
        return ((activeStep + 1) / steps.length) * 100;
    };

    return (
        <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, overflow: 'hidden' }}>
            {/* Progress Header */}
            <Box sx={{ p: 4, pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#111827' }}>
                        {steps[activeStep]?.title || 'Form'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Step {activeStep + 1} of {steps.length}
                    </Typography>
                </Box>
                
                <LinearProgress 
                    variant="determinate" 
                    value={getStepProgress()} 
                    sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#E4E7EB',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #2D5BFF 0%, #FF6B2C 100%)',
                        },
                    }}
                />
            </Box>

            <CardContent sx={{ p: 4, pt: 2 }}>
                {/* Step Content */}
                <Fade in={true} key={activeStep}>
                    <Box>
                        {steps[activeStep]?.description && (
                            <Typography variant="body2" sx={{ color: '#6B7280', mb: 3 }}>
                                {steps[activeStep].description}
                            </Typography>
                        )}
                        
                        {steps[activeStep]?.component && (
                            <steps[activeStep].component
                                data={formData}
                                onChange={updateFormData}
                                onValidation={(isValid) => updateStepValidation(activeStep, isValid)}
                            />
                        )}
                    </Box>
                </Fade>

                {/* Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        onClick={activeStep === 0 ? onCancel : handleBack}
                        variant="outlined"
                        sx={{
                            borderColor: '#E4E7EB',
                            color: '#6B7280',
                        }}
                    >
                        {activeStep === 0 ? 'Cancel' : 'Back'}
                    </Button>
                    
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        disabled={stepValidation[activeStep] === false}
                        sx={{
                            background: 'linear-gradient(135deg, #2D5BFF 0%, #1E47E6 100%)',
                        }}
                    >
                        {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

// Form validation rules
export const validationRules = {
    email: {
        test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Must be a valid email address'
    },
    phone: {
        test: (value) => /^\+61\s[4-9]\d{2}\s\d{3}\s\d{3}$/.test(value),
        message: 'Must be a valid Australian phone number'
    },
    minLength: (min) => ({
        test: (value) => value.length >= min,
        message: `Must be at least ${min} characters`
    }),
    maxLength: (max) => ({
        test: (value) => value.length <= max,
        message: `Must be no more than ${max} characters`
    }),
    wordCount: (min, max) => ({
        test: (value) => {
            const words = value.trim().split(/\s+/).filter(w => w.length > 0).length;
            return words >= min && words <= max;
        },
        message: `Must be between ${min} and ${max} words`
    }),
    required: {
        test: (value) => value && value.trim().length > 0,
        message: 'This field is required'
    },
    atar: {
        test: (value) => !value || (parseFloat(value) >= 0 && parseFloat(value) <= 99.95),
        message: 'ATAR must be between 0 and 99.95'
    },
};
