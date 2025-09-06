import { 
    Box, 
    Typography, 
    TextField, 
    Button, 
    Card, 
    CardContent, 
    Alert,
    Chip,
    Stack,
    Avatar,
    IconButton,
    Divider,
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

// Premium Section Card
export const SectionCard = ({ title, description, children, icon: Icon, ...props }) => (
    <Card 
        sx={{ 
            border: '1px solid #E4E7EB',
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            mb: 3,
            ...props.sx 
        }}
        {...props}
    >
        <CardContent sx={{ p: 4 }}>
            {(title || description) && (
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        {Icon && (
                            <Box
                                sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1.5,
                                    backgroundColor: '#EBF0FF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon sx={{ fontSize: 18, color: '#2D5BFF' }} />
                            </Box>
                        )}
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 600, 
                                color: '#111827' 
                            }}
                        >
                            {title}
                        </Typography>
                    </Box>
                    {description && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: '#6B7280',
                                ml: Icon ? 5 : 0 
                            }}
                        >
                            {description}
                        </Typography>
                    )}
                </Box>
            )}
            {children}
        </CardContent>
    </Card>
);

// Premium Form Field
export const FormField = ({ 
    label, 
    description, 
    required = false, 
    error = false,
    children,
    ...props 
}) => (
    <Box sx={{ mb: 3 }} {...props}>
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
            {required && (
                <Typography component="span" sx={{ color: '#EF4444' }}>
                    *
                </Typography>
            )}
        </Typography>
        {description && (
            <Typography 
                variant="caption" 
                sx={{ 
                    color: '#6B7280', 
                    display: 'block',
                    mb: 1.5 
                }}
            >
                {description}
            </Typography>
        )}
        {children}
    </Box>
);

// Premium Status Alert
export const StatusAlert = ({ 
    type = 'info', 
    title, 
    message, 
    onClose,
    action,
    ...props 
}) => {
    const config = {
        success: { icon: CheckIcon, color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5' },
        error: { icon: ErrorIcon, color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
        warning: { icon: WarningIcon, color: '#F59E0B', bg: '#FFFBEB', border: '#FED7AA' },
        info: { icon: InfoIcon, color: '#2D5BFF', bg: '#EBF0FF', border: '#DBEAFE' },
    };

    const { icon: IconComponent, color, bg, border } = config[type] || config.info;

    return (
        <Alert
            severity={type}
            sx={{
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                    color: color,
                },
                ...props.sx
            }}
            action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {action}
                    {onClose && (
                        <IconButton size="small" onClick={onClose}>
                            <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    )}
                </Box>
            }
            {...props}
        >
            {title && (
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {title}
                </Typography>
            )}
            <Typography variant="body2">
                {message}
            </Typography>
        </Alert>
    );
};

// Premium Status Chip
export const StatusChip = ({ status, ...props }) => {
    const getStatusConfig = (status) => {
        const statusLower = status?.toLowerCase() || '';
        
        if (['approved', 'confirmed', 'completed', 'active'].includes(statusLower)) {
            return { color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5', label: status };
        }
        if (['pending', 'waiting'].includes(statusLower)) {
            return { color: '#F59E0B', bg: '#FFFBEB', border: '#FED7AA', label: status };
        }
        if (['rejected', 'cancelled', 'failed'].includes(statusLower)) {
            return { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', label: status };
        }
        if (['suspended', 'blocked'].includes(statusLower)) {
            return { color: '#6B7280', bg: '#F4F6F8', border: '#E4E7EB', label: status };
        }
        
        return { color: '#2D5BFF', bg: '#EBF0FF', border: '#DBEAFE', label: status };
    };

    const { color, bg, border, label } = getStatusConfig(status);

    return (
        <Chip
            label={label}
            size="small"
            sx={{
                backgroundColor: bg,
                color: color,
                border: `1px solid ${border}`,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                ...props.sx
            }}
            {...props}
        />
    );
};

// Premium Action Button
export const ActionButton = ({ 
    children, 
    variant = 'primary', 
    size = 'medium',
    loading = false,
    ...props 
}) => {
    const variants = {
        primary: {
            background: 'linear-gradient(135deg, #2D5BFF 0%, #1E47E6 100%)',
            color: '#FFFFFF',
            '&:hover': {
                background: 'linear-gradient(135deg, #1E47E6 0%, #1538CC 100%)',
            },
        },
        secondary: {
            background: 'linear-gradient(135deg, #FF6B2C 0%, #E55A1F 100%)',
            color: '#FFFFFF',
            '&:hover': {
                background: 'linear-gradient(135deg, #E55A1F 0%, #CC4A15 100%)',
            },
        },
        outline: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E4E7EB',
            color: '#374151',
            '&:hover': {
                backgroundColor: '#F4F6F8',
                borderColor: '#D1D6DB',
            },
        },
        ghost: {
            backgroundColor: 'transparent',
            color: '#6B7280',
            '&:hover': {
                backgroundColor: '#F4F6F8',
                color: '#374151',
            },
        },
    };

    const sizes = {
        small: { px: 2, py: 1, fontSize: '0.75rem', minHeight: 32 },
        medium: { px: 3, py: 1.5, fontSize: '0.875rem', minHeight: 40 },
        large: { px: 4, py: 2, fontSize: '0.875rem', minHeight: 48 },
    };

    return (
        <Button
            disabled={loading}
            sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: variant !== 'ghost' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                },
                ...variants[variant],
                ...sizes[size],
                ...props.sx
            }}
            {...props}
        >
            {loading ? <CircularProgress size={16} color="inherit" /> : children}
        </Button>
    );
};

// Premium Data Card
export const DataCard = ({ 
    title, 
    subtitle, 
    value, 
    icon: Icon, 
    trend, 
    color = 'primary',
    loading = false,
    ...props 
}) => {
    const colorConfig = {
        primary: { main: '#2D5BFF', bg: '#EBF0FF', light: '#DBEAFE' },
        secondary: { main: '#FF6B2C', bg: '#FFF0EB', light: '#FED7AA' },
        success: { main: '#10B981', bg: '#ECFDF5', light: '#D1FAE5' },
        warning: { main: '#F59E0B', bg: '#FFFBEB', light: '#FED7AA' },
    };

    const config = colorConfig[color] || colorConfig.primary;

    return (
        <Card 
            sx={{ 
                height: '100%',
                border: '1px solid #E4E7EB',
                borderRadius: 3,
                backgroundColor: '#FFFFFF',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderColor: config.main,
                },
                ...props.sx
            }}
            {...props}
        >
            <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: config.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon sx={{ fontSize: 24, color: config.main }} />
                    </Box>
                    {trend && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: '#10B981' 
                            }} />
                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                {trend}
                            </Typography>
                        </Box>
                    )}
                </Box>
                
                {loading ? (
                    <Box>
                        <Box sx={{ width: '60%', height: 32, bgcolor: '#F4F6F8', borderRadius: 1, mb: 1 }} />
                        <Box sx={{ width: '80%', height: 16, bgcolor: '#F4F6F8', borderRadius: 1 }} />
                    </Box>
                ) : (
                    <>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 700,
                                color: '#111827',
                                lineHeight: 1,
                                mb: 1,
                            }}
                        >
                            {value}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#6B7280',
                                fontWeight: 500,
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#9DA4AE',
                                    display: 'block',
                                    mt: 0.5,
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

// Premium Loading State
export const LoadingCard = ({ height = 200 }) => (
    <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, height }}>
        <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ width: 48, height: 48, bgcolor: '#F4F6F8', borderRadius: 2 }} />
                <Box>
                    <Box sx={{ width: 120, height: 16, bgcolor: '#F4F6F8', borderRadius: 1, mb: 1 }} />
                    <Box sx={{ width: 80, height: 12, bgcolor: '#F4F6F8', borderRadius: 1 }} />
                </Box>
            </Box>
            <Box sx={{ width: '100%', height: 12, bgcolor: '#F4F6F8', borderRadius: 1, mb: 1 }} />
            <Box sx={{ width: '80%', height: 12, bgcolor: '#F4F6F8', borderRadius: 1, mb: 1 }} />
            <Box sx={{ width: '60%', height: 12, bgcolor: '#F4F6F8', borderRadius: 1 }} />
        </CardContent>
    </Card>
);

// Premium Empty State
export const EmptyState = ({ 
    title, 
    description, 
    action, 
    icon: Icon,
    ...props 
}) => (
    <Box
        sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
            ...props.sx
        }}
        {...props}
    >
        {Icon && (
            <Box
                sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    backgroundColor: '#F4F6F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}
            >
                <Icon sx={{ fontSize: 28, color: '#9DA4AE' }} />
            </Box>
        )}
        <Typography
            variant="h6"
            sx={{
                fontWeight: 600,
                color: '#111827',
                mb: 1,
            }}
        >
            {title}
        </Typography>
        <Typography
            variant="body2"
            sx={{
                color: '#6B7280',
                mb: 3,
                maxWidth: 400,
                margin: '0 auto 24px',
            }}
        >
            {description}
        </Typography>
        {action}
    </Box>
);

// Premium Badge
export const Badge = ({ 
    children, 
    variant = 'default', 
    size = 'medium',
    ...props 
}) => {
    const variants = {
        default: { bg: '#F4F6F8', color: '#374151', border: '#E4E7EB' },
        primary: { bg: '#EBF0FF', color: '#2D5BFF', border: '#DBEAFE' },
        secondary: { bg: '#FFF0EB', color: '#FF6B2C', border: '#FED7AA' },
        success: { bg: '#ECFDF5', color: '#10B981', border: '#D1FAE5' },
        warning: { bg: '#FFFBEB', color: '#F59E0B', border: '#FED7AA' },
        error: { bg: '#FEF2F2', color: '#EF4444', border: '#FECACA' },
    };

    const sizes = {
        small: { px: 2, py: 0.5, fontSize: '0.75rem', height: 24 },
        medium: { px: 2.5, py: 1, fontSize: '0.75rem', height: 28 },
        large: { px: 3, py: 1.5, fontSize: '0.875rem', height: 32 },
    };

    const variantConfig = variants[variant] || variants.default;
    const sizeConfig = sizes[size] || sizes.medium;

    return (
        <Chip
            label={children}
            sx={{
                backgroundColor: variantConfig.bg,
                color: variantConfig.color,
                border: `1px solid ${variantConfig.border}`,
                fontWeight: 600,
                borderRadius: 2,
                ...sizeConfig,
                ...props.sx
            }}
            {...props}
        />
    );
};
