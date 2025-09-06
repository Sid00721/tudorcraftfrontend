import { Box, Skeleton, Card, CardContent, Stack } from '@mui/material';

// Intelligent skeleton that matches content structure
export const SmartSkeleton = ({ type = 'card', count = 1, height = 'auto' }) => {
  const skeletonComponents = {
    card: (
      <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Box>
          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="60%" height={16} />
        </CardContent>
      </Card>
    ),
    table: (
      <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
        <Box sx={{ p: 4, pb: 2 }}>
          <Skeleton variant="text" width="30%" height={24} />
        </Box>
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="20%" height={20} />
              <Box sx={{ flex: 1 }} />
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      </Card>
    ),
    stats: (
      <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3, height: height || 140 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 2 }} />
            <Skeleton variant="text" width="30%" height={16} />
          </Box>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="60%" height={16} />
        </CardContent>
      </Card>
    ),
    form: (
      <Card sx={{ border: '1px solid #E4E7EB', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Skeleton variant="text" width="30%" height={24} sx={{ mb: 3 }} />
          {[...Array(4)].map((_, i) => (
            <Box key={i} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="20%" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Skeleton variant="rectangular" width={100} height={44} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={120} height={44} sx={{ borderRadius: 2 }} />
          </Box>
        </CardContent>
      </Card>
    ),
  };

  return (
    <Stack spacing={3}>
      {[...Array(count)].map((_, i) => (
        <Box key={i} className="premium-skeleton">
          {skeletonComponents[type]}
        </Box>
      ))}
    </Stack>
  );
};

// Progressive loading with staggered animations
export const StaggeredLoader = ({ children, delay = 100 }) => (
  <Box
    sx={{
      '& > *': {
        animation: 'fadeInUp 0.4s ease-out forwards',
        opacity: 0,
      },
      '& > *:nth-of-type(1)': { animationDelay: '0ms' },
      '& > *:nth-of-type(2)': { animationDelay: `${delay}ms` },
      '& > *:nth-of-type(3)': { animationDelay: `${delay * 2}ms` },
      '& > *:nth-of-type(4)': { animationDelay: `${delay * 3}ms` },
      '& > *:nth-of-type(5)': { animationDelay: `${delay * 4}ms` },
      '& > *:nth-of-type(6)': { animationDelay: `${delay * 5}ms` },
      '@keyframes fadeInUp': {
        from: {
          opacity: 0,
          transform: 'translateY(20px)',
        },
        to: {
          opacity: 1,
          transform: 'translateY(0)',
        },
      },
    }}
  >
    {children}
  </Box>
);
