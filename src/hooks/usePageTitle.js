import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Dynamic page title and favicon hook
export const usePageTitle = (customTitle = null) => {
  const location = useLocation();

  useEffect(() => {
    const getPageInfo = (path) => {
      const routes = {
        '/': {
          title: 'Dashboard',
          description: 'Overview and platform management',
          icon: '📊'
        },
        '/admin/approvals': {
          title: 'Tutor Approvals',
          description: 'Review and approve new tutors',
          icon: '👥'
        },
        '/admin/resources': {
          title: 'Resource Management',
          description: 'Manage educational resources',
          icon: '📚'
        },
        '/admin/messages': {
          title: 'Message History',
          description: 'Communication analytics',
          icon: '💬'
        },
        '/admin/cancellations': {
          title: 'AI Analytics',
          description: 'Cancellation analysis and insights',
          icon: '🤖'
        },
        '/admin/reschedules': {
          title: 'Reschedule Manager',
          description: 'Manage session rescheduling',
          icon: '📅'
        },
        '/tutor/dashboard': {
          title: 'Tutor Dashboard',
          description: 'Your teaching sessions and requests',
          icon: '🎓'
        },
        '/tutor/profile': {
          title: 'Tutor Profile',
          description: 'Manage your teaching profile',
          icon: '👤'
        },
        '/tutor/resources': {
          title: 'Resource Hub',
          description: 'Educational resources and materials',
          icon: '📖'
        },
        '/admin/login': {
          title: 'Admin Login',
          description: 'Administrator portal access',
          icon: '🔐'
        },
        '/tutor/login': {
          title: 'Tutor Login',
          description: 'Tutor portal access',
          icon: '🎓'
        }
      };

      // Handle dynamic routes
      if (path.includes('/trial/')) {
        return {
          title: 'Trial Details',
          description: 'Trial session management',
          icon: '📋'
        };
      }
      
      if (path.includes('/session/')) {
        return {
          title: 'Session Details',
          description: 'Session management and tutor matching',
          icon: '🎯'
        };
      }

      return routes[path] || {
        title: 'TutorCraft',
        description: 'Enterprise tutoring platform',
        icon: '🎓'
      };
    };

    const pageInfo = getPageInfo(location.pathname);
    const title = customTitle || pageInfo.title;
    
    // Update page title
    document.title = `${pageInfo.icon} ${title} | TutorCraft`;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', pageInfo.description);
    }

    // Update theme color based on section
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      const isAdminSection = location.pathname.includes('/admin/');
      const isTutorSection = location.pathname.includes('/tutor/');
      
      if (isAdminSection) {
        themeColor.setAttribute('content', '#2D5BFF'); // Blue for admin
      } else if (isTutorSection) {
        themeColor.setAttribute('content', '#FF6B2C'); // Orange for tutor
      } else {
        themeColor.setAttribute('content', '#2D5BFF'); // Default blue
      }
    }

  }, [location.pathname, customTitle]);

  return null;
};

// Hook for setting custom page titles with loading states
export const usePageTitleWithLoading = (title, isLoading = false) => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = title;
    const loadingTitle = isLoading ? `⏳ Loading ${baseTitle}` : baseTitle;
    
    const pageInfo = {
      '/': '📊',
      '/admin/approvals': '👥',
      '/admin/resources': '📚',
      '/admin/messages': '💬',
      '/admin/cancellations': '🤖',
      '/admin/reschedules': '📅',
      '/tutor/dashboard': '🎓',
      '/tutor/profile': '👤',
      '/tutor/resources': '📖',
    };

    const icon = pageInfo[location.pathname] || '🎓';
    document.title = `${icon} ${loadingTitle} | TutorCraft`;

  }, [title, isLoading, location.pathname]);
};

// Utility function to update favicon dynamically
export const updateFavicon = (type = 'default') => {
  const faviconTypes = {
    default: '/tutorcraft-favicon.svg',
    admin: '/tutorcraft-favicon-admin.svg',
    tutor: '/tutorcraft-favicon-tutor.svg',
    notification: '/tutorcraft-favicon-notification.svg',
  };

  const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = faviconTypes[type] || faviconTypes.default;
  
  if (!document.querySelector('link[rel="icon"]')) {
    document.head.appendChild(link);
  }
};
