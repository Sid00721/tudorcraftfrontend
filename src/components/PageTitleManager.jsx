import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Component to manage page titles and favicon updates
export const PageTitleManager = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const updatePageInfo = () => {
      const getPageInfo = (path) => {
        const routes = {
          '/': {
            title: 'Dashboard',
            description: 'Platform overview and management',
            icon: '📊',
            favicon: 'admin'
          },
          '/admin/approvals': {
            title: 'Tutor Approvals',
            description: 'Review and approve new tutors',
            icon: '👥',
            favicon: 'admin'
          },
          '/admin/resources': {
            title: 'Resource Management',
            description: 'Manage educational resources',
            icon: '📚',
            favicon: 'admin'
          },
          '/admin/messages': {
            title: 'Message History',
            description: 'Communication analytics and history',
            icon: '💬',
            favicon: 'admin'
          },
          '/admin/cancellations': {
            title: 'AI Analytics',
            description: 'Cancellation analysis and insights',
            icon: '🤖',
            favicon: 'admin'
          },
          '/admin/reschedules': {
            title: 'Reschedule Manager',
            description: 'Manage session rescheduling',
            icon: '📅',
            favicon: 'admin'
          },
          '/tutor/dashboard': {
            title: 'Tutor Dashboard',
            description: 'Your teaching sessions and requests',
            icon: '🎓',
            favicon: 'tutor'
          },
          '/tutor/profile': {
            title: 'Profile Settings',
            description: 'Manage your teaching profile',
            icon: '👤',
            favicon: 'tutor'
          },
          '/tutor/resources': {
            title: 'Resource Hub',
            description: 'Educational resources and materials',
            icon: '📖',
            favicon: 'tutor'
          },
          '/admin/login': {
            title: 'Admin Login',
            description: 'Administrator portal access',
            icon: '🔐',
            favicon: 'admin'
          },
          '/tutor/login': {
            title: 'Tutor Login',
            description: 'Tutor portal access',
            icon: '🎓',
            favicon: 'tutor'
          }
        };

        // Handle dynamic routes
        if (path.includes('/trial/')) {
          return {
            title: 'Trial Details',
            description: 'Trial session management',
            icon: '📋',
            favicon: 'admin'
          };
        }
        
        if (path.includes('/session/')) {
          return {
            title: 'Session Details',
            description: 'Session management and tutor matching',
            icon: '🎯',
            favicon: 'admin'
          };
        }

        return routes[path] || {
          title: 'TutorCraft',
          description: 'Enterprise tutoring platform',
          icon: '🎓',
          favicon: 'default'
        };
      };

      const pageInfo = getPageInfo(location.pathname);
      
      // Update page title
      document.title = `${pageInfo.icon} ${pageInfo.title} | TutorCraft`;
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', pageInfo.description);
      }

      // Update favicon based on section
      const updateFavicon = (type) => {
        const faviconTypes = {
          default: '/tutorcraft-favicon.svg',
          admin: '/tutorcraft-favicon-admin.svg',
          tutor: '/tutorcraft-favicon-tutor.svg',
        };

        const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = faviconTypes[type] || faviconTypes.default;
        
        if (!document.querySelector('link[rel="icon"]')) {
          document.head.appendChild(link);
        }
      };

      updateFavicon(pageInfo.favicon);

      // Update theme color based on section
      let themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        const isAdminSection = location.pathname.includes('/admin/') || location.pathname === '/';
        const isTutorSection = location.pathname.includes('/tutor/');
        
        if (isAdminSection) {
          themeColor.setAttribute('content', '#2D5BFF'); // Blue for admin
        } else if (isTutorSection) {
          themeColor.setAttribute('content', '#FF6B2C'); // Orange for tutor
        } else {
          themeColor.setAttribute('content', '#2D5BFF'); // Default blue
        }
      }
    };

    updatePageInfo();
  }, [location.pathname]);

  return children;
};

// Hook for components to set custom titles
export const useCustomPageTitle = (title, isLoading = false) => {
  useEffect(() => {
    const currentTitle = isLoading ? `⏳ Loading ${title}` : title;
    document.title = `${currentTitle} | TutorCraft`;
  }, [title, isLoading]);
};

// Utility to show notification count in title
export const updateTitleWithNotifications = (count = 0) => {
  const currentTitle = document.title.replace(/^\(\d+\)\s*/, ''); // Remove existing count
  if (count > 0) {
    document.title = `(${count}) ${currentTitle}`;
  } else {
    document.title = currentTitle;
  }
};
