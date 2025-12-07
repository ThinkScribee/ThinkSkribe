import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  MessageOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  RobotOutlined,
  BellOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import './MobileBottomTabs.css';

const MobileBottomTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { notifications } = useNotifications();

  // Get unread message count
  const unreadMessageCount = notifications.filter(n => 
    (n.type === 'message' || n.title?.toLowerCase().includes('message') || n.content?.toLowerCase().includes('message')) && !n.read
  ).length;

  // Get unread notification count
  const unreadNotificationCount = notifications.filter(n => 
    n.type !== 'message' && !n.title?.toLowerCase().includes('message') && !n.content?.toLowerCase().includes('message') && !n.read
  ).length;

  const getDashboardLink = () => {
    if (!isAuthenticated || !user) return '/';
    
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'writer':
        return '/writer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getTabsForRole = () => {
    if (!isAuthenticated || !user) {
      return [
        {
          key: 'home',
          icon: <HomeOutlined />,
          label: 'Home',
          path: '/'
        },
        {
          key: 'about',
          icon: <InfoCircleOutlined />,
          label: 'About',
          path: '/about'
        }
      ];
    }

    const commonTabs = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        path: getDashboardLink()
      },
      {
        key: 'ai-chat',
        icon: <RobotOutlined />,
        label: 'AI',
        path: 'https://ai.thinqscribe.com',
        external: true
      }
    ];

    if (user.role === 'student') {
      return [
        ...commonTabs,
        {
          key: 'jobs',
          icon: <FileTextOutlined />,
          label: 'My Jobs',
          path: '/student/jobs'
        },
        {
          key: 'writers',
          icon: <TeamOutlined />,
          label: 'Writers',
          path: '/writers'
        },
        {
          key: 'messages',
          icon: <MessageOutlined />,
          label: 'Messages',
          path: '/chat/student',
          badge: unreadMessageCount
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profile',
          path: '/profile'
        }
      ];
    } else if (user.role === 'writer') {
      return [
        ...commonTabs,
        {
          key: 'jobs',
          icon: <FileTextOutlined />,
          label: 'Jobs',
          path: '/writer/jobs'
        },
        {
          key: 'messages',
          icon: <MessageOutlined />,
          label: 'Messages',
          path: '/chat/writer',
          badge: unreadMessageCount
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profile',
          path: '/profile'
        }
      ];
    } else if (user.role === 'admin') {
      return [
        ...commonTabs,
        {
          key: 'users',
          icon: <TeamOutlined />,
          label: 'Users',
          path: '/admin/users'
        },
        {
          key: 'influencers',
          icon: <FileTextOutlined />,
          label: 'Influencers',
          path: '/admin/influencers'
        },
        {
          key: 'notifications',
          icon: <BellOutlined />,
          label: 'Alerts',
          path: '/notifications',
          badge: unreadNotificationCount
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Profile',
          path: '/profile'
        }
      ];
    }

    return commonTabs;
  };

  const tabs = getTabsForRole();
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === getDashboardLink()) return location.pathname === getDashboardLink();
    return location.pathname.startsWith(path);
  };

  const handleTabClick = (tab) => {
    if (tab.external) {
      window.open(tab.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(tab.path);
    }
  };

  // Hide bottom tabs in chat rooms
  const isInChatRoom = location.pathname.includes('/chat/');
  if (isInChatRoom) {
    return null;
  }

  return (
    <div className="mobile-bottom-tabs">
      <div className="mobile-bottom-tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`mobile-tab-item ${isActive(tab.path) ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
            aria-label={tab.label}
          >
            <div className="mobile-tab-icon">
              {tab.badge && tab.badge > 0 ? (
                <Badge count={tab.badge} size="small" offset={[-2, 2]}>
                  {tab.icon}
                </Badge>
              ) : (
                tab.icon
              )}
            </div>
            <span className="mobile-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileBottomTabs;