import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  Badge, 
  Space, 
  Tabs, 
  notification,
  Input,
  Select,
  Modal,
  Descriptions,
  Tag,
  Alert,
  Typography,
  Progress,
  Divider,
  Avatar,
  Tooltip,
  Layout
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  DollarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined,
  TrophyOutlined,
  RiseOutlined,
  StarOutlined,
  CalendarOutlined,
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  MonitorOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line as ReactLine, Bar, Doughnut } from 'react-chartjs-2';
// Removed heavy @ant-design/plots - using lightweight alternatives
// import { RevenueChart, UserGrowthChart, MiniStatsChart } from '../components/LightweightCharts';
import NewHeader from '../components/NewHeader';
import AppLoader from '../components/AppLoader';
import UserModal from '../components/UserModal';
import ExportChats from './ExportChats';
import client from '../api/client';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  ArcElement
);

// Real Chart.js Components with Backend Data
const RevenueChart = ({ data, stats }) => {
  console.log('📊 [RevenueChart] Data received:', data);
  console.log('📊 [RevenueChart] Stats received:', stats);
  
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Typography.Text type="secondary">No revenue data available</Typography.Text>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#8c8c8c' }}>
          Total Revenue: ₦{Math.abs(stats?.revenue?.grossRevenue || 0).toFixed(2)}
        </div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => `Month ${item._id.month}`),
    datasets: [
      {
        label: 'Platform Revenue (₦)',
        data: data.map(item => Math.abs(item.platformRevenue || 0)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Writer Earnings (₦)',
        data: data.map(item => Math.abs(item.writerEarnings || 0)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Monthly Revenue - Total: ₦${Math.abs(stats?.revenue?.grossRevenue || 0).toFixed(2)}`
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₦' + value;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <ReactLine data={chartData} options={options} />
    </div>
  );
};

const UserGrowthChart = ({ stats }) => {
  const chartData = {
    labels: ['Students', 'Writers', 'Admins'],
    datasets: [
      {
        label: 'User Distribution',
        data: [
          stats?.users?.students || 0,
          stats?.users?.writers || 0,
          stats?.users?.admins || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(255, 205, 86, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Total Users: ${stats?.users?.total || 0}`
      },
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

const ProjectAnalyticsChart = ({ stats }) => {
  const chartData = {
    labels: ['Active', 'Completed', 'Pending'],
    datasets: [
      {
        label: 'Projects',
        data: [
          stats?.agreements?.active || 0,
          stats?.agreements?.completed || 0,
          stats?.agreements?.pending || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Total Projects: ${stats?.agreements?.total || 0}`
      },
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

const MiniStatsChart = ({ data }) => (
  <div style={{ height: '40px', background: '#f0f0f0', borderRadius: '4px' }}>
    <div style={{ 
      height: '100%', 
      background: 'linear-gradient(90deg, #1890ff, #40a9ff)', 
      borderRadius: '4px',
      width: '70%'
    }} />
  </div>
);

// Modern styling constants
const modernStyles = {
  container: {
    background: `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)`,
    minHeight: '100vh',
    padding: '0',
    paddingTop: 'clamp(70px, 15vw, 80px)' // Add responsive space for fixed NewHeader
  },
  contentWrapper: {
    background: 'var(--light-gray)',
    borderRadius: '24px 24px 0 0',
    minHeight: 'calc(100vh - 80px)', // Adjust height to account for header
    marginTop: '0',
    padding: 'clamp(16px, 4vw, 32px)'
  },
  headerCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: 'none',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    marginBottom: '32px'
  },
  statsCard: {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, #ffffff 0%, var(--light-gray) 100%)'
  },
  chartCard: {
    borderRadius: '20px',
    border: 'none',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
    background: '#ffffff'
  },
  gradientText: {
    background: `linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  }
};

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { socket } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [writers, setWriters] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobSummary, setJobSummary] = useState({});
  const [jobFilters, setJobFilters] = useState({ status: 'all', assigned: 'all', search: '' });
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [writerFilter, setWriterFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Wait for auth to be ready and ensure user is admin before fetching
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user?.role !== 'admin') {
      notification.warning({
        message: 'Access denied',
        description: 'Admin access required.'
      });
      navigate('/signin');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user?._id, user?.role]);

  // Fetch users when Users tab is activated
  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      console.log('👥 [Effect] Users tab activated, fetching users...');
      fetchUsers();
    }
  }, [activeTab]);

  // Socket event handlers for real-time admin updates
  useEffect(() => {
    if (!socket || !user?._id || user?.role !== 'admin') return;

    console.log('🔌 Setting up socket listeners for admin dashboard');

    // Join admin room
    socket.emit('joinUserRoom', user._id);

    const handleNewCompletion = (data) => {
      console.log('🎉 [Admin] New completion received:', data);
      
      // Update stats if they exist
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          agreements: {
            ...prev.agreements,
            completed: (prev.agreements?.completed || 0) + 1,
            total: (prev.agreements?.total || 0)
          },
          revenue: {
            ...prev.revenue,
            grossRevenue: (prev.revenue?.grossRevenue || 0) + (data.amount || 0),
            platformRevenue: (prev.revenue?.platformRevenue || 0) + (data.amount * 0.2 || 0)
          }
        };
      });
      
      // Update agreements list if loaded
      setAgreements(prev => {
        const updatedAgreements = prev.map(agreement => {
          if (agreement._id === data.agreementId) {
            return { ...agreement, status: 'completed', completedAt: data.completedAt };
          }
          return agreement;
        });
        return updatedAgreements;
      });
      
      notification.success({
        message: 'New Project Completion',
        description: `${data.writerName} completed "${data.title}" for ${data.studentName}`,
        placement: 'bottomRight',
        duration: 8
      });
      
      // Refresh dashboard data
      setTimeout(() => fetchDashboardData(), 3000);
    };

    const handleAgreementUpdated = (data) => {
      console.log('📝 [Admin] Agreement updated:', data);
      
      // Update specific agreement in list
      setAgreements(prev => {
        return prev.map(agreement => {
          if (agreement._id === data.agreementId) {
            return { ...agreement, status: data.status };
          }
          return agreement;
        });
      });
      
      // Refresh dashboard data for accurate stats
      setTimeout(() => fetchDashboardData(), 2000);
    };

    const handleDashboardUpdate = (data) => {
      console.log('📊 [Admin] Dashboard update received:', data);
      // Trigger a data refresh
      fetchDashboardData();
    };

    // Register socket listeners
    socket.on('newCompletion', handleNewCompletion);
    socket.on('agreementUpdated', handleAgreementUpdated);
    socket.on('dashboardUpdate', handleDashboardUpdate);

    // Clean up listeners
    return () => {
      socket.off('newCompletion', handleNewCompletion);
      socket.off('agreementUpdated', handleAgreementUpdated);
      socket.off('dashboardUpdate', handleDashboardUpdate);
    };
  }, [socket, user?._id, user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 [Admin] Fetching dashboard data...');
      
      // Fetch data with individual error handling
      const results = await Promise.allSettled([
        client.get('/admin/stats'),
        client.get('/admin/writers'),
        client.get('/admin/agreements'),
        client.get('/admin/users'),
        adminApi.getJobs({ page: 1, limit: 20 })
      ]);

      console.log('📊 [Admin] Raw API results:', results);

      // Handle stats
      if (results[0].status === 'fulfilled') {
        const s = results[0].value?.data || results[0].value;
        setStats(s);
        console.log('✅ [Admin] Stats loaded:', results[0].value);
      } else {
        console.error('❌ [Admin] Stats failed:', results[0].reason);
      }

      // Handle writers with better extraction
      if (results[1].status === 'fulfilled') {
        const writersData = results[1].value;
        console.log('📝 [Admin] Raw writers data:', writersData);
        
        // Try different data structures
        const extractedWriters = writersData.data?.writers || 
                                writersData.writers || 
                                writersData.data || 
                                writersData || 
                                [];
        
        setWriters(Array.isArray(extractedWriters) ? extractedWriters : []);
        console.log('✅ [Admin] Writers loaded:', extractedWriters.length, 'writers');
        console.log('👥 [Admin] First writer sample:', extractedWriters[0]);
      } else {
        console.error('❌ [Admin] Writers failed:', results[1].reason);
        setWriters([]);
      }

      // Handle agreements
      if (results[2].status === 'fulfilled') {
        const agreementsData = results[2].value;
        const extractedAgreements = agreementsData.data?.agreements || 
                                   agreementsData.agreements || 
                                   agreementsData.data || 
                                   agreementsData || 
                                   [];
        setAgreements(Array.isArray(extractedAgreements) ? extractedAgreements : []);
        console.log('✅ [Admin] Agreements loaded:', extractedAgreements.length);
      } else {
        console.error('❌ [Admin] Agreements failed:', results[2].reason);
        setAgreements([]);
      }

      // Handle users
      if (results[3].status === 'fulfilled') {
        const usersData = results[3].value;
        const extractedUsers = usersData.data?.users || 
                              usersData.users || 
                              usersData.data || 
                              usersData || 
                              [];
        setUsers(Array.isArray(extractedUsers) ? extractedUsers : []);
        console.log('✅ [Admin] Users loaded:', extractedUsers.length);
      } else {
        console.error('❌ [Admin] Users failed:', results[3].reason);
        setUsers([]);
      }

      // Handle jobs
      if (results[4].status === 'fulfilled') {
        const jobsData = results[4].value;
        const extractedJobs = jobsData.data?.data?.jobs || jobsData.data?.jobs || jobsData.jobs || [];
        const summary = jobsData.data?.data?.summary || jobsData.data?.summary || jobsData.summary || {};
        setJobs(Array.isArray(extractedJobs) ? extractedJobs : []);
        setJobSummary(summary || {});
        console.log('✅ [Admin] Jobs loaded:', extractedJobs.length);
      } else {
        console.error('❌ [Admin] Jobs failed:', results[4].reason);
        setJobs([]);
      }

      console.log('🎯 [Debug] Stats structure:', {
        writers: stats?.writers,
        revenue: stats?.revenue,
        monthlyBreakdown: stats?.revenue?.monthlyBreakdown
      });

      // Debug: Log revenue data structure
      console.log('🎯 [AdminDashboard] Current stats:', stats);
      console.log('🎯 [AdminDashboard] Revenue data:', stats?.revenue);
      console.log('🎯 [AdminDashboard] Monthly breakdown:', stats?.revenue?.monthlyBreakdown);

    } catch (error) {
      console.error('❌ [Admin] Dashboard fetch error:', error);
      notification.error({
        message: 'Error',
        description: `Failed to fetch dashboard data: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (overrides = {}) => {
    try {
      const params = { page: 1, limit: 20 };
      const filters = { ...jobFilters, ...overrides };
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.assigned && filters.assigned !== 'all') params.assigned = filters.assigned;
      if (filters.search) params.search = filters.search;
      const res = await adminApi.getJobs(params);
      const extractedJobs = res.data?.data?.jobs || res.data?.jobs || [];
      const summary = res.data?.data?.summary || res.data?.summary || {};
      setJobs(Array.isArray(extractedJobs) ? extractedJobs : []);
      setJobSummary(summary || {});
    } catch (error) {
      notification.error({ message: 'Failed to load jobs' });
    }
  };

  const handleApproveWriter = async (writerId) => {
    try {
      await client.post(`/admin/writers/${writerId}/approve`);
      notification.success({
        message: 'Success',
        description: 'Writer approved successfully'
      });
      fetchDashboardData();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to approve writer'
      });
    }
  };

  const handlePublishWriter = async (writerId) => {
    try {
      await client.post(`/admin/writers/${writerId}/publish`);
      notification.success({
        message: 'Success',
        description: 'Writer published successfully'
      });
      fetchDashboardData();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to publish writer'
      });
    }
  };

  const handleUnpublishWriter = async (writerId) => {
    try {
      await client.post(`/admin/writers/${writerId}/unpublish`);
      notification.success({
        message: 'Success',
        description: 'Writer unpublished successfully'
      });
      fetchDashboardData();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to unpublish writer'
      });
    }
  };

  const handleFixPayments = async () => {
    Modal.confirm({
      title: 'Fix Payment Issues',
      content: 'This will fix payment calculation issues and processing statuses. Continue?',
      onOk: async () => {
        try {
          await client.post('/admin/fix-payment-calculations');
          await client.post('/admin/fix-payment-statuses');
          notification.success({
            message: 'Success',
            description: 'Payment issues fixed successfully'
          });
          fetchDashboardData();
        } catch (error) {
          notification.error({
            message: 'Error',
            description: 'Failed to fix payment issues'
          });
        }
      }
    });
  };

  const handleDebugPayments = async () => {
    try {
      const response = await client.get('/admin/debug-payments');
      console.log('💰 [Debug] Payment debug results:', response);
      
      const debug = response.debug || response;
      notification.info({
        message: 'Payment Debug Results',
        description: `Found ${debug.totalPayments} payments. Check console for details.`,
        duration: 8
      });
      
      // Log detailed results
      console.log('📊 Status breakdown:', debug.statusBreakdown);
      console.log('💵 Total amount (all):', debug.totalAmountAll);
      console.log('🔍 Current revenue query result:', debug.currentRevenueResult);
      console.log('🔍 Alternative revenue query result:', debug.alternativeRevenueResult);
      console.log('💳 Sample payments:', debug.samplePayments);
      
    } catch (error) {
      console.error('Debug error:', error);
      notification.error({
        message: 'Debug Error',
        description: 'Failed to fetch payment debug info'
      });
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('👥 [fetchUsers] Fetching users...');
      const response = await adminApi.getUsers();
      console.log('👥 [fetchUsers] Response:', response);
      const usersData = response.data.data.users || response.data.users || [];
      console.log('👥 [fetchUsers] Users data:', usersData);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ [AdminDashboard] Error fetching users:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to fetch users'
      });
    }
  };


  const handleViewUserDetails = (record) => {
    console.log('👁️ [handleViewUserDetails] Opening modal for user:', record);
    setSelectedUser(record);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  const handleDeleteUserFromModal = async (userId, userName) => {
    try {
      console.log('🗑️ [handleDeleteUserFromModal] Deleting user:', { userId, userName });
      console.log('🗑️ [handleDeleteUserFromModal] Current user ID:', user?._id);
      console.log('🗑️ [handleDeleteUserFromModal] Selected user ID:', selectedUser?._id);
      console.log('🗑️ [handleDeleteUserFromModal] Is current user?', selectedUser?._id === user?._id);
      
      await adminApi.deleteUser(userId);
      console.log('✅ [handleDeleteUserFromModal] API call successful');
      
      notification.success({
        message: 'Success',
        description: 'User deleted successfully'
      });
      
      console.log('🔄 [handleDeleteUserFromModal] Refreshing users list...');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('❌ [handleDeleteUserFromModal] Error deleting user:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to delete user'
      });
    }
  };

  // Test function to verify if functions are working
  const testFunction = () => {
    console.log('🧪 [Test Function] Test function called');
    alert('Test function works!');
  };

  // CSV Export function for writers
  const handleExportWritersCSV = () => {
    try {
      const csvData = filteredWriters.map(writer => ({
        name: writer.name || '',
        email: writer.email || '',
        specialties: (writer.writerProfile?.specialties || []).join(', ')
      }));

      // Create CSV content
      const headers = ['Name', 'Email', 'Specialties'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => [
          `"${row.name}"`,
          `"${row.email}"`,
          `"${row.specialties}"`
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `writers_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notification.success({
        message: 'Export Successful',
        description: `Exported ${csvData.length} writers to CSV file`
      });
    } catch (error) {
      console.error('Export error:', error);
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export writers data'
      });
    }
  };

  // CSV Export function for students
  const handleExportStudentsCSV = () => {
    try {
      const studentsOnly = filteredUsers.filter(u => u.role === 'student');
      const csvData = studentsOnly.map(student => ({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        createdAt: student.createdAt ? new Date(student.createdAt).toISOString() : ''
      }));

      const headers = ['Name', 'Email', 'Phone', 'Joined'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => [
          `"${row.name}"`,
          `"${row.email}"`,
          `"${row.phone}"`,
          `"${row.createdAt}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notification.success({
        message: 'Export Successful',
        description: `Exported ${csvData.length} students to CSV file`
      });
    } catch (error) {
      console.error('Export students error:', error);
      notification.error({
        message: 'Export Failed',
        description: 'Failed to export students data'
      });
    }
  };

  // Prepare chart data from real backend data
  const revenueChartData = stats?.revenue?.monthlyBreakdown?.map(item => ({
    month: `Month ${item._id.month}`,
    platformRevenue: Math.abs(item.platformRevenue || 0),
    writerEarnings: Math.abs(item.writerEarnings || 0),
    grossRevenue: Math.abs(item.grossRevenue || 0)
  })) || [];

  // Create user growth data from real stats
  const userGrowthData = stats?.revenue?.monthlyBreakdown?.map(item => ({
    month: `Month ${item._id.month}`,
    students: Math.floor(item.count * 0.7), // Approximate student payments
    writers: Math.floor(item.count * 0.3)   // Approximate writer payments
  })) || [
    { month: 'Jan', students: stats?.users?.students || 0, writers: stats?.users?.writers || 0 }
  ];

  const writerColumns = [
    {
      title: 'Writer',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            style={{ 
              backgroundColor: '#1e3a8a', 
              marginRight: '12px',
              fontSize: '16px'
            }}
            size={40}
          >
            {text?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => (
        <Text style={{ fontSize: '14px', color: '#374151' }}>{email}</Text>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (record) => {
        if (record.writerProfile?.isPublished) {
          return <Badge status="success" text="Published" />;
        } else if (record.writerProfile?.isApproved) {
          return <Badge status="processing" text="Approved" />;
        } else {
          return <Badge status="warning" text="Pending" />;
        }
      }
    },
    {
      title: 'Total Earnings (₦)',
      key: 'earnings',
      render: (record) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
            ₦{(record.earnings?.total || 0).toFixed(2)}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.earnings?.payments || 0} payments
          </Text>
        </div>
      ),
      sorter: (a, b) => (a.earnings?.total || 0) - (b.earnings?.total || 0)
    },
    {
      title: 'Average Payment (₦)',
      key: 'avgPayment',
      render: (record) => (
        <div>
          <div>₦{(record.earnings?.average || 0).toFixed(2)}</div>
          {record.earnings?.lastPaymentDate && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last: {new Date(record.earnings.lastPaymentDate).toLocaleDateString()}
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => (a.earnings?.average || 0) - (b.earnings?.average || 0)
    },
    {
      title: 'Specialties',
      dataIndex: ['writerProfile', 'specialties'],
      key: 'specialties',
      render: (specialties) => (
        <Space size={[0, 8]} wrap>
          {(specialties || []).slice(0, 2).map((specialty, index) => (
            <Tag key={index} color="blue">{specialty}</Tag>
          ))}
          {specialties?.length > 2 && <Tag>+{specialties.length - 2} more</Tag>}
        </Space>
      )
    },
    {
      title: 'Rating',
      dataIndex: ['writerProfile', 'rating', 'average'],
      key: 'rating',
      render: (rating) => (
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          {(rating || 0).toFixed(1)}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          {!record.writerProfile?.isApproved && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleApproveWriter(record._id)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                border: 'none',
                fontWeight: '600'
              }}
            >
              Approve
            </Button>
          )}
          {record.writerProfile?.isApproved && !record.writerProfile?.isPublished && (
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handlePublishWriter(record._id)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                border: 'none',
                fontWeight: '600'
              }}
            >
              Publish
            </Button>
          )}
          {record.writerProfile?.isPublished && (
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />}
              onClick={() => handleUnpublishWriter(record._id)}
              style={{
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              Unpublish
            </Button>
          )}
        </Space>
      )
    }
  ];

  const agreementColumns = [
    {
      title: 'Project',
      dataIndex: ['projectDetails', 'title'],
      key: 'title',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary">{record.projectDetails?.subject}</Text>
        </div>
      )
    },
    {
      title: 'Student',
      dataIndex: ['student', 'name'],
      key: 'student'
    },
    {
      title: 'Writer',
      dataIndex: ['writer', 'name'],
      key: 'writer'
    },
    {
      title: 'Amount (₦)',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount) => `₦${amount?.toFixed(2) || '0.00'}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'gold',
          active: 'blue',
          completed: 'green',
          cancelled: 'red'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Progress percent={progress || 0} size="small" />
      )
    }
  ];

  const filteredWriters = writers.filter(writer => {
    const matchesSearch = writer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         writer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = writerFilter === 'all' ||
                         (writerFilter === 'pending' && !writer.writerProfile?.isApproved) ||
                         (writerFilter === 'approved' && writer.writerProfile?.isApproved && !writer.writerProfile?.isPublished) ||
                         (writerFilter === 'published' && writer.writerProfile?.isPublished);
    
    return matchesSearch && matchesFilter;
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(userSearchTerm.toLowerCase());
    
    const matchesFilter = userFilter === 'all' ||
                         (userFilter === 'students' && user.role === 'student') ||
                         (userFilter === 'writers' && user.role === 'writer') ||
                         (userFilter === 'admins' && user.role === 'admin');
    
    return matchesSearch && matchesFilter;
  });

  // Debug: Log filtered users
  console.log('👥 [Debug] Users state:', users);
  console.log('👥 [Debug] Filtered users:', filteredUsers);
  console.log('👥 [Debug] User filter:', userFilter);
  console.log('👥 [Debug] User search term:', userSearchTerm);

  // User columns definition
  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => {
        console.log('👤 [User Column] Rendering user:', record);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar 
              size={40} 
              icon={<UserOutlined />}
              style={{ 
                backgroundColor: record.role === 'admin' ? '#f50' : 
                                record.role === 'writer' ? '#1890ff' : '#52c41a'
              }}
            />
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{record.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag 
          color={
            role === 'admin' ? 'red' : 
            role === 'writer' ? 'blue' : 'green'
          }
          style={{ 
            borderRadius: '8px', 
            fontWeight: '600',
            textTransform: 'capitalize'
          }}
        >
          {role}
        </Tag>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag 
          color={record.isActive !== false ? 'green' : 'red'}
          style={{ borderRadius: '8px', fontWeight: '600' }}
        >
          {record.isActive !== false ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600' }}>
            {new Date(date).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {new Date(date).toLocaleTimeString()}
          </div>
        </div>
      )
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <PhoneOutlined style={{ color: '#1890ff' }} />
              {record.phone}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <MailOutlined style={{ color: '#52c41a' }} />
            {record.email}
          </div>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        console.log('🔧 [Actions Column] Rendering actions for user:', record);
        console.log('🔧 [Actions Column] Current user:', user);
        console.log('🔧 [Actions Column] Can delete?', record._id !== user?._id);
        
        return (
          <Space>
            <Tooltip title="View Details">
              <Button 
                type="primary" 
                icon={<EyeOutlined />}
                size="small"
                style={{ 
                  borderRadius: '8px',
                  backgroundColor: '#1890ff',
                  borderColor: '#1890ff',
                  minWidth: '32px',
                  height: '32px'
                }}
                onClick={(e) => {
                  console.log('👁️ [Button Click] View Details clicked for:', record);
                  e.stopPropagation();
                  handleViewUserDetails(record);
                }}
              >
                View
              </Button>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  // Debug: Log state values right before render
  console.log('🎯 [Debug] Current state values:');
  console.log('  stats:', stats);
  console.log('  stats.data:', stats?.data);
  console.log('  users.total:', stats?.data?.users?.total);
  console.log('  writers.total:', stats?.data?.writers?.total);
  console.log('  revenue.total:', stats?.data?.revenue?.total);
  console.log('  writers array:', writers);
  console.log('  writers.length:', writers?.length);

  // Debug current state
  console.log('🎯 [UI Debug] Rendering with stats:', {
    total: stats?.data?.users?.total,
    active: stats?.data?.agreements?.active,
    revenue: stats?.data?.revenue?.total,
    writers: stats?.data?.writers?.total
  });

  if (loading) {
    return (
      <>
        <NewHeader />
        <div style={{ 
          padding: '24px', 
          backgroundColor: '#f5f5f5', 
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <AppLoader 
            fullScreen={false}
            tip="Loading admin dashboard..."
            size="large"
            showIcon={true}
            showTip={true}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <NewHeader />
      <div style={modernStyles.container}>
        <div style={modernStyles.contentWrapper}>
          {/* Modern Header */}
          <Card style={modernStyles.headerCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <Title 
                  level={1} 
                  style={{ 
                    ...modernStyles.gradientText, 
                    marginBottom: '8px',
                    fontSize: 'clamp(28px, 6vw, 42px)',
                    fontWeight: '800'
                  }}
                >
                  <CrownOutlined style={{ marginRight: '16px' }} />
                  Admin Dashboard
                </Title>
                <Text style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: '#6b7280' }}>
                  Manage your platform with powerful insights and controls
                </Text>
              </div>
              <Space size="large" wrap>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={fetchDashboardData}
                  loading={loading}
                  size="large"
                  style={{
                    borderRadius: '12px',
                    height: 'clamp(40px, 8vw, 48px)',
                    paddingInline: 'clamp(16px, 4vw, 24px)',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(30, 58, 138, 0.4)',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}
                >
                  <span style={{ display: window.innerWidth < 576 ? 'none' : 'inline' }}>Refresh Data</span>
                  <span style={{ display: window.innerWidth < 576 ? 'inline' : 'none' }}>Refresh</span>
                </Button>
                <Button 
                  icon={<MonitorOutlined />}
                  onClick={handleDebugPayments}
                  size="large"
                  style={{
                    borderRadius: '12px',
                    height: 'clamp(40px, 8vw, 48px)',
                    paddingInline: 'clamp(16px, 4vw, 24px)',
                    fontSize: 'clamp(12px, 2.5vw, 14px)'
                  }}
                >
                  <span style={{ display: window.innerWidth < 576 ? 'none' : 'inline' }}>System Debug</span>
                  <span style={{ display: window.innerWidth < 576 ? 'inline' : 'none' }}>Debug</span>
                </Button>
              </Space>
            </div>
          </Card>

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            className="professional-tabs"
            style={{
              marginTop: '24px'
            }}
          >
            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <BarChartOutlined style={{ marginRight: '8px' }} />
                  Analytics Overview
                </span>
              } 
              key="overview"
            >
              {/* Modern Statistics Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                            <Col xs={24} sm={12} lg={6}>
              <Card 
                style={{
                  ...modernStyles.statsCard,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color: 'white'
                }}
                hoverable
              >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: '0' }}>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                          Total Users
                        </div>
                        <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: 'white' }}>
                          {stats?.users?.total || 0}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                          <RiseOutlined /> +12% from last month
                        </div>
                      </div>
                      <Avatar 
                        size={{ xs: 40, sm: 48, md: 56 }}
                        icon={<UserOutlined />} 
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontSize: 'clamp(16px, 3vw, 24px)',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card 
                    style={{
                      ...modernStyles.statsCard,
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white'
                    }}
                    hoverable
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: '0' }}>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                          Active Projects
                        </div>
                        <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: 'white' }}>
                          {stats?.agreements?.active || 0}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                          {stats?.agreements?.total || 0} total projects
                        </div>
                      </div>
                      <Avatar 
                        size={{ xs: 40, sm: 48, md: 56 }}
                        icon={<BookOutlined />} 
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontSize: 'clamp(16px, 3vw, 24px)',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card 
                    style={{
                      ...modernStyles.statsCard,
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      color: 'white'
                    }}
                    hoverable
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: '0' }}>
                          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                          Platform Revenue (₦)
                        </div>
                        <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '700', color: 'white' }}>
                          ₦{Math.abs(stats?.revenue?.platformRevenue || 0).toFixed(0)}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                          Writers earned ₦{Math.abs(stats?.revenue?.writerEarnings || 0).toFixed(0)}
                        </div>
                      </div>
                      <Avatar 
                        size={{ xs: 40, sm: 48, md: 56 }}
                        icon={<DollarOutlined />} 
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          fontSize: 'clamp(16px, 3vw, 24px)',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card 
                    style={{
                      ...modernStyles.statsCard,
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      color: '#2c3e50'
                    }}
                    hoverable
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1, minWidth: '0' }}>
                        <div style={{ color: 'rgba(44,62,80,0.7)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                          Expert Writers
                        </div>
                        <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: '#2c3e50' }}>
                          {stats?.writers?.total || 0}
                        </div>
                        <div style={{ color: 'rgba(44,62,80,0.6)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                          {stats?.writers?.published || 0} published
                        </div>
                      </div>
                      <Avatar 
                        size={{ xs: 40, sm: 48, md: 56 }}
                        icon={<TeamOutlined />} 
                        style={{ 
                          backgroundColor: 'rgba(44,62,80,0.1)', 
                          color: '#2c3e50',
                          fontSize: 'clamp(16px, 3vw, 24px)',
                          flexShrink: 0
                        }} 
                      />
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Modern Charts Section */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <LineChartOutlined style={{ color: '#1e3a8a', fontSize: 'clamp(16px, 3vw, 18px)' }} />
                        <span style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600' }}>Revenue Analytics</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                    extra={
                      <Tag color="success" style={{ borderRadius: '12px', padding: '4px 8px', fontSize: 'clamp(10px, 2vw, 12px)' }}>
                        <ThunderboltOutlined /> Live Data
                      </Tag>
                    }
                  >
                    <div style={{ height: 'clamp(250px, 40vw, 300px)', overflow: 'hidden' }}>
                      <RevenueChart 
                        data={stats?.revenue?.monthlyBreakdown || []} 
                        stats={stats}
                      />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <PieChartOutlined style={{ color: '#4facfe', fontSize: 'clamp(16px, 3vw, 18px)' }} />
                        <span style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600' }}>User Distribution</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                  >
                    <div style={{ height: 'clamp(250px, 40vw, 300px)', overflow: 'hidden' }}>
                      <UserGrowthChart stats={stats} />
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Enhanced Performance Metrics */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} lg={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <BarChartOutlined style={{ color: '#fa709a', fontSize: 'clamp(16px, 3vw, 18px)' }} />
                        <span style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600' }}>Project Analytics</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                  >
                    <div style={{ height: 'clamp(250px, 40vw, 300px)', overflow: 'hidden' }}>
                      <ProjectAnalyticsChart stats={stats} />
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <TrophyOutlined style={{ color: '#1e40af', fontSize: 'clamp(16px, 3vw, 18px)' }} />
                        <span style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600' }}>Performance Metrics</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                  >
                    <Row gutter={[8, 8]}>
                      <Col xs={12} sm={12}>
                        <div style={{ textAlign: 'center', padding: 'clamp(12px, 3vw, 20px)' }}>
                          <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '700', color: '#52c41a', marginBottom: '8px' }}>
                            ₦{stats?.revenue?.transactions > 0 ? (Math.abs(stats?.revenue?.platformRevenue || 0) / stats.revenue.transactions).toFixed(2) : '0.00'}
                          </div>
                          <div style={{ color: '#8c8c8c', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Revenue per Transaction (₦)</div>
                        </div>
                      </Col>
                      <Col xs={12} sm={12}>
                        <div style={{ textAlign: 'center', padding: 'clamp(12px, 3vw, 20px)' }}>
                          <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '700', color: '#1890ff', marginBottom: '8px' }}>
                            ₦{stats?.writers?.total > 0 ? (Math.abs(stats?.revenue?.writerEarnings || 0) / stats.writers.total).toFixed(2) : '0.00'}
                          </div>
                          <div style={{ color: '#8c8c8c', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Avg Writer Earnings (₦)</div>
                        </div>
                      </Col>
                      <Col xs={12} sm={12}>
                        <div style={{ textAlign: 'center', padding: 'clamp(12px, 3vw, 20px)' }}>
                          <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '700', color: '#fa8c16', marginBottom: '8px' }}>
                            {stats?.revenue?.grossRevenue > 0 ? ((Math.abs(stats?.revenue?.platformRevenue || 0) / Math.abs(stats?.revenue?.grossRevenue || 1)) * 100).toFixed(1) : '0.0'}%
                          </div>
                          <div style={{ color: '#8c8c8c', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Platform Fee Rate</div>
                        </div>
                      </Col>
                      <Col xs={12} sm={12}>
                        <div style={{ textAlign: 'center', padding: 'clamp(12px, 3vw, 20px)' }}>
                          <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '700', color: '#1e40af', marginBottom: '8px' }}>
                            {stats?.agreements?.total > 0 ? ((stats.agreements.completed / stats.agreements.total) * 100).toFixed(1) : '0.0'}%
                          </div>
                          <div style={{ color: '#8c8c8c', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Success Rate</div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Modern Recent Activity */}
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <UserOutlined style={{ color: '#52c41a', fontSize: 'clamp(16px, 3vw, 18px)' }} />
                        <span style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600' }}>Recent Users</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                    size="small"
                  >
                    <div style={{ maxHeight: 'clamp(250px, 50vw, 300px)', overflowY: 'auto' }}>
                      {stats?.recentActivity?.users?.slice(0, 5).map(user => (
                        <div key={user._id} style={{ 
                          padding: 'clamp(12px, 3vw, 16px) 0', 
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '0' }}>
                            <Avatar 
                              style={{ 
                                backgroundColor: '#1e3a8a', 
                                marginRight: '12px',
                                flexShrink: 0
                              }}
                              size={{ xs: 32, sm: 40 }}
                            >
                              {user.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <div style={{ minWidth: '0', flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: 'clamp(14px, 2.5vw, 15px)' }}>{user.name}</div>
                              <Text type="secondary" style={{ fontSize: 'clamp(11px, 2vw, 12px)' }}>
                                {user.role} • {new Date(user.createdAt).toLocaleDateString()}
                              </Text>
                            </div>
                          </div>
                          <Tag color={user.role === 'student' ? 'blue' : user.role === 'writer' ? 'blue' : 'gold'} style={{ flexShrink: 0 }}>
                            {user.role}
                          </Tag>
                        </div>
                      ))}
                      {(!stats?.recentActivity?.users || stats.recentActivity.users.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                          <UserOutlined style={{ fontSize: 'clamp(32px, 8vw, 48px)', marginBottom: '16px' }} />
                          <div>No recent users</div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <BookOutlined style={{ color: '#1890ff', fontSize: 'clamp(16px, 3vw, 18px)' }} />
                        <span style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: '600' }}>Recent Projects</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                    size="small"
                  >
                    <div style={{ maxHeight: 'clamp(250px, 50vw, 300px)', overflowY: 'auto' }}>
                      {stats?.recentActivity?.agreements?.slice(0, 5).map(agreement => (
                        <div key={agreement._id} style={{ 
                          padding: 'clamp(12px, 3vw, 16px) 0', 
                          borderBottom: '1px solid #f0f0f0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ flex: 1, minWidth: '0' }}>
                              <div style={{ fontWeight: '600', fontSize: 'clamp(14px, 2.5vw, 15px)', marginBottom: '4px' }}>
                                {agreement.projectDetails?.title || 'Project Agreement'}
                              </div>
                              <div style={{ fontSize: 'clamp(13px, 2.5vw, 14px)', color: '#52c41a', fontWeight: '600', marginBottom: '4px' }}>
                                ₦{agreement.totalAmount || agreement.paidAmount || 0}
                              </div>
                              <div style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: '#8c8c8c' }}>
                                Student: {agreement.student?.name || 'Unknown'} | Writer: {agreement.writer?.name || 'Unknown'}
                              </div>
                            </div>
                            <Tag color={
                              agreement.status === 'completed' ? 'success' :
                              agreement.status === 'active' ? 'processing' :
                              agreement.status === 'pending' ? 'warning' : 'default'
                            } style={{ flexShrink: 0 }}>
                              {agreement.status}
                            </Tag>
                          </div>
                        </div>
                      ))}
                      {(!stats?.recentActivity?.agreements || stats.recentActivity.agreements.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                          <BookOutlined style={{ fontSize: 'clamp(32px, 8vw, 48px)', marginBottom: '16px' }} />
                          <div>No recent projects</div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <BankOutlined style={{ marginRight: '8px' }} />
                  Writer Payouts
                </span>
              } 
              key="payouts"
            >
              <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DollarOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
                        <span style={{ fontSize: '20px', fontWeight: '700' }}>Monthly Writer Earnings (₦) - Easy Payout Management</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                    extra={<Tag color="success">💰 Earnings Hub</Tag>}
                  >
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                      <Col span={6}>
                        <Card size="small" style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)', border: '1px solid #b7eb8f', borderRadius: '12px' }}>
                          <Statistic
                            title="Total Writer Earnings (₦)"
                            value={Math.abs(stats?.revenue?.writerEarnings || 0)}
                            prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                            precision={2}
                            valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: '700' }}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small" style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%)', border: '1px solid #adc6ff', borderRadius: '12px' }}>
                          <Statistic
                            title="Active Writers"
                            value={writers?.filter(w => w.earnings?.total > 0).length || 0}
                            prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: '700' }}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small" style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)', border: '1px solid #ffd591', borderRadius: '12px' }}>
                          <Statistic
                            title="Avg Earnings/Writer (₦)"
                            value={writers?.length > 0 ? (Math.abs(stats?.revenue?.writerEarnings || 0) / writers.filter(w => w.earnings?.total > 0).length || 1) : 0}
                            prefix={<TrophyOutlined style={{ color: '#fa8c16' }} />}
                            precision={2}
                            valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: '700' }}
                          />
                        </Card>
                      </Col>
                      <Col span={6}>
                        <Card size="small" style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', border: '1px solid #d3adf7', borderRadius: '12px' }}>
                          <Statistic
                            title="Total Payments"
                            value={stats?.revenue?.transactions || 0}
                                                  prefix={<CalendarOutlined style={{ color: '#1e40af' }} />}
                      valueStyle={{ color: '#1e40af', fontSize: '24px', fontWeight: '700' }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Table
                      title={() => (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          fontWeight: '700', 
                          fontSize: '18px',
                          color: '#2c3e50'
                        }}>
                          <StarOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                          Writer Earnings Breakdown (₦)
                        </div>
                      )}
                      columns={[
                        {
                          title: 'Writer',
                          key: 'writer',
                          render: (record) => (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                style={{ 
                                  backgroundColor: '#1e3a8a', 
                                  marginRight: '12px',
                                  fontSize: '16px'
                                }}
                                size={40}
                              >
                                {record.name?.charAt(0)?.toUpperCase()}
                              </Avatar>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '15px' }}>{record.name}</div>
                                <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                              </div>
                            </div>
                          )
                        },
                        {
                          title: 'Total Earned (₦)',
                          key: 'totalEarned',
                          render: (record) => (
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: '#52c41a' }}>
                                ₦{Math.abs(record.earnings?.total || 0).toFixed(2)}
                              </div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {record.earnings?.payments || 0} payments
                              </Text>
                            </div>
                          ),
                          sorter: (a, b) => Math.abs(a.earnings?.total || 0) - Math.abs(b.earnings?.total || 0),
                          defaultSortOrder: 'descend'
                        },
                        {
                          title: 'Avg per Payment (₦)',
                          key: 'avgPayment',
                          render: (record) => (
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                ₦{Math.abs(record.earnings?.average || 0).toFixed(2)}
                              </div>
                            </div>
                          ),
                          sorter: (a, b) => Math.abs(a.earnings?.average || 0) - Math.abs(b.earnings?.average || 0)
                        },
                        {
                          title: 'Last Payment',
                          key: 'lastPayment',
                          render: (record) => (
                            <div style={{ textAlign: 'center' }}>
                              {record.earnings?.lastPaymentDate ? (
                                <div>
                                  <div style={{ fontWeight: '600' }}>{new Date(record.earnings.lastPaymentDate).toLocaleDateString()}</div>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {Math.floor((Date.now() - new Date(record.earnings.lastPaymentDate)) / (1000 * 60 * 60 * 24))} days ago
                                  </Text>
                                </div>
                              ) : (
                                <Text type="secondary">No payments yet</Text>
                              )}
                            </div>
                          )
                        },
                        {
                          title: 'Status',
                          key: 'status',
                          render: (record) => {
                            const earnings = Math.abs(record.earnings?.total || 0);
                            if (earnings >= 100) {
                              return <Badge status="success" text="Ready for Payout" style={{ fontWeight: '600' }} />;
                            } else if (earnings >= 50) {
                              return <Badge status="processing" text="Earning Well" style={{ fontWeight: '600' }} />;
                            } else if (earnings > 0) {
                              return <Badge status="warning" text="Low Earnings" style={{ fontWeight: '600' }} />;
                            } else {
                              return <Badge status="default" text="No Earnings" style={{ fontWeight: '600' }} />;
                            }
                          }
                        },
                        {
                          title: 'Payout Action',
                          key: 'action',
                          render: (record) => {
                            const earnings = Math.abs(record.earnings?.total || 0);
                            return (
                              <Space>
                                {earnings > 0 && (
                                  <Button 
                                    type="primary" 
                                    size="small"
                                    style={{ 
                                      background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', 
                                      borderColor: '#52c41a',
                                      borderRadius: '8px',
                                      fontWeight: '600'
                                    }}
                                    onClick={() => {
                                      notification.success({
                                        message: 'Payout Initiated',
                                        description: `Processing ₦${earnings.toFixed(2)} payout for ${record.name}`
                                      });
                                    }}
                                  >
                                    💰 Pay ₦{earnings.toFixed(2)}
                                  </Button>
                                )}
                                <Button 
                                  size="small"
                                  style={{ borderRadius: '8px' }}
                                  onClick={() => {
                                    notification.info({
                                      message: 'Payment History',
                                      description: `Showing payment details for ${record.name}`
                                    });
                                  }}
                                >
                                  📊 Details
                                </Button>
                              </Space>
                            );
                          }
                        }
                      ]}
                      dataSource={writers?.filter(writer => writer.earnings?.total > 0) || []}
                      loading={loading}
                      rowKey="_id"
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Total ${total} earning writers`
                      }}
                      style={{
                        '.ant-table-thead > tr > th': {
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                          fontWeight: '600'
                        }
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <TeamOutlined style={{ marginRight: '8px' }} />
                  Writer Management
                </span>
              } 
              key="writers"
            >
              <Card style={modernStyles.chartCard}>
                <div style={{ 
                  marginBottom: '24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <Space size="large">
                    <Input
                      placeholder="Search writers..."
                      prefix={<SearchOutlined />}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ 
                        width: 320,
                        borderRadius: '12px',
                        height: '40px'
                      }}
                      size="large"
                    />
                    <Select
                      value={writerFilter}
                      onChange={setWriterFilter}
                      style={{ 
                        width: 180,
                        borderRadius: '12px'
                      }}
                      size="large"
                    >
                      <Option value="all">All Writers</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="published">Published</Option>
                    </Select>
                  </Space>
                  <Space>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleExportWritersCSV}
                      size="large"
                      style={{
                        borderRadius: '12px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: '600'
                      }}
                    >
                      Export CSV
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={fetchDashboardData}
                      loading={loading}
                      size="large"
                      style={{
                        borderRadius: '12px',
                        height: '40px'
                      }}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>

                {/* Writer Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Total Writers"
                        value={stats?.writers?.total || 0}
                        valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: '700' }}
                        prefix={<TeamOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Pending Approval"
                        value={stats?.writers?.pending || 0}
                        valueStyle={{ color: '#faad14', fontSize: '20px', fontWeight: '700' }}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Approved"
                        value={stats?.writers?.approved || 0}
                        valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: '700' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Published"
                        value={stats?.writers?.published || 0}
                        valueStyle={{ color: '#1e40af', fontSize: '20px', fontWeight: '700' }}
                        prefix={<CrownOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Table
                  columns={writerColumns}
                  dataSource={filteredWriters}
                  loading={loading}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} writers`
                  }}
                  style={{
                    borderRadius: '12px'
                  }}
                />
              </Card>
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <BookOutlined style={{ marginRight: '8px' }} />
                  Project Management
                </span>
              } 
              key="projects"
            >
              <Card 
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <BookOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                    <span style={{ fontSize: '20px', fontWeight: '700' }}>All Service Agreements</span>
                  </div>
                }
                style={modernStyles.chartCard}
              >
                <Table
                  columns={agreementColumns}
                  dataSource={agreements}
                  loading={loading}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} agreements`
                  }}
                  style={{
                    borderRadius: '12px'
                  }}
                />
              </Card>
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <UserOutlined style={{ marginRight: '8px' }} />
                  Users Management
                </span>
              } 
              key="users"
            >
              <Card style={modernStyles.chartCard}>
                <div style={{ 
                  marginBottom: '24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <Space size="large">
                    <Input
                      placeholder="Search users..."
                      prefix={<SearchOutlined />}
                      value={userSearchTerm}
                      onChange={e => setUserSearchTerm(e.target.value)}
                      style={{ 
                        width: 320,
                        borderRadius: '12px',
                        height: '40px'
                      }}
                      size="large"
                    />
                    <Select
                      value={userFilter}
                      onChange={setUserFilter}
                      style={{ 
                        width: 180,
                        borderRadius: '12px'
                      }}
                      size="large"
                    >
                      <Option value="all">All Users</Option>
                      <Option value="students">Students</Option>
                      <Option value="writers">Writers</Option>
                      <Option value="admins">Admins</Option>
                    </Select>
                  </Space>
                  <Space>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleExportStudentsCSV}
                      size="large"
                      style={{
                        borderRadius: '12px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                        border: 'none',
                        color: 'white',
                        fontWeight: '600'
                      }}
                    >
                      Export Students CSV
                    </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={fetchUsers}
                    loading={loading}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      height: '40px'
                    }}
                  >
                    Refresh
                  </Button>
                  </Space>
                </div>

                {/* Test Buttons */}
                <div style={{ marginBottom: '16px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                  <Text strong>Test Buttons (Debug):</Text>
                  <Space style={{ marginLeft: '16px' }}>
                    <Button 
                      type="primary" 
                      onClick={() => {
                        console.log('🧪 [Test] Test button clicked');
                        notification.info({
                          message: 'Test Button',
                          description: 'Test button is working!',
                          duration: 2
                        });
                      }}
                    >
                      Test Notification
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('🧪 [Test] Test modal button clicked');
                        console.log('🧪 [Test] About to call Modal.info...');
                        const modalInstance = Modal.info({
                          title: 'Test Modal',
                          content: 'This is a test modal to verify Modal.info is working.',
                          style: { zIndex: 9999 },
                          maskStyle: { zIndex: 9998 }
                        });
                        console.log('🧪 [Test] Modal.info returned:', modalInstance);
                      }}
                    >
                      Test Modal
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('🧪 [Test] Test user data:', users);
                        console.log('🧪 [Test] Test filtered users:', filteredUsers);
                        notification.info({
                          message: 'User Data',
                          description: `Found ${users.length} total users, ${filteredUsers.length} filtered`,
                          duration: 3
                        });
                      }}
                    >
                      Check User Data
                    </Button>
                    <Button 
                      onClick={testFunction}
                    >
                      Test Function
                    </Button>
                  </Space>
                </div>

                {/* User Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Total Users"
                        value={stats?.users?.total || 0}
                        valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: '700' }}
                        prefix={<UserOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Students"
                        value={stats?.users?.students || 0}
                        valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: '700' }}
                        prefix={<UserOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Writers"
                        value={stats?.users?.writers || 0}
                        valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: '700' }}
                        prefix={<TeamOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Admins"
                        value={stats?.users?.admins || 0}
                        valueStyle={{ color: '#f50', fontSize: '20px', fontWeight: '700' }}
                        prefix={<CrownOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Debug Info */}
                <div style={{ marginBottom: '16px', padding: '16px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                  <Text strong>Debug Info:</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>Total Users: {users.length}</Text><br/>
                    <Text>Filtered Users: {filteredUsers.length}</Text><br/>
                    <Text>Loading: {loading ? 'Yes' : 'No'}</Text><br/>
                    <Text>User Filter: {userFilter}</Text><br/>
                    <Text>Search Term: "{userSearchTerm}"</Text>
                  </div>
                  {filteredUsers.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <Text strong>First User Data:</Text>
                      <pre style={{ fontSize: '12px', background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                        {JSON.stringify(filteredUsers[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <Table
                  columns={userColumns}
                  dataSource={filteredUsers}
                  loading={loading}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} users`
                  }}
                  style={{
                    borderRadius: '12px'
                  }}
                />
              </Card>
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <LinkOutlined style={{ marginRight: '8px' }} />
                  Influencer Management
                </span>
              } 
              key="influencers"
            >
              <Card style={modernStyles.chartCard}>
                <div style={{ 
                  marginBottom: '24px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <Space size="large">
                    <Input
                      placeholder="Search influencers..."
                      prefix={<SearchOutlined />}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{ 
                        width: 320,
                        borderRadius: '12px',
                        height: '40px'
                      }}
                      size="large"
                    />
                    <Select
                      value={writerFilter}
                      onChange={setWriterFilter}
                      style={{ 
                        width: 180,
                        borderRadius: '12px'
                      }}
                      size="large"
                    >
                      <Option value="all">All Influencers</Option>
                      <Option value="pending">Pending Approval</Option>
                      <Option value="approved">Approved</Option>
                      <Option value="published">Published</Option>
                    </Select>
                  </Space>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={fetchDashboardData}
                    loading={loading}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      height: '40px'
                    }}
                  >
                    Refresh
                  </Button>
                </div>

                {/* Influencer Stats */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Total Influencers"
                        value={stats?.influencers?.total || 0}
                        valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: '700' }}
                        prefix={<TeamOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Pending Approval"
                        value={stats?.influencers?.pending || 0}
                        valueStyle={{ color: '#faad14', fontSize: '20px', fontWeight: '700' }}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Approved"
                        value={stats?.influencers?.approved || 0}
                        valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: '700' }}
                        prefix={<CheckCircleOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" style={{ borderRadius: '12px', textAlign: 'center' }}>
                      <Statistic
                        title="Published"
                        value={stats?.influencers?.published || 0}
                        valueStyle={{ color: '#1e40af', fontSize: '20px', fontWeight: '700' }}
                        prefix={<CrownOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Table
                  columns={writerColumns} // Reusing writerColumns for influencers
                  dataSource={filteredWriters} // Reusing filteredWriters for influencers
                  loading={loading}
                  rowKey="_id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `Total ${total} influencers`
                  }}
                  style={{
                    borderRadius: '12px'
                  }}
                />
              </Card>
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <DownloadOutlined style={{ marginRight: '8px' }} />
                  Export Chats
                </span>
              } 
              key="export"
            >
              <ExportChats />
            </TabPane>

            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <SafetyCertificateOutlined style={{ marginRight: '8px' }} />
                  System Health
                </span>
              } 
              key="system"
            >
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Alert
                    message="System Status"
                    description="All systems are operational. Regular monitoring is in place."
                    type="success"
                    showIcon
                    style={{ 
                      marginBottom: '24px',
                      borderRadius: '12px',
                      fontSize: '16px'
                    }}
                  />
                </Col>
                
                <Col xs={24} md={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BankOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
                        <span style={{ fontSize: '18px', fontWeight: '600' }}>Payment System</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <Button 
                        type="primary"
                        icon={<WarningOutlined />}
                        onClick={handleFixPayments}
                        block
                        size="large"
                        style={{
                          borderRadius: '12px',
                          height: '48px',
                          background: 'linear-gradient(135deg, #fa541c 0%, #ff7a45 100%)',
                          border: 'none',
                          fontWeight: '600'
                        }}
                      >
                        Fix Payment Calculations
                      </Button>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        This will recalculate payment amounts and fix any processing status issues.
                      </Text>
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <MonitorOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                        <span style={{ fontSize: '18px', fontWeight: '600' }}>Database Health</span>
                      </div>
                    }
                    style={modernStyles.chartCard}
                  >
                    <Descriptions column={1} size="middle">
                      <Descriptions.Item 
                        label={<span style={{ fontWeight: '600' }}>Total Users</span>}
                      >
                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px' }}>
                          {stats?.data?.users?.total || 0}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={<span style={{ fontWeight: '600' }}>Total Agreements</span>}
                      >
                        <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px' }}>
                          {stats?.data?.agreements?.total || 0}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item 
                        label={<span style={{ fontWeight: '600' }}>Total Transactions</span>}
                      >
                        <Tag color="green" style={{ fontSize: '14px', padding: '4px 12px', borderRadius: '8px' }}>
                          {stats?.data?.revenue?.transactions || 0}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </TabPane>
          </Tabs>
          {/* Jobs Tracking Tab */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            className="professional-tabs"
            style={{ marginTop: 24 }}
          >
            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  <BookOutlined style={{ marginRight: '8px' }} />
                  Job Tracking
                </span>
              } 
              key="jobs"
            >
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="Search title, subject, tag"
                    prefix={<SearchOutlined />}
                    value={jobFilters.search}
                    onChange={(e) => {
                      const v = e.target.value;
                      setJobFilters(prev => ({ ...prev, search: v }));
                    }}
                    onPressEnter={() => fetchJobs()}
                  />
                </Col>
                <Col xs={12} sm={8}>
                  <Select
                    value={jobFilters.status}
                    onChange={(v) => { setJobFilters(prev => ({ ...prev, status: v })); fetchJobs({ status: v }); }}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Statuses</Option>
                    <Option value="open">Open</Option>
                    <Option value="in-progress">In Progress</Option>
                    <Option value="completed">Completed</Option>
                    <Option value="cancelled">Cancelled</Option>
                  </Select>
                </Col>
                <Col xs={12} sm={8}>
                  <Select
                    value={jobFilters.assigned}
                    onChange={(v) => { setJobFilters(prev => ({ ...prev, assigned: v })); fetchJobs({ assigned: v }); }}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Assignment</Option>
                    <Option value="true">Assigned</Option>
                    <Option value="false">Unassigned</Option>
                  </Select>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Total Jobs" value={jobSummary.total || 0} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Open" value={jobSummary.open || 0} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="In Progress" value={jobSummary.inProgress || 0} /></Card></Col>
                <Col xs={24} sm={12} md={6}><Card><Statistic title="Completed" value={jobSummary.completed || 0} /></Card></Col>
              </Row>

              <Table
                rowKey="_id"
                dataSource={jobs}
                columns={[
                  {
                    title: 'Title',
                    dataIndex: 'title',
                    key: 'title',
                    render: (text, record) => (
                      <div>
                        <div style={{ fontWeight: 600 }}>{text}</div>
                        <Text type="secondary">{record.subject}</Text>
                      </div>
                    )
                  },
                  {
                    title: 'Poster',
                    key: 'postedBy',
                    render: (_, r) => r.postedBy?.name || '—'
                  },
                  {
                    title: 'Assigned To',
                    key: 'assignedTo',
                    render: (_, r) => r.assignedTo?.name ? (
                      <Space><Badge status="processing" /><span>{r.assignedTo?.name}</span></Space>
                    ) : <Tag>Unassigned</Tag>
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                      const color = status === 'open' ? 'blue' : status === 'in-progress' ? 'gold' : status === 'completed' ? 'green' : 'red';
                      return <Tag color={color} style={{ textTransform: 'capitalize' }}>{status}</Tag>;
                    }
                  },
                  {
                    title: 'Applications',
                    key: 'applications',
                    render: (r) => r.applications?.length || 0
                  },
                  {
                    title: 'Views',
                    key: 'views',
                    render: (r) => r.metrics?.totalViews || 0
                  },
                  {
                    title: 'Budget',
                    key: 'budget',
                    render: (r) => `₦${(r.budget?.amount || 0).toLocaleString()}`
                  },
                  {
                    title: 'Deadline',
                    dataIndex: 'deadline',
                    key: 'deadline',
                    render: (d) => d ? new Date(d).toLocaleDateString() : '—'
                  },
                  {
                    title: 'Created',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (d) => new Date(d).toLocaleDateString()
                  }
                ]}
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
          </Tabs>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        visible={modalVisible}
        onClose={handleCloseModal}
        user={selectedUser}
        onDelete={handleDeleteUserFromModal}
        isCurrentUser={selectedUser?._id === user?._id}
      />
    </>
  );
};

export default AdminDashboard; 