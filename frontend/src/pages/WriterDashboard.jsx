import React, { useEffect, useState, useCallback } from 'react';
import {
  Layout, 
  Card, 
  Table, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  Spin, 
  Badge, 
  Space, 
  notification, 
  Empty, 
  Typography, 
  Collapse, 
  Button, 
  Progress,
  Avatar,
  Tooltip,
  Timeline,
  Alert,
  Divider,
  Modal
} from 'antd';
import {
  DollarOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  MessageOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  StarOutlined,
  BankOutlined,
  PlusCircleOutlined,
  ReloadOutlined,
  BookOutlined,
  TeamOutlined,
  RiseOutlined,
  WalletOutlined,
  ProjectOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { agreementApi } from '../api/agreement';
import { paymentApi } from '../api/payment';
import { fetchWriterDashboardData, completeAssignment } from '../api/writerDashboard';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderComponent from '../components/HeaderComponent';
import ReviewAgreementModal from '../components/ReviewAgreementModal';
import CompleteAssignmentModal from '../components/CompleteAssignmentModal';
import AppLoader from '../components/AppLoader';
import MobileBottomTabs from '../components/MobileBottomTabs';
// Enhanced location and currency components
import { useCurrency } from '../hooks/useCurrency';
import moment from 'moment';
import './WriterDashboard.css';
import '../components/DashboardMobile.css';

const { Content } = Layout;
const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;

const WriterDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { convertPrice, formatCurrency, getCurrencySymbol, location: userLocation, loading: currencyLoading } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [pendingAgreements, setPendingAgreements] = useState([]);
  const [activeAgreements, setActiveAgreements] = useState([]);
  const [completedAgreements, setCompletedAgreements] = useState([]);
  const [agreementBadgeCount, setAgreementBadgeCount] = useState(0);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Modal states for completion
  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [completing, setCompleting] = useState(false);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    availableBalance: 0,
    pendingAmount: 0,
    completedCount: 0,
    activeCount: 0,
    pendingCount: 0,
    rating: 0,
    responseRate: 100
  });

  // Helper function for enhanced currency detection
  const getAgreementCurrency = (agreement) => {
    if (!agreement.paymentPreferences) return 'usd';
    
    const prefs = agreement.paymentPreferences;
    
    // If currency is explicitly set to NGN, use that
    if (prefs.currency === 'ngn') return 'ngn';
    
    // If it was created with Paystack (Nigerian gateway), likely NGN
    if (prefs.gateway === 'paystack') return 'ngn';
    
    // If nativeAmount exists and is different from totalAmount, and exchangeRate is 1, likely NGN
    if (prefs.nativeAmount && prefs.nativeAmount !== agreement.totalAmount && prefs.exchangeRate === 1) return 'ngn';
    
    // If nativeAmount is much larger than what would be normal USD (>5000), likely NGN
    if (prefs.nativeAmount && prefs.nativeAmount > 5000) return 'ngn';
    
    // Otherwise use the stated currency
    return prefs.currency || 'usd';
  };

  // Helper function to get agreement currency and convert for writer display
  const getWriterEarningsDisplay = (agreements) => {
    let totalEarningsUSD = 0;
    let availableBalanceUSD = 0;
    let pendingAmountUSD = 0;


    agreements.forEach((agreement, index) => {
      if (!agreement) return;

      // Detect original currency of the agreement
      const getAgreementCurrency = () => {
        if (!agreement.paymentPreferences) return 'usd';
        
        const prefs = agreement.paymentPreferences;
        
        // If currency is explicitly set to NGN, use that
        if (prefs.currency === 'ngn') return 'ngn';
        
        // If it was created with Paystack (Nigerian gateway), likely NGN
        if (prefs.gateway === 'paystack') return 'ngn';
        
        // If nativeAmount exists and is different from totalAmount, and exchangeRate is 1, likely NGN
        if (prefs.nativeAmount && prefs.nativeAmount !== agreement.totalAmount && prefs.exchangeRate === 1) return 'ngn';
        
        // If nativeAmount is much larger than what would be normal USD (>5000), likely NGN
        if (prefs.nativeAmount && prefs.nativeAmount > 5000) return 'ngn';
        
        // Otherwise use the stated currency
        return prefs.currency || 'usd';
      };

      const originalCurrency = getAgreementCurrency();
      const writerShareRate = 1.0; // 100% to writer - platform fee removed


      // For completed agreements, calculate earnings
      if (agreement.status === 'completed' && agreement.paidAmount > 0) {
        let writerEarnings = agreement.paidAmount * writerShareRate;
        
        
        // Convert to USD for display
        if (originalCurrency === 'ngn') {
          // NGN agreements: divide by 1500 to get USD equivalent
          writerEarnings = writerEarnings / 1500;
        }
        // USD agreements: keep as USD
        
        totalEarningsUSD += writerEarnings;
        availableBalanceUSD += writerEarnings; // Assume available for withdrawal
        
      }

      // For pending/active agreements, calculate pending amount
      if ((agreement.status === 'pending' || agreement.status === 'active') && agreement.totalAmount > 0) {
        const unpaidAmount = agreement.totalAmount - (agreement.paidAmount || 0);
        let pendingEarnings = unpaidAmount * writerShareRate;
        
        
        // Convert to USD for display
        if (originalCurrency === 'ngn') {
          // NGN agreements: divide by 1500 to get USD equivalent
          pendingEarnings = pendingEarnings / 1500;
        }
        // USD agreements: keep as USD
        
        pendingAmountUSD += pendingEarnings;
        
      }
    });


    return {
      totalEarnings: totalEarningsUSD,
      availableBalance: availableBalanceUSD,
      pendingAmount: pendingAmountUSD
    };
  };

  const fetchData = useCallback(async (showRefreshIndicator = false, forceAgreementsAPI = false) => {
    if (!isAuthenticated || !user?._id) return;
    
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      
      
      // Always use agreements API for proper currency calculation
      const agreementsData = await agreementApi.getAgreements();
      const agreements = Array.isArray(agreementsData) ? agreementsData : [];
      
      // Categorize agreements
      const pending = agreements.filter(a => a?.status === 'pending');
      const active = agreements.filter(a => a?.status === 'active');
      const completed = agreements.filter(a => a?.status === 'completed');
      
      
      // Sort completed agreements by most recent first
      const sortedCompleted = completed.sort((a, b) => 
        new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt)
      );
      
      setPendingAgreements(pending);
      setActiveAgreements(active);
      setCompletedAgreements(sortedCompleted);
      setAgreementBadgeCount(pending.length);
      
      // Calculate proper writer earnings using currency conversion logic
      const writerEarnings = getWriterEarningsDisplay(agreements);
      
      
      // Update stats with proper currency conversion
      setStats({
        totalEarnings: writerEarnings.totalEarnings,
        availableBalance: writerEarnings.availableBalance,
        pendingAmount: writerEarnings.pendingAmount,
        completedCount: completed.length,
        activeCount: active.length,
        pendingCount: pending.length,
        rating: 4.8, // Default rating
        responseRate: 98
      });
      
    } catch (error) {
      notification.error({
        message: 'Error Loading Dashboard',
        description: 'Unable to load dashboard data. Please try refreshing.',
        placement: 'bottomRight',
        duration: 6
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?._id]);

  // Initial data fetch when component mounts
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'writer') {
      navigate('/signin');
      return;
    }
    
    // Fetch data immediately - no more delays
    fetchData();
  }, [isAuthenticated, user?.role, navigate, fetchData]);

  // Handle refresh explicitly
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true, true); // Force fresh data from API
    setRefreshing(false);
  }, [fetchData]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user?._id) return;

    
    // Join writer room
    socket.emit('joinUserRoom', user._id);

    const handleNewAgreement = (data) => {
      
      // Add to pending agreements
      setPendingAgreements(prev => [data, ...prev]);
      setAgreementBadgeCount(prev => prev + 1);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingCount: prev.pendingCount + 1,
        pendingAmount: prev.pendingAmount + (data.totalAmount || 0)
      }));
      
      notification.success({
        message: 'New Project Available',
        description: `${data.projectDetails?.title || 'New project'} is available for review!`,
        placement: 'bottomRight',
        duration: 6
      });
    };

    const handleAgreementUpdated = (data) => {
      fetchData(true);
    };

    const handleAgreementCompletedByMe = (data) => {
      
      // Always force refresh from backend to ensure accuracy
      fetchData(true, true); // Force agreements API for fresh data
      
      // Show confirmation notification
      notification.success({
        message: 'Completion Confirmed!',
        description: `"${data.title}" has been successfully completed. Payment has been processed.`,
        placement: 'bottomRight',
        duration: 8
      });
    };

    const handlePaymentReceived = (data) => {
      
      // Update financial stats
      setStats(prev => ({
        ...prev,
        totalEarnings: prev.totalEarnings + (data.amount || 0),
        availableBalance: prev.availableBalance + (data.amount * 1.0 || 0) // Platform fee removed - writers get 100%
      }));
      
      notification.success({
        message: 'Payment Received',
        description: `You received $${data.amount?.toFixed(2)} for your work!`,
        placement: 'bottomRight',
        duration: 6
      });
      
      // Refresh data to ensure all stats are up to date
      fetchData(true);
    };

    // Set up socket listeners
    socket.on('newAgreement', handleNewAgreement);
    socket.on('agreementUpdated', handleAgreementUpdated);
    socket.on('agreementCompletedByMe', handleAgreementCompletedByMe);
    socket.on('paymentReceived', handlePaymentReceived);

    return () => {
      socket.off('newAgreement', handleNewAgreement);
      socket.off('agreementUpdated', handleAgreementUpdated);
      socket.off('agreementCompletedByMe', handleAgreementCompletedByMe);
      socket.off('paymentReceived', handlePaymentReceived);
    };
  }, [socket, user?._id, fetchData]);

  // Handle notification URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const showModal = params.get('modal');
    const agreementId = params.get('agreementId');
    
    if (showModal === 'review' && agreementId) {
      const agreement = pendingAgreements.find(a => a._id === agreementId);
      if (agreement) {
        setSelectedAgreement(agreement);
        setIsReviewModalVisible(true);
      }
    }
  }, [location.search, pendingAgreements]);

  const handleReviewAgreement = (agreement) => {
    setSelectedAgreement(agreement);
    setIsReviewModalVisible(true);
  };

  const handleAcceptAgreement = async (agreementId) => {
    setAccepting(true);
    
    try {
      const response = await agreementApi.acceptAgreement(agreementId);
      
      // Update local state immediately for better UX
      setPendingAgreements(prev => prev.filter(a => a._id !== agreementId));
      setAgreementBadgeCount(prev => Math.max(0, prev - 1));
      
      // Move to active agreements
      const acceptedAgreement = pendingAgreements.find(a => a._id === agreementId);
      if (acceptedAgreement) {
        setActiveAgreements(prev => [
          { ...acceptedAgreement, status: 'active' },
          ...prev
        ]);
      }
      
      notification.success({
        message: 'Agreement Accepted',
        description: 'You can now start working on this project!',
        placement: 'bottomRight',
        duration: 6
      });
      
      setIsReviewModalVisible(false);
      
      // Refresh data after a short delay
      setTimeout(() => fetchData(true), 1500);
      
    } catch (err) {
      notification.error({
        message: 'Failed to Accept Agreement',
        description: err.message || 'Please try again later.',
        placement: 'bottomRight',
        duration: 6
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleCancelAgreement = async (agreementId) => {
    try {
      setCancelling(true);
      setSelectedAgreement(prev => prev?._id === agreementId ? prev : null);
      
      
      const response = await agreementApi.cancelAgreement(agreementId);
      
      notification.success({
        message: 'Agreement Cancelled',
        description: 'The agreement has been cancelled successfully.',
        placement: 'topRight'
      });
      
      // Refresh data to reflect the cancellation
      await fetchData();
      
      // Close modal if open
      setIsReviewModalVisible(false);
      setSelectedAgreement(null);
      
    } catch (error) {
      notification.error({
        message: 'Cancellation Failed', 
        description: error.message || 'Failed to cancel agreement. Please try again.',
        placement: 'topRight'
      });
    } finally {
      setCancelling(false);
    }
  };

  // URGENT COMPANY FIX - Simple completion function
  const handleCompleteAssignment = async (agreementId) => {
    
    // Set the selected assignment and show modal
    setSelectedAssignmentId(agreementId);
    setIsCompleteModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsCompleteModalVisible(false);
    setSelectedAssignmentId(null);
    setCompleting(false);
  };

  const handleModalConfirm = async () => {
    if (!selectedAssignmentId) return;

    let loadingNotification;
    
    try {
      setCompleting(true);
      
      // Find the agreement to show details
      const agreement = activeAgreements.find(a => a._id === selectedAssignmentId);
      const projectTitle = agreement?.projectDetails?.title || 'this assignment';
      
      // Show elegant loading notification
      loadingNotification = notification.open({
        message: '🔄 Processing Completion',
        description: `Marking "${projectTitle}" as completed...`,
        duration: 0,
        placement: 'topRight',
        style: {
          background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f9ff 100%)',
          border: '1px solid #91d5ff',
          borderRadius: '12px'
        }
      });

      
      // Call API
      const response = await completeAssignment(selectedAssignmentId);
      
      
      // ✅ IMMEDIATE STATE UPDATE - Move agreement from active to completed
      const completedAgreement = activeAgreements.find(a => a._id === selectedAssignmentId);
      if (completedAgreement) {
        
        // Update the agreement status
        const updatedAgreement = {
          ...completedAgreement,
          status: 'completed',
          completedAt: new Date(),
          progress: 100
        };
        
        
        // Remove from active agreements
        setActiveAgreements(prev => {
          const filtered = prev.filter(a => a._id !== selectedAssignmentId);
          return filtered;
        });
        
        // Add to completed agreements
        setCompletedAgreements(prev => {
          const updated = [updatedAgreement, ...prev];
          return updated;
        });
        
        // Update stats immediately
        setStats(prev => ({
          ...prev,
          activeCount: prev.activeCount - 1,
          completedCount: prev.completedCount + 1
        }));
        
      } else {
      }
      
      // Close loading notification
      if (loadingNotification) {
        loadingNotification();
      }
      
      // Show beautiful success notification
      notification.success({
        message: '🎉 Assignment Completed Successfully!',
        description: (
          <div>
            <p style={{ margin: '8px 0 12px 0' }}>
              <strong>"{projectTitle}"</strong> has been marked as completed.
            </p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#389e0d' }}>
              <span>✓ Payment processed</span>
              <span>✓ Student notified</span>
              <span>✓ Dashboard updating</span>
            </div>
          </div>
        ),
        placement: 'topRight',
        duration: 6,
        style: {
          background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9e7 100%)',
          border: '1px solid #b7eb8f',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(82, 196, 26, 0.12)'
        }
      });
      
      // Close modal and reset state
      setIsCompleteModalVisible(false);
      setSelectedAssignmentId(null);
      setCompleting(false);
      
      // Refresh dashboard
      setTimeout(() => {
        fetchData(true);
      }, 1000);
      
    } catch (error) {
      
      // Close loading notification
      if (loadingNotification) {
        loadingNotification();
      }
      
      // Find the agreement to show details in error
      const agreement = activeAgreements.find(a => a._id === selectedAssignmentId);
      const projectTitle = agreement?.projectDetails?.title || 'this assignment';
      
      // Parse error message
      let errorMessage = 'Failed to complete assignment. Please try again.';
      let errorDetails = '';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        if (error.message.includes('not active')) {
          errorMessage = 'Assignment is not active';
          errorDetails = 'Only active assignments can be completed.';
        } else if (error.message.includes('not the assigned writer')) {
          errorMessage = 'Unauthorized';
          errorDetails = 'You are not the assigned writer for this project.';
        } else if (error.message.includes('not found')) {
          errorMessage = 'Assignment not found';
          errorDetails = 'This assignment may have been deleted or completed already.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Show elegant error notification
      notification.error({
        message: '❌ Completion Failed',
        description: (
          <div>
            <p style={{ margin: '8px 0', fontWeight: '500' }}>{errorMessage}</p>
            {errorDetails && (
              <p style={{ margin: 0, fontSize: '14px', color: '#8c8c8c' }}>{errorDetails}</p>
            )}
          </div>
        ),
        placement: 'topRight',
        duration: 8,
        style: {
          background: 'linear-gradient(135deg, #fff2f0 0%, #fff1f0 100%)',
          border: '1px solid #ffaaa5',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(255, 77, 79, 0.12)'
        }
      });
      
      setCompleting(false);
    }
  };

  // Location Info Display
  const LocationInfoDisplay = () => {

    if (currencyLoading) {
      return (
        <Card style={{ marginBottom: '16px' }}>
          <Spin size="small" /> Loading location information...
        </Card>
      );
    }

    return (
      <Card style={{ marginBottom: '16px', background: '#f6ffed', borderColor: '#b7eb8f' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Badge status="success" />
          </Col>
          <Col flex="auto">
            <Text strong>Location: </Text>
            <Text>{cityName}, {countryName}</Text>
            <Divider type="vertical" />
            <Text strong>Currency: </Text>
            <Text>{currency.toUpperCase()} ({symbol})</Text>
            {!isUSD && (
              <>
                <Divider type="vertical" />
                <Text strong>Exchange Rate: </Text>
                <Text>1 USD = {exchangeRate} {currency.toUpperCase()}</Text>
              </>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  // Modern Stats Cards matching StudentDashboard design
  const ModernStatsCards = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
      <Col xs={24} sm={12} lg={6}>
        <Card 
          style={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white'
          }}
          hoverable
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                Total Earnings
              </div>
              <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: 'white' }}>
                <Text style={{ color: 'white', fontSize: 'inherit', fontWeight: 'inherit' }}>
                  {formatCurrency(stats.totalEarnings, 'usd')}
                </Text>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                <RiseOutlined /> Lifetime earnings
              </div>
            </div>
            <Avatar 
              size={window.innerWidth < 768 ? 50 : 65}
              icon={<DollarOutlined />} 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: window.innerWidth < 768 ? '22px' : '29px'
              }}
            />
          </div>
        </Card>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <Card 
          style={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
            color: 'white'
          }}
          hoverable
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                Available Balance
              </div>
              <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: 'white' }}>
                <Text style={{ color: 'white', fontSize: 'inherit', fontWeight: 'inherit' }}>
                  {formatCurrency(stats.availableBalance, 'usd')}
                </Text>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                <WalletOutlined /> Ready to withdraw
              </div>
            </div>
            <Avatar 
              size={window.innerWidth < 768 ? 50 : 65}
              icon={<BankOutlined />} 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: window.innerWidth < 768 ? '22px' : '29px'
              }} 
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card 
          style={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: 'white'
          }}
          hoverable
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                Pending Earnings
              </div>
              <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: 'white' }}>
                <Text style={{ color: 'white', fontSize: 'inherit', fontWeight: 'inherit' }}>
                  {formatCurrency(stats.pendingAmount, 'usd')}
                </Text>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                <ClockCircleOutlined /> From active projects
              </div>
            </div>
            <Avatar 
              size={window.innerWidth < 768 ? 50 : 65}
              icon={<ClockCircleOutlined />} 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontSize: window.innerWidth < 768 ? '22px' : '29px'
              }} 
            />
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card 
          style={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            background: 'linear-gradient(135deg, #7c3aed 0%, #015382 100%)',
            color: 'white'
          }}
          hoverable
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(12px, 2.5vw, 14px)', marginBottom: '8px' }}>
                Completed Projects
              </div>
              <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '700', color: '#2c3e50' }}>
                {stats.completedCount}
              </div>
              <div style={{ color: 'rgba(44,62,80,0.6)', fontSize: 'clamp(10px, 2vw, 12px)', marginTop: '4px' }}>
                <CheckCircleOutlined /> Successfully delivered
              </div>
            </div>
            <Avatar 
              size={window.innerWidth < 768 ? 50 : 65}
              icon={<TrophyOutlined />} 
              style={{ 
                backgroundColor: 'rgba(44,62,80,0.1)', 
                color: '#2c3e50',
                fontSize: window.innerWidth < 768 ? '22px' : '29px'
              }} 
            />
          </div>
        </Card>
      </Col>
    </Row>
  );

  // Enhanced Project Details Table Columns
  const activeProjectsColumns = [
    {
      title: 'Project Information',
      dataIndex: ['projectDetails', 'title'],
      key: 'title',
      width: '30%',
      render: (title, record) => (
        <div className="project-info">
          <Title level={5} className="project-title">{title || 'Untitled Project'}</Title>
          <div className="project-meta">
            <Tag color="blue" className="project-id">ID: {record._id?.slice(-8)}</Tag>
            <Text type="secondary" className="project-subject">
              {record.projectDetails?.subject || 'General'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Student Details',
      dataIndex: 'student',
      key: 'student',
      width: '20%',
      render: (student) => (
        <div className="student-info">
          <div className="student-avatar-section">
            <Avatar 
              size={72} 
              icon={<UserOutlined />} 
              src={student?.avatar}
              className="student-avatar"
            />
            <div className="student-details">
              <Text strong className="student-name">{student?.name || 'Unknown'}</Text>
              <Text type="secondary" className="student-email">
                {student?.email || 'No email'}
              </Text>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Payment Progress',
      key: 'paymentProgress',
      width: '25%',
      render: (_, record) => {
        // Calculate payment progress based on installments
        let paidInstallments = 0;
        let totalInstallments = 0;
        let paidAmount = 0;
        let totalAmount = record.totalAmount || 0;
        
        if (record.installments && record.installments.length > 0) {
          totalInstallments = record.installments.length;
          paidInstallments = record.installments.filter(inst => 
            inst.status === 'paid' || inst.status === 'processing'
          ).length;
          
          // Calculate actual paid amount from installments
          paidAmount = record.installments.reduce((sum, inst) => {
            return sum + (inst.status === 'paid' || inst.status === 'processing' ? inst.amount : 0);
          }, 0);
        } else {
          paidAmount = record.paidAmount || 0;
        }
        
        const unpaidAmount = totalAmount - paidAmount;
        const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
        
        // Enhanced currency detection logic for writers - same as StudentDashboard
        const getAgreementCurrency = () => {
          if (!record.paymentPreferences) return 'usd';
          
          const prefs = record.paymentPreferences;
          
          // If currency is explicitly set to NGN, use that
          if (prefs.currency === 'ngn') return 'ngn';
          
          // If it was created with Paystack (Nigerian gateway), likely NGN
          if (prefs.gateway === 'paystack') return 'ngn';
          
          // If nativeAmount exists and is different from totalAmount, and exchangeRate is 1, likely NGN
          if (prefs.nativeAmount && prefs.nativeAmount !== totalAmount && prefs.exchangeRate === 1) return 'ngn';
          
          // If nativeAmount is much larger than what would be normal USD (>5000), likely NGN
          if (prefs.nativeAmount && prefs.nativeAmount > 5000) return 'ngn';
          
          // Otherwise use the stated currency
          return prefs.currency || 'usd';
        };

        const detectedCurrency = getAgreementCurrency();
        
        
        return (
          <div className="payment-progress">
            <div className="payment-amounts">
              <Text strong className="paid-amount">
                {formatCurrency(paidAmount, detectedCurrency)} paid
              </Text>
              <Text type="secondary" className="total-amount">
                of {formatCurrency(totalAmount, detectedCurrency)}
              </Text>
            </div>
            <Progress 
              percent={progressPercentage} 
              size="small" 
              status={progressPercentage === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            {totalInstallments > 0 && (
              <Text type="secondary" className="installment-info">
                {paidInstallments} of {totalInstallments} installments paid
              </Text>
            )}
            {unpaidAmount > 0.01 && (
              <Text className="unpaid-amount" style={{ color: '#fa8c16', fontSize: '11px', fontWeight: '500' }}>
                Remaining: {formatCurrency(unpaidAmount, detectedCurrency)}
              </Text>
            )}
          </div>
        );
      }
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: '15%',
      render: (_, record) => {
        const dueDate = record.projectDetails?.deadline;
        
        // If the assignment is completed, show completion info instead of overdue
        if (record.status === 'completed') {
          const completedDate = record.completedAt || record.updatedAt;
          return (
            <div className="timeline-info">
              <div className="due-date">
                <CheckCircleOutlined className="calendar-icon" style={{ color: '#52c41a' }} />
                <Text className="date-text" style={{ color: '#52c41a', fontWeight: 600 }}>
                  {moment(completedDate).format('MMM DD')}
                </Text>
              </div>
              <Text type="secondary" className="days-info" style={{ fontSize: '12px' }}>
                Completed {moment(completedDate).fromNow()}
              </Text>
            </div>
          );
        }
        
        // For non-completed assignments, show regular deadline logic
        if (!dueDate) return <Text type="secondary">No deadline</Text>;
        
        const isOverdue = moment().isAfter(moment(dueDate));
        const daysUntilDue = moment(dueDate).diff(moment(), 'days');
        
        return (
          <div className="timeline-info">
            <div className="due-date">
              <CalendarOutlined className="calendar-icon" />
              <Text className={`date-text ${isOverdue ? 'overdue' : daysUntilDue <= 3 ? 'urgent' : 'normal'}`}>
                {moment(dueDate).format('MMM DD')}
              </Text>
            </div>
            <Text type="secondary" className="days-info">
              {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : 
               daysUntilDue === 0 ? 'Due today' :
               `${daysUntilDue} days left`}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '22%',
      render: (_, record) => (
        <div className="action-buttons">
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="large"
              onClick={() => handleReviewAgreement(record)}
              loading={accepting && selectedAgreement?._id === record._id}
              className="review-button"
            >
              Review
            </Button>
          )}
          
          {record.status === 'active' && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<MessageOutlined />}
                size="large"
                onClick={() => navigate(`/chat/writer/${record.chatId}`)}
                disabled={!record.chatId}
                className="chat-button"
                block
              >
                Chat
              </Button>
              <Button
                type="default"
                icon={<CheckCircleOutlined />}
                size="large"
                onClick={() => handleCompleteAssignment(record._id)}
                className="complete-button"
                block
              >
                Mark Complete
              </Button>
            </Space>
          )}
          
          {record.status === 'completed' && (
            <Button
              icon={<EyeOutlined />}
              size="large"
              onClick={() => navigate(`/agreements/${record._id}`)}
              className="view-button"
            >
              View
            </Button>
          )}
        </div>
      )
    }
  ];

  // Debug function to clear cached data and force refresh
  const debugCurrentState = () => {
    // Debug function for development
  };

  const forceRefreshData = async () => {
    
    // Clear any cached earnings data from localStorage
    localStorage.removeItem('edu_sage_writer_earnings');
    localStorage.removeItem('edu_sage_writer_balance');
    localStorage.removeItem('edu_sage_total_spent');
    
    // Force refresh with agreements API (bypassing any cached dashboard data)
    await fetchData(true, true);
    
    notification.success({
      message: 'Data Refreshed',
      description: 'All earnings have been recalculated with platform fee removed!',
      placement: 'bottomRight',
      duration: 4
    });
  };

  // Make debug function available globally for testing
  window.debugWriterDashboard = debugCurrentState;

  // Show loader only if either component is loading OR currency is loading
  if (loading || currencyLoading) {
    return (
      <>
        <HeaderComponent />
        <AppLoader 
          fullScreen={false}
          tip={currencyLoading ? "Detecting your location..." : "Loading your dashboard..."}
          size="large"
          showIcon={true}
          showTip={true}
        />
      </>
    );
  }

  return (
    <Layout className="writer-dashboard premium-layout">
      <HeaderComponent />
      
      <Content className="dashboard-content">
        <div className="dashboard-container">
          {/* Premium Header Section */}
          <div className="writer-header-mobile dashboard-header-desktop">
            <div className="header-content">
              <div className="welcome-section">
                <Title 
                  level={1} 
                  className="welcome-title-mobile welcome-title-desktop"
                >
                  Welcome back, <span className="user-name-mobile user-name-desktop">{user?.name}</span> 👋
                </Title>
                <Paragraph className="welcome-subtitle-mobile welcome-subtitle-desktop">
                  Manage your projects, track earnings, and grow your freelance business
                </Paragraph>
                
                {/* Location Status */}
                <div className="location-status-mobile location-status-desktop">
                  <div className="location-content-mobile">
                    <EnvironmentOutlined />
                    <div className="location-text-mobile">
                      {userLocation ? (
                        <Text>
                          {userLocation.flag} {userLocation.displayName || userLocation.country} • Earnings in USD (≈ {userLocation.currencySymbol} for reference)
                        </Text>
                      ) : (
                        <Text>
                          🇳🇬 Nigeria • Earnings in USD (≈ ₦ for reference)
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Header Actions with Manual Refresh */}
              <div className="header-actions" style={{ marginBottom: '24px' }}>
                <Space 
                  size="large" 
                  wrap
                  direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
                  style={{ width: window.innerWidth < 768 ? '100%' : 'auto' }}
                >
                  <Button 
                    type="primary" 
                    icon={<PlusCircleOutlined />}
                    onClick={() => navigate('/writers')}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      fontWeight: '600',
                      height: 'clamp(44px, 10vw, 52px)',
                      paddingInline: 'clamp(20px, 6vw, 32px)',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      width: window.innerWidth < 768 ? '100%' : 'auto',
                      maxWidth: window.innerWidth < 768 ? '280px' : 'none',
                      minWidth: '160px'
                    }}
                  >
                    Browse Projects
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={refreshing}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      height: 'clamp(44px, 10vw, 52px)',
                      paddingInline: 'clamp(20px, 6vw, 32px)',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      width: window.innerWidth < 768 ? '100%' : 'auto',
                      maxWidth: window.innerWidth < 768 ? '280px' : 'none',
                      minWidth: '120px'
                    }}
                  >
                    Refresh
                  </Button>
                </Space>
              </div>
            </div>
          </div>

          {/* Modern Stats Cards */}
          <ModernStatsCards />

          {/* Writer Earnings Info */}
          {userLocation && (
            <Card className="earnings-info-card" style={{ marginBottom: '32px' }}>
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                    {userLocation.flag}
                  </div>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>
                    {userLocation.displayName}
                  </Text>
                </Col>
                <Col xs={24} sm={16}>
                  <div>
                    <Title level={4} style={{ marginBottom: '12px', color: '#1f2937' }}>
                      <DollarOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      Earnings Information
                    </Title>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ color: '#52c41a' }}>✓ All earnings processed in USD</Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ color: '#52c41a' }}>✓ Local currency conversion shown for reference</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      Your earnings are standardized in USD for global consistency. 
                      Local currency amounts help you understand the value in your region.
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* Main Content Row */}
          <Row gutter={[16, 16]}>
            {/* Projects Section */}
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <BookOutlined className="mr-2" style={{ fontSize: '20px', color: '#1890ff' }} />
                      <span style={{ fontSize: '20px', fontWeight: 600 }}>My Projects</span>
                    </div>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      <TeamOutlined className="mr-1" />
                      {activeAgreements.length + pendingAgreements.length + completedAgreements.length} total projects
                    </Text>
                  </div>
                }
                className="projects-card"
                style={{ borderRadius: '16px' }}
                bodyStyle={{ padding: '0' }}
              >
                <Collapse 
                  defaultActiveKey={activeAgreements.length > 0 ? ['active'] : ['pending']} 
                  ghost
                  size="large"
                >
              {/* Active Projects */}
              <Panel 
                header={
                  <div className="panel-header">
                    <div className="flex items-center">
                      <ThunderboltOutlined style={{ fontSize: '18px', color: '#52C41A', marginRight: '12px' }} />
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>
                        Active Projects ({activeAgreements.length})
                      </span>
                    </div>
                    {activeAgreements.length > 0 && (
                      <Tag className="panel-tag panel-tag-active">
                        In Progress
                      </Tag>
                    )}
                  </div>
                } 
                key="active"
              >
                <div className="panel-content">
                  {activeAgreements.length > 0 ? (
                    <div className="mobile-project-cards">
                      {activeAgreements.map(agreement => (
                        <Card
                          key={agreement._id}
                          className="project-mobile-card"
                          style={{
                            marginBottom: '16px',
                            borderRadius: '12px',
                            border: '1px solid #e8f4f8',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            overflow: 'hidden'
                          }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          {/* Compact Header */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <Title level={5} style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937', lineHeight: '1.3', flex: 1, marginRight: '8px' }}>
                                {agreement.projectDetails?.title || 'Untitled Project'}
                              </Title>
                              <Tag color="processing" style={{ margin: 0, borderRadius: '4px', fontSize: '10px', fontWeight: '500', padding: '2px 6px' }}>
                                <ClockCircleOutlined style={{ fontSize: '10px' }} />
                              </Tag>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BookOutlined style={{ fontSize: '10px' }} />
                                {agreement.projectDetails?.subject || 'General'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '10px', color: '#9ca3af' }}>
                                #{agreement._id?.slice(-6)}
                              </Text>
                            </div>
                          </div>

                          {/* Compact Student Info */}
                          {agreement.student ? (
                            <div style={{ 
                              background: '#f8fafc', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              marginBottom: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <Avatar 
                                size={43} 
                                icon={<UserOutlined />} 
                                src={agreement.student?.avatar}
                                style={{ backgroundColor: '#667eea', flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: '12px', color: '#1f2937', fontWeight: '500', display: 'block' }}>
                                  {agreement.student.name}
                                </Text>
                              </div>
                              <MessageOutlined style={{ color: '#667eea', fontSize: '14px' }} />
                            </div>
                          ) : (
                            <div style={{ 
                              background: '#fef3cd', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              marginBottom: '10px',
                              textAlign: 'center'
                            }}>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                <UserOutlined style={{ marginRight: '4px' }} />
                                Student info unavailable
                              </Text>
                            </div>
                          )}

                          {/* Compact Payment Progress */}
                          {(() => {
                            let paidAmount = 0;
                            let totalAmount = agreement.totalAmount || 0;
                            const detectedCurrency = getAgreementCurrency(agreement);
                            paidAmount = agreement.paidAmount || 0;
                            const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
                            
                            return (
                              <div style={{ marginBottom: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <Text style={{ fontSize: '12px', fontWeight: '600', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <DollarOutlined style={{ fontSize: '10px' }} />
                                    {formatCurrency(paidAmount, detectedCurrency)}
                                  </Text>
                                  <Text style={{ fontSize: '11px', color: '#6b7280' }}>
                                    of {formatCurrency(totalAmount, detectedCurrency)}
                                  </Text>
                                </div>
                                <Progress 
                                  percent={progressPercentage} 
                                  size="small" 
                                  status={progressPercentage === 100 ? 'success' : 'active'}
                                  strokeColor={{
                                    '0%': '#10b981',
                                    '100%': '#059669',
                                  }}
                                  style={{ marginBottom: '4px' }}
                                />
                              </div>
                            );
                          })()}

                          {/* Compact Actions */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button
                              icon={<MessageOutlined />}
                              type="primary"
                              size="small"
                              onClick={() => navigate(`/chat/writer/${agreement.chatId}`)}
                              disabled={!agreement.chatId}
                              style={{
                                flex: 1,
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                fontWeight: '500',
                                fontSize: '11px',
                                height: '32px'
                              }}
                            >
                              Chat
                            </Button>
                            <Button
                              icon={<CheckCircleOutlined />}
                              size="small"
                              onClick={() => handleCompleteAssignment(agreement._id)}
                              style={{
                                flex: 1,
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: 'white',
                                fontWeight: '500',
                                fontSize: '11px',
                                height: '32px'
                              }}
                            >
                              Complete
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty 
                      description="No active projects"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ padding: '40px 20px' }}
                    />
                  )}
                </div>
              </Panel>

              {/* Pending Projects */}
              <Panel 
                header={
                  <div className="panel-header">
                    <div className="flex items-center">
                      <Badge count={pendingAgreements.length} offset={[10, 0]}>
                        <ClockCircleOutlined style={{ fontSize: '18px', color: '#FA8C16', marginRight: '12px' }} />
                        <span style={{ fontSize: '16px', fontWeight: 600 }}>
                          Pending Projects
                        </span>
                      </Badge>
                    </div>
                    {pendingAgreements.length > 0 && (
                      <Tag className="panel-tag panel-tag-pending">
                        Awaiting Decision
                      </Tag>
                    )}
                  </div>
                } 
                key="pending"
              >
                <div className="panel-content">
                  {pendingAgreements.length > 0 ? (
                    <div className="mobile-project-cards">
                      {pendingAgreements.map(agreement => (
                        <Card
                          key={agreement._id}
                          className="project-mobile-card"
                          style={{
                            marginBottom: '16px',
                            borderRadius: '12px',
                            border: '1px solid #fef3cd',
                            boxShadow: '0 2px 8px rgba(255,193,7,0.1)',
                            overflow: 'hidden'
                          }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          {/* Compact Header */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <Title level={5} style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937', lineHeight: '1.3', flex: 1, marginRight: '8px' }}>
                                {agreement.projectDetails?.title || 'Untitled Project'}
                              </Title>
                              <Tag color="warning" style={{ margin: 0, borderRadius: '4px', fontSize: '10px', fontWeight: '500', padding: '2px 6px' }}>
                                <ClockCircleOutlined style={{ fontSize: '10px' }} />
                              </Tag>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BookOutlined style={{ fontSize: '10px' }} />
                                {agreement.projectDetails?.subject || 'General'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '10px', color: '#9ca3af' }}>
                                #{agreement._id?.slice(-6)}
                              </Text>
                            </div>
                          </div>

                          {/* Compact Student & Payment */}
                          <div style={{ 
                            background: '#fef7cd', 
                            padding: '8px', 
                            borderRadius: '6px', 
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Avatar 
                                size={36} 
                                icon={<UserOutlined />} 
                                src={agreement.student?.avatar}
                                style={{ backgroundColor: '#f59e0b', flexShrink: 0 }}
                              />
                              <Text style={{ fontSize: '11px', fontWeight: '500', color: '#92400e' }}>
                                {agreement.student?.name || 'Unknown Student'}
                              </Text>
                            </div>
                            <Text style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <DollarOutlined style={{ fontSize: '10px' }} />
                              {formatCurrency(agreement.totalAmount || 0, getAgreementCurrency(agreement))}
                            </Text>
                          </div>

                          {/* Compact Actions */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleReviewAgreement(agreement)}
                              loading={accepting && selectedAgreement?._id === agreement._id}
                              style={{
                                flex: 1,
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                border: 'none',
                                fontWeight: '500',
                                fontSize: '11px',
                                height: '32px'
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty 
                      description="No pending projects"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ padding: '40px 20px' }}
                    />
                  )}
                </div>
              </Panel>

              {/* Completed Projects */}
              <Panel 
                header={
                  <div className="panel-header">
                    <div className="flex items-center">
                      <CheckCircleOutlined style={{ fontSize: '18px', color: '#1890FF', marginRight: '12px' }} />
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>
                        Completed Projects ({completedAgreements.length})
                      </span>
                    </div>
                    {completedAgreements.length > 0 && (
                      <Tag className="panel-tag panel-tag-completed">
                        Finished
                      </Tag>
                    )}
                  </div>
                } 
                key="completed"
              >
                <div className="panel-content">
                  {completedAgreements.length > 0 ? (
                    <div className="mobile-project-cards">
                      {completedAgreements.map(agreement => (
                        <Card
                          key={agreement._id}
                          className="project-mobile-card"
                          style={{ 
                            marginBottom: '16px',
                            borderRadius: '12px',
                            border: '1px solid #d1fae5',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
                            overflow: 'hidden'
                          }}
                          bodyStyle={{ padding: '16px' }}
                        >
                          {/* Compact Header */}
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <Title level={5} style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937', lineHeight: '1.3', flex: 1, marginRight: '8px' }}>
                                {agreement.projectDetails?.title || 'Untitled Project'}
                              </Title>
                              <Tag color="success" style={{ margin: 0, borderRadius: '4px', fontSize: '10px', fontWeight: '500', padding: '2px 6px' }}>
                                <CheckCircleOutlined style={{ fontSize: '10px' }} />
                              </Tag>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BookOutlined style={{ fontSize: '10px' }} />
                                {agreement.projectDetails?.subject || 'General'}
                              </Text>
                              <Text type="secondary" style={{ fontSize: '10px', color: '#9ca3af' }}>
                                #{agreement._id?.slice(-6)}
                              </Text>
                            </div>
                          </div>

                          {/* Compact Completion & Payment */}
                          <div style={{ 
                            background: '#d1fae5', 
                            padding: '8px', 
                            borderRadius: '6px', 
                            marginBottom: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircleOutlined style={{ color: '#10b981', fontSize: '12px' }} />
                              <Text style={{ fontSize: '11px', fontWeight: '500', color: '#065f46' }}>
                                {moment(agreement.completedAt || agreement.updatedAt).fromNow()}
                              </Text>
                            </div>
                            <Text style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <DollarOutlined style={{ fontSize: '10px' }} />
                              {formatCurrency(agreement.paidAmount || agreement.totalAmount || 0, getAgreementCurrency(agreement))}
                            </Text>
                          </div>

                          {/* Compact Student Info */}
                          {agreement.student && (
                            <div style={{ 
                              background: '#f8fafc', 
                              padding: '8px', 
                              borderRadius: '6px', 
                              marginBottom: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <Avatar 
                                size={43} 
                                icon={<UserOutlined />} 
                                src={agreement.student?.avatar}
                                style={{ backgroundColor: '#10b981', flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontSize: '12px', color: '#1f2937', fontWeight: '500', display: 'block' }}>
                                  {agreement.student.name}
                                </Text>
                              </div>
                              <MessageOutlined style={{ color: '#10b981', fontSize: '14px' }} />
                            </div>
                          )}

                          {/* Compact Actions */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button
                              icon={<MessageOutlined />}
                              type="primary"
                              size="small"
                              onClick={() => navigate(`/chat/writer/${agreement.chatId}`)}
                              disabled={!agreement.chatId}
                              style={{
                                flex: 1,
                                borderRadius: '6px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                fontWeight: '500',
                                fontSize: '11px',
                                height: '32px'
                              }}
                            >
                              Chat
                            </Button>
                            <Button
                              icon={<EyeOutlined />}
                              size="small"
                              onClick={() => navigate(`/agreements/${agreement._id}`)}
                              style={{
                                flex: 1,
                                borderRadius: '6px',
                                borderColor: '#d1d5db',
                                color: '#374151',
                                fontWeight: '500',
                                fontSize: '11px',
                                height: '32px'
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty 
                      description="No completed projects"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ padding: '40px 20px' }}
                    />
                  )}
                </div>
              </Panel>
                </Collapse>
              </Card>
            </Col>

            {/* Sidebar */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Currency & Location Info */}
                {userLocation && (
                  <Card 
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <GlobalOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                        <span style={{ fontSize: '18px', fontWeight: '600' }}>Location & Currency</span>
                      </div>
                    }
                    style={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', background: '#ffffff' }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {userLocation.flag}
                      </div>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                        {userLocation.displayName}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                        <DollarOutlined style={{ color: '#667eea' }} />
                        <Text style={{ fontSize: '14px' }}>
                          Earnings in USD • {userLocation.currencySymbol} for reference
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        All earnings processed in USD for global consistency
                      </Text>
                    </div>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <ThunderboltOutlined style={{ color: '#1e3a8a', fontSize: '18px' }} />
                      <span style={{ fontSize: '18px', fontWeight: '600' }}>Quick Actions</span>
                    </div>
                  }
                  className="quick-actions-card"
                  style={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', background: '#ffffff' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Button 
                      icon={<PlusCircleOutlined />}
                      onClick={() => navigate('/writers')}
                      block
                      size="large"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600',
                        height: '48px',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                      }}
                    >
                      Browse Projects
                    </Button>
                    <Button 
                      icon={<MessageOutlined />}
                      onClick={() => navigate('/support')}
                      block
                      size="large"
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: '600',
                        height: '48px',
                        fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      Contact Support
                    </Button>
                  </Space>
                </Card>

                {/* Earnings Summary */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <BankOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                      <span style={{ fontSize: '18px', fontWeight: '600' }}>Earnings Summary</span>
                    </div>
                  }
                  style={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)', background: '#ffffff' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                        Total Earnings
                      </Text>
                      <div style={{ fontSize: '28px', color: '#667eea', fontWeight: '700' }}>
                        <Text style={{ color: '#667eea', fontSize: 'inherit', fontWeight: 'inherit' }}>
                          {formatCurrency(stats.totalEarnings, 'usd')}
                        </Text>
                      </div>
                      {userLocation && (
                        <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                          <EnvironmentOutlined /> {userLocation.country} • USD
                        </Text>
                      )}
                    </div>
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <div>
                          <Text style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            Available
                          </Text>
                          <div style={{ fontSize: '16px', color: '#52c41a', fontWeight: '600' }}>
                            <Text style={{ color: '#52c41a', fontSize: 'inherit', fontWeight: 'inherit' }}>
                              {formatCurrency(stats.availableBalance, 'usd')}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div>
                          <Text style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            Pending
                          </Text>
                          <div style={{ fontSize: '16px', color: '#fa8c16', fontWeight: '600' }}>
                            <Text style={{ color: '#fa8c16', fontSize: 'inherit', fontWeight: 'inherit' }}>
                              {formatCurrency(stats.pendingAmount, 'usd')}
                            </Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Review Agreement Modal */}
        <ReviewAgreementModal
          visible={isReviewModalVisible}
          agreement={selectedAgreement}
          onClose={() => {
            setIsReviewModalVisible(false);
            setSelectedAgreement(null);
          }}
          onAccept={handleAcceptAgreement}
          onCancel={handleCancelAgreement}
          loading={accepting}
        />

        {/* Complete Assignment Modal */}
        <CompleteAssignmentModal
          visible={isCompleteModalVisible}
          onClose={handleModalCancel}
          onConfirm={handleModalConfirm}
          projectTitle={
            selectedAssignmentId 
              ? activeAgreements.find(a => a._id === selectedAssignmentId)?.projectDetails?.title || 'this assignment'
              : 'this assignment'
          }
          loading={completing}
        />
      </Content>
      <style>{`
@media (max-width: 768px) {
  /* Mobile header improvements */
  .dashboard-header {
    padding: 20px !important;
    margin-bottom: 20px !important;
  }
  
  .header-content {
    text-align: center !important;
  }
  
  .welcome-section {
    margin-bottom: 20px !important;
  }
  
  .header-actions {
    display: flex !important;
    justify-content: center !important;
  }
  
  /* Fix narrow sections on mobile */
  .ant-row {
    margin-left: -8px !important;
    margin-right: -8px !important;
  }
  
  .ant-col {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  
  /* Make project sections full width on mobile */
  .ant-collapse {
    margin: 0 !important;
  }
  
  .ant-collapse-item {
    border: 1px solid #f0f0f0 !important;
    border-radius: 12px !important;
    margin-bottom: 12px !important;
  }
  
  .ant-collapse-header {
    padding: 16px 20px !important;
    font-size: 16px !important;
  }
  
  .ant-collapse-content-box {
    padding: 16px 20px !important;
  }
  
  /* Mobile stats cards */
  .ant-statistic-title {
    font-size: 12px !important;
  }
  
  .ant-statistic-content {
    font-size: 20px !important;
  }
  
  /* Mobile project cards */
  .mobile-project-cards .ant-card {
    margin-bottom: 12px !important;
  }
  
  .mobile-project-cards .ant-card-body {
    padding: 12px !important;
  }
  
  /* Mobile action buttons */
  .ant-btn {
    height: 44px !important;
    font-size: 14px !important;
    border-radius: 8px !important;
  }
  
  /* Fix project section button text sizing */
  .ant-collapse-content-box .ant-btn {
    font-size: 12px !important;
    padding: 4px 8px !important;
    height: 32px !important;
    min-width: auto !important;
  }
  
  .ant-collapse-content-box .ant-btn span {
    font-size: 12px !important;
  }
  
  /* Fix table action buttons */
  .ant-table-tbody .ant-btn {
    font-size: 12px !important;
    padding: 4px 8px !important;
    height: 28px !important;
    min-width: auto !important;
  }
  
  /* Fix avatar sizing override */
  .ant-statistic-content .ant-avatar {
    width: 32px !important;
    height: 32px !important;
    font-size: 14px !important;
    line-height: 32px !important;
  }
  
  .ant-statistic-content .ant-avatar .anticon {
    font-size: 14px !important;
  }
  
  /* Mobile sidebar */
  .ant-space-vertical {
    width: 100% !important;
  }
  
  /* Fix sidebar spacing on mobile */
  .ant-space-vertical > .ant-space-item {
    width: 100% !important;
    margin-bottom: 16px !important;
  }
  
  /* Make sidebar cards wider */
  .ant-space-vertical .ant-card {
    margin: 0 !important;
    width: 100% !important;
  }
  
  .ant-space-vertical .ant-card-body {
    padding: 20px !important;
  }
  
  /* Mobile typography */
  .ant-typography {
    font-size: 14px !important;
  }
  
  .ant-card-head-title {
    font-size: 16px !important;
  }
  
  /* Mobile layout adjustments */
  .dashboard-container {
    padding: 16px !important;
  }
  
  /* Mobile agreement cards */
  .agreement-card-mobile {
    margin-bottom: 16px !important;
  }
  
  .agreement-card-mobile .ant-card-body {
    padding: 16px !important;
  }
}

@media (max-width: 480px) {
  .payment-amounts-mobile {
    flex-direction: column !important;
    align-items: center !important;
    gap: 2px !important;
    text-align: center !important;
  }
  .payment-amounts-mobile .ant-typography, .payment-amounts-mobile .ant-tag {
    font-size: 12px !important;
  }
  
  /* Mobile-friendly project title and text */
  .mobile-friendly-title {
    font-size: 14px !important;
    line-height: 1.3 !important;
    white-space: normal !important;
    word-break: break-word !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 100% !important;
  }
  
  .mobile-friendly-text {
    font-size: 12px !important;
    white-space: normal !important;
    word-break: break-word !important;
  }
  
  /* Improved table layout for mobile */
  .professional-table .ant-table-thead > tr > th,
  .professional-table .ant-table-tbody > tr > td {
    padding: 8px 4px !important;
    font-size: 12px !important;
  }
  
  /* Writer info section mobile optimization */
  .writer-info {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 4px !important;
  }
  
  .writer-info .ant-avatar {
    margin-bottom: 4px !important;
  }
  
  /* Timeline section mobile optimization */
  .timeline-info {
    display: flex !important;
    flex-direction: column !important;
    gap: 2px !important;
  }
  
  /* Action buttons mobile optimization */
  .action-buttons-container {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
  }
  
  .student-action-button {
    height: 36px !important;
    padding: 0 12px !important;
    font-size: 12px !important;
  }
}

/* Card-based mobile view for tables (kicks in at 576px) */
@media (max-width: 576px) {
  .professional-table .ant-table-tbody > tr > td {
    display: flex !important;
    flex-direction: column !important;
    padding: 12px 8px !important;
    border-bottom: none !important;
  }
  
  .professional-table .ant-table-tbody > tr {
    margin-bottom: 16px !important;
    display: block !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
    background-color: white !important;
  }
  
  .professional-table .ant-table-thead {
    display: none !important;
  }
  
  .professional-table .ant-table-tbody > tr > td::before {
    content: attr(data-label) !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    color: #8c8c8c !important;
    margin-bottom: 4px !important;
    display: block !important;
  }
  
  .professional-table .ant-table-cell {
    width: 100% !important;
  }
  
  /* Hide pagination on mobile */
  .professional-table .ant-pagination-item {
    display: none !important;
  }
  
  .professional-table .ant-pagination-prev,
  .professional-table .ant-pagination-next,
  .professional-table .ant-pagination-jump-prev,
  .professional-table .ant-pagination-jump-next {
    display: inline-block !important;
  }
  
  /* Mobile app feel optimizations */
  .mobile-bottom-tabs-visible {
    padding-bottom: 80px;
  }
  
  /* Mobile header card optimization */
  .ant-card {
    margin-bottom: 16px !important;
  }
  
  /* Mobile welcome section */
  .ant-typography h1 {
    font-size: 24px !important;
    line-height: 1.2 !important;
    margin-bottom: 8px !important;
  }
  
  /* Mobile location section */
  .location-status-mobile {
    padding: 12px !important;
    margin-top: 16px !important;
    border-radius: 12px !important;
    font-size: 14px !important;
  }
  
  /* Mobile stats cards */
  .stat-cards .ant-col {
    margin-bottom: 16px !important;
  }
  
  .stat-card {
    padding: 16px !important;
    border-radius: 12px !important;
  }
  
  /* Mobile quick actions */
  .quick-actions-mobile {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
  }
  
  .quick-actions-mobile .ant-btn {
    width: 100% !important;
    height: 48px !important;
    font-size: 16px !important;
    border-radius: 12px !important;
  }
  
  /* Remove extra spacing after quick actions */
  .quick-actions-section {
    margin-bottom: 0 !important;
  }
  
  /* Mobile table improvements */
  .ant-table-wrapper {
    margin-bottom: 0 !important;
  }
  
  /* Mobile content wrapper */
  .content-wrapper-mobile {
    padding: 16px !important;
    padding-bottom: 88px !important;
  }
  
  /* Fix header avatars on mobile */
  .ant-card .ant-avatar {
    width: 28px !important;
    height: 28px !important;
    font-size: 12px !important;
    line-height: 28px !important;
  }
  
  .ant-card .ant-avatar .anticon {
    font-size: 12px !important;
  }
}

/* Desktop avatar sizing */
@media (min-width: 769px) {
  .ant-card .ant-avatar {
    width: 36px !important;
    height: 36px !important;
    font-size: 16px !important;
    line-height: 36px !important;
  }
  
  .ant-card .ant-avatar .anticon {
    font-size: 16px !important;
  }
}
`}</style>
      <MobileBottomTabs />
    </Layout>
  );
};

export default WriterDashboard;