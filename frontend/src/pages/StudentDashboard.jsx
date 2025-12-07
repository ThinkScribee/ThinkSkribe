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
  Avatar,
  Tooltip,
  Divider,
  List,
  Progress,
  Alert,
  Timeline,
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
  ReloadOutlined,
  BookOutlined,
  TeamOutlined,
  PlusOutlined,
  CreditCardOutlined,
  WarningOutlined,
  HeartOutlined,
  RiseOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  LineChartOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  RocketOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { fetchStudentDashboardData, getRecommendedWriters } from '../api/user';
import { agreementApi } from '../api/agreement';
import { paymentApi } from '../api/payment';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderComponent from '../components/HeaderComponent';
import AppLoader from '../components/AppLoader';
import MobileBottomTabs from '../components/MobileBottomTabs';
// Enhanced location and currency components
import LocalizedPriceDisplay from '../components/LocalizedPriceDisplay';
import StudentPriceDisplay from '../components/StudentPriceDisplay';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/currencyUtils';
import moment from 'moment';
import './StudentDashboard.css';
import '../components/DashboardMobile.css';

const { Content } = Layout;
const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;

// Modern styling constants
const modernStyles = {
  container: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    minHeight: '100vh',
    padding: '0'
  },
  contentWrapper: {
    background: '#f8fafc',
    borderRadius: '24px 24px 0 0',
    minHeight: '100vh',
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
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  },
  modernCard: {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    background: '#ffffff'
  }
};

const StudentDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const { convertPrice, formatCurrency, getCurrencySymbol, location: userLocation, loading: currencyLoading } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [agreements, setAgreements] = useState([]);
  const [pendingAgreements, setPendingAgreements] = useState([]);
  const [activeAgreements, setActiveAgreements] = useState([]);
  const [completedAgreements, setCompletedAgreements] = useState([]);
  const [recommendedWriters, setRecommendedWriters] = useState([]);
  const [agreementBadgeCount, setAgreementBadgeCount] = useState(0);
  const [showJobPostingModal, setShowJobPostingModal] = useState(false);

  const [stats, setStats] = useState({
    totalSpent: 0,
    pendingPayments: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalProjects: 0,
    averageRating: 0,
    moneySpentThisMonth: 0,
    projectsThisMonth: 0
  });

  // 🔥 CHECK URL PARAMETERS FOR FORCE REFRESH
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const forceRefresh = urlParams.get('forceRefresh');
    
    if (forceRefresh) {
      console.log('🔄 Force refresh requested via URL parameter');
      localStorage.setItem('forceRefreshDashboard', 'true');
      
      // Clean up URL
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate]);

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

  // Calculate monthly spending from agreements - IMPROVED VERSION  
  const calculateMonthlySpending = (agreementsList) => {
    const currentMonth = moment().month();
    const currentYear = moment().year();
    
    let monthlySpent = 0;
    
    agreementsList.forEach(agreement => {
      if (agreement.paidAmount > 0) {
        // Check if this is a Nigerian agreement (paid in NGN)
        const isNigerianAgreement = agreement?.paymentPreferences?.currency === 'ngn' || 
                                   agreement?.originalCurrency === 'ngn' ||
                                   agreement?.currency === 'ngn';
        
        // IMPROVED: Check installments for payments made this month
        if (agreement.installments && agreement.installments.length > 0) {
          agreement.installments.forEach(installment => {
            if (installment.status === 'paid') {
              // Check if payment was made this month
              const paymentDate = installment.paymentDate || installment.paidDate;
              if (paymentDate) {
                const pDate = moment(paymentDate);
                if (pDate.month() === currentMonth && pDate.year() === currentYear) {
                  const amount = installment.amount || 0;
                  const agreementCurrency = getAgreementCurrency(agreement);
                  
                  // Bidirectional conversion based on user location
                  const isNigerian = userLocation?.countryCode === 'ng';
                  if (isNigerian) {
                    // Nigerian users: convert USD to NGN, keep NGN as is
                    if (agreementCurrency === 'usd') {
                      monthlySpent += amount * 1550; // Convert USD to NGN
                    } else {
                      monthlySpent += amount; // Keep NGN as is
                    }
                  } else {
                    // Non-Nigerian users: convert NGN to USD, keep USD as is
                    if (agreementCurrency === 'ngn') {
                      monthlySpent += amount / 1550; // Convert NGN to USD
                    } else {
                      monthlySpent += amount; // Keep USD as is
                    }
                  }
                }
              } else {
                // If no specific payment date, use the agreement's completion date
                const completionDate = moment(agreement.completedAt || agreement.updatedAt);
                if (completionDate.month() === currentMonth && completionDate.year() === currentYear) {
                  const amount = installment.amount || 0;
                  const agreementCurrency = getAgreementCurrency(agreement);
                  
                  // Bidirectional conversion based on user location
                  const isNigerian = userLocation?.countryCode === 'ng';
                  if (isNigerian) {
                    // Nigerian users: convert USD to NGN, keep NGN as is
                    if (agreementCurrency === 'usd') {
                      monthlySpent += amount * 1550; // Convert USD to NGN
                    } else {
                      monthlySpent += amount; // Keep NGN as is
                    }
                  } else {
                    // Non-Nigerian users: convert NGN to USD, keep USD as is
                    if (agreementCurrency === 'ngn') {
                      monthlySpent += amount / 1550; // Convert NGN to USD
                    } else {
                      monthlySpent += amount; // Keep USD as is
                    }
                  }
                }
              }
            }
          });
        } else {
          // If no installments, check if the agreement was completed/paid this month
          const relevantDate = moment(agreement.completedAt || agreement.updatedAt || agreement.createdAt);
          if (relevantDate.month() === currentMonth && relevantDate.year() === currentYear) {
            const agreementCurrency = getAgreementCurrency(agreement);
            
            // Bidirectional conversion based on user location
            const isNigerian = userLocation?.countryCode === 'ng';
            if (isNigerian) {
              // Nigerian users: convert USD to NGN, keep NGN as is
              if (agreementCurrency === 'usd') {
                monthlySpent += agreement.paidAmount * 1550; // Convert USD to NGN
              } else {
                monthlySpent += agreement.paidAmount; // Keep NGN as is
              }
            } else {
              // Non-Nigerian users: convert NGN to USD, keep USD as is
              if (agreementCurrency === 'ngn') {
                monthlySpent += agreement.paidAmount / 1550; // Convert NGN to USD
              } else {
                monthlySpent += agreement.paidAmount; // Keep USD as is
              }
            }
          }
        }
      }
    });
    
    console.log('💰 [Dashboard] Monthly spending calculated:', {
      currentMonth: currentMonth + 1, // +1 for human-readable month
      currentYear,
      monthlySpent,
      agreementsChecked: agreementsList.length,
      userLocation: userLocation?.countryCode
    });
    
    return monthlySpent;
  };

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (!isAuthenticated || !user?._id) return;
    
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      
      console.log('🔄 Fetching student dashboard data...');
      
      // Fetch dashboard data and agreements in parallel
      const [dashboardData, agreementsData, writersData] = await Promise.all([
        fetchStudentDashboardData().catch(err => {
          console.warn('Dashboard API failed:', err);
          return null;
        }),
        agreementApi.getAgreements().catch(err => {
          console.warn('Agreements API failed:', err);
          return [];
        }),
        getRecommendedWriters().catch(err => {
          console.warn('Writers API failed:', err);
          return [];
        })
      ]);

      console.log('✅ Data fetched:', { dashboardData, agreementsData });
      
      // Process agreements FIRST
      const agreementsList = Array.isArray(agreementsData) ? agreementsData : [];
      setAgreements(agreementsList);
      
      // Categorize agreements by status
      const pending = agreementsList.filter(a => a?.status === 'pending');
      const active = agreementsList.filter(a => a?.status === 'active');
      const completed = agreementsList.filter(a => a?.status === 'completed');
      
      setPendingAgreements(pending);
      setActiveAgreements(active);
      setCompletedAgreements(completed);
      setAgreementBadgeCount(pending.length + active.length);
      
      // Set recommended writers
      setRecommendedWriters(Array.isArray(writersData) ? writersData : []);
      
      // Debug: Check if we have data and user location
      console.log('🔍 [Debug] Initial data check:', {
        userLocation,
        isNigerian: userLocation?.countryCode === 'ng',
        agreementsCount: agreementsList.length,
        sampleAgreement: agreementsList[0],
        pending: pending.length,
        active: active.length
      });

      
      // Calculate financial data from agreements using enhanced currency detection
      const calculatedPendingPayments = [...pending, ...active].reduce((sum, agreement) => {
        const pendingAmount = agreement?.installments?.reduce((total, installment) => {
          if (installment.status !== 'processing' && installment.status !== 'paid') {
            const agreementCurrency = getAgreementCurrency(agreement);
            const amount = installment.amount || 0;
            
            // Bidirectional conversion based on user location
            const isNigerian = userLocation?.countryCode === 'ng';
            if (isNigerian) {
              // Nigerian users: convert USD to NGN, keep NGN as is
              if (agreementCurrency === 'usd') {
                console.log(`Converting USD installment: $${amount} → ₦${amount * 1550}`);
                return total + (amount * 1550); // Convert USD to NGN
              } else {
                console.log(`Keeping NGN installment: ₦${amount}`);
                return total + amount; // Keep NGN as is
              }
            } else {
              // Non-Nigerian users: convert NGN to USD, keep USD as is
              if (agreementCurrency === 'ngn') {
                console.log(`Converting NGN installment: ₦${amount} → $${(amount / 1550).toFixed(2)}`);
                return total + (amount / 1550); // Convert NGN to USD
              } else {
                console.log(`Keeping USD installment: $${amount}`);
                return total + amount; // Keep USD as is
              }
            }
          }
          return total;
        }, 0) || 0;
        return sum + pendingAmount;
      }, 0);
      
      // Calculate total spent from agreements with proper conversion
      let totalPaidAmount = 0;
      agreementsList.forEach(agreement => {
        console.log(`Processing agreement ${agreement._id?.slice(-8)}:`, {
          paidAmount: agreement.paidAmount,
          totalAmount: agreement.totalAmount,
          status: agreement.status,
          paymentPreferences: agreement.paymentPreferences
        });

        // Check multiple fields for paid amounts
        let amountToAdd = 0;
        if (agreement.paidAmount && typeof agreement.paidAmount === 'number') {
          amountToAdd = agreement.paidAmount;
        } else if (agreement.status === 'completed' && agreement.totalAmount) {
          // If completed but no paidAmount, use totalAmount
          amountToAdd = agreement.totalAmount;
          console.log(`Using totalAmount for completed agreement: ${amountToAdd}`);
        } else if (agreement.installments) {
          // Calculate from paid installments
          amountToAdd = agreement.installments.reduce((sum, inst) => {
            if (inst.status === 'paid' || inst.status === 'processing') {
              return sum + (inst.amount || 0);
            }
            return sum;
          }, 0);
          console.log(`Calculated from paid installments: ${amountToAdd}`);
        }

        if (amountToAdd > 0) {
          const agreementCurrency = getAgreementCurrency(agreement);
          
          // Bidirectional conversion based on user location
          const isNigerian = userLocation?.countryCode === 'ng';
          if (isNigerian) {
            // Nigerian users: convert USD to NGN, keep NGN as is
            if (agreementCurrency === 'usd') {
              console.log(`Converting USD total: $${amountToAdd} → ₦${amountToAdd * 1550}`);
              totalPaidAmount += amountToAdd * 1550; // Convert USD to NGN
            } else {
              console.log(`Keeping NGN total: ₦${amountToAdd}`);
              totalPaidAmount += amountToAdd; // Keep NGN as is
            }
          } else {
            // Non-Nigerian users: convert NGN to USD, keep USD as is
            if (agreementCurrency === 'ngn') {
              console.log(`Converting NGN total: ₦${amountToAdd} → $${(amountToAdd / 1550).toFixed(2)}`);
              totalPaidAmount += amountToAdd / 1550; // Convert NGN to USD
            } else {
              console.log(`Keeping USD total: $${amountToAdd}`);
              totalPaidAmount += amountToAdd; // Keep USD as is
            }
          }
        }
      });
      
      // Calculate monthly spending using the proper function
      const monthlySpending = calculateMonthlySpending(agreementsList);
      
      console.log('💰 [Smart Conversion Debug] Full breakdown:', {
        userLocation,
        userLocationCountryCode: userLocation?.countryCode,
        isNigerian: userLocation?.countryCode === 'ng',
        agreementsCount: agreementsList.length,
        monthlySpending,
        totalPaidAmount,
        pendingPayments: calculatedPendingPayments,
        agreementBreakdown: agreementsList.map(a => {
          const detectedCurrency = getAgreementCurrency(a);
          const isNigerian = userLocation?.countryCode === 'ng';
          
          // Calculate the actual amount to use (same logic as above)
          let effectiveAmount = 0;
          if (a.paidAmount && typeof a.paidAmount === 'number') {
            effectiveAmount = a.paidAmount;
          } else if (a.status === 'completed' && a.totalAmount) {
            effectiveAmount = a.totalAmount;
          } else if (a.installments) {
            effectiveAmount = a.installments.reduce((sum, inst) => {
              if (inst.status === 'paid' || inst.status === 'processing') {
                return sum + (inst.amount || 0);
              }
              return sum;
            }, 0);
          }
          
          const shouldConvert = isNigerian && detectedCurrency === 'usd';
          return {
            id: a._id?.slice(-8),
            title: a.projectDetails?.title,
            detectedCurrency,
            status: a.status,
            originalAmount: a.totalAmount,
            paidAmount: a.paidAmount,
            effectiveAmount,
            isNigerian,
            shouldConvert,
            convertedAmount: shouldConvert ? effectiveAmount * 1500 : effectiveAmount,
            paymentPreferences: a.paymentPreferences,
            installments: a.installments?.map(inst => ({
              amount: inst.amount,
              status: inst.status
            }))
          };
        })
      });
      
      // Simple summary for user
      console.log(`📊 FINAL TOTALS:
        💰 Total Spent: ₦${totalPaidAmount.toLocaleString()}
        📅 This Month: ₦${monthlySpending.toLocaleString()}
        ⏳ Pending: ₦${calculatedPendingPayments.toLocaleString()}
        📁 Agreements: ${agreementsList.length}
        🌍 Location: ${userLocation?.country || 'Loading...'} (${userLocation?.countryCode || 'Unknown'})
      `);
      
      // Update localStorage
      localStorage.setItem('edu_sage_total_spent', totalPaidAmount.toString());
      
      // Update stats with calculated values
      setStats({
        totalSpent: totalPaidAmount,
        pendingPayments: calculatedPendingPayments,
        activeProjects: active.length,
        completedProjects: completed.length,
        totalProjects: agreementsList.length,
        averageRating: dashboardData?.averageRating || 0,
        moneySpentThisMonth: monthlySpending,
        projectsThisMonth: dashboardData?.projectsThisMonth || active.length
      });
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      notification.error({
        message: 'Error Loading Dashboard',
        description: 'Failed to load dashboard data. Please refresh the page.',
        placement: 'bottomRight',
        duration: 5
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?._id]);

  // Initial data fetch
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') {
      navigate('/signin');
      return;
    }
    
    // Check for forced refresh immediately, no delays
    const forceRefresh = localStorage.getItem('forceRefreshDashboard');
    if (forceRefresh) {
      console.log('🔄 Forced dashboard refresh detected');
      localStorage.removeItem('forceRefreshDashboard');
    }
    
    // Fetch data immediately - no more delays
    fetchData();
    
    // Show job posting modal after dashboard loads (only if user hasn't seen it recently)
    const hasSeenJobModal = localStorage.getItem('hasSeenJobPostingModal');
    const lastSeenDate = localStorage.getItem('jobPostingModalLastSeen');
    const shouldShowModal = !hasSeenJobModal || !lastSeenDate || 
      (Date.now() - parseInt(lastSeenDate)) > (24 * 60 * 60 * 1000); // 24 hours
    
    if (shouldShowModal) {
      setTimeout(() => {
        setShowJobPostingModal(true);
      }, 2000); // Show after 2 seconds
    }
  }, [isAuthenticated, user?.role, navigate, fetchData]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleAgreementAccepted = (data) => {
      console.log('📥 Agreement accepted:', data);
      fetchData();
      notification.success({
        message: 'Agreement Accepted',
        description: `Your agreement for "${data.title}" has been accepted by the writer.`,
        placement: 'bottomRight',
        duration: 5
      });
    };

    const handleAgreementUpdated = (data) => {
      console.log('📥 Agreement updated:', data);
      fetchData();
      notification.info({
        message: 'Agreement Updated',
        description: `Agreement "${data.title}" has been updated.`,
        placement: 'bottomRight',
        duration: 4
      });
    };

    const handleAgreementCompleted = (data) => {
      console.log('📥 Agreement completed:', data);
      fetchData();
      notification.success({
        message: 'Agreement Completed',
        description: `Your project "${data.title}" has been completed!`,
        placement: 'bottomRight',
        duration: 6
      });
    };

    const handlePaymentCompleted = (data) => {
      console.log('📥 Payment completed via socket:', data);
      
      // Update stats immediately
      const paymentAmount = data.amount || 0;
      setStats(prev => {
        const newTotalSpent = parseFloat(prev.totalSpent) + parseFloat(paymentAmount);
        const newPendingPayments = Math.max(0, parseFloat(prev.pendingPayments) - parseFloat(paymentAmount));
        
        localStorage.setItem('edu_sage_total_spent', newTotalSpent.toString());
        
        return {
          ...prev,
          totalSpent: newTotalSpent,
          pendingPayments: newPendingPayments
        };
      });
      
      // Refresh full data
      fetchData();
      
      notification.success({
        message: 'Payment Successful',
        description: `Your payment of ${formatCurrency(paymentAmount)} has been processed successfully.`,
        placement: 'bottomRight',
        duration: 5
      });
    };
    
    // Register socket listeners
    socket.on('agreementAccepted', handleAgreementAccepted);
    socket.on('agreementUpdated', handleAgreementUpdated);
    socket.on('agreementCompleted', handleAgreementCompleted);
    socket.on('paymentSuccess', handlePaymentCompleted);
    
    return () => {
      socket.off('agreementAccepted', handleAgreementAccepted);
      socket.off('agreementUpdated', handleAgreementUpdated);
      socket.off('agreementCompleted', handleAgreementCompleted);
      socket.off('paymentSuccess', handlePaymentCompleted);
    };
  }, [socket, isAuthenticated, fetchData, formatCurrency]);

  // 🔥 BROADCAST CHANNEL LISTENER FOR PAYMENT UPDATES
  useEffect(() => {
    if (!window.BroadcastChannel) return;

    const channel = new BroadcastChannel('payment-updates');
    
    const handlePaymentBroadcast = (event) => {
      console.log('📡 Received payment broadcast:', event.data);
      
      if (event.data.type === 'PAYMENT_SUCCESS') {
        console.log('🔄 Refreshing dashboard due to payment success broadcast');
        
        // Force immediate refresh
        fetchData();
        
        // Show notification
        notification.success({
          message: 'Payment Processed',
          description: 'Your payment has been processed. Dashboard updated!',
          placement: 'bottomRight',
          duration: 4
        });
      }
    };
    
    channel.addEventListener('message', handlePaymentBroadcast);
    
    return () => {
      channel.removeEventListener('message', handlePaymentBroadcast);
      channel.close();
    };
  }, [fetchData]);

  // 🔥 ENHANCED FORCED REFRESH CHECK
  useEffect(() => {
    const checkForRefresh = () => {
      const forceRefresh = localStorage.getItem('forceRefreshDashboard');
      const paymentCompleted = localStorage.getItem('paymentJustCompleted');
      
      if (forceRefresh || paymentCompleted) {
        console.log('🔄 Forced refresh detected:', { forceRefresh, paymentCompleted });
        
        // Clear flags
        localStorage.removeItem('forceRefreshDashboard');
        localStorage.removeItem('paymentJustCompleted');
        
        // Force refresh with delay
        setTimeout(() => {
          console.log('🔄 Executing forced dashboard refresh');
          fetchData();
        }, 500);
      }
    };

    // Check immediately
    checkForRefresh();
    
    // Also check periodically in case of missed events
    const interval = setInterval(checkForRefresh, 2000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle refresh explicitly
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Handle job posting modal
  const handleJobPostingModalClose = () => {
    setShowJobPostingModal(false);
    localStorage.setItem('hasSeenJobPostingModal', 'true');
    localStorage.setItem('jobPostingModalLastSeen', Date.now().toString());
  };

  const handlePostJob = () => {
    setShowJobPostingModal(false);
    localStorage.setItem('hasSeenJobPostingModal', 'true');
    localStorage.setItem('jobPostingModalLastSeen', Date.now().toString());
    navigate('/student/jobs');
  };

  // Function to get status config (color, icon, text)
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { color: 'processing', icon: <ClockCircleOutlined />, text: 'In Progress' };
      case 'completed':
        return { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' };
      case 'pending':
        return { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' };
      case 'cancelled':
        return { color: 'error', icon: <WarningOutlined />, text: 'Cancelled' };
      default:
        return { color: 'default', icon: <FileTextOutlined />, text: 'Unknown' };
    }
  };

  // Function to clear all payment data from localStorage and reset the dashboard
  const clearAllPaymentData = () => {
    // Clear all payment-related localStorage items
    localStorage.removeItem('edu_sage_total_spent');
    localStorage.removeItem('edu_sage_writer_earnings');
    localStorage.removeItem('edu_sage_writer_balance');
    
    // Reset stats
    setStats(prev => ({
      ...prev,
      totalSpent: 0,
      pendingPayments: 0
    }));
    
    notification.success({
      message: 'Payment Data Reset',
      description: 'All payment data has been cleared. The dashboard will now show only actual payment data from the server.',
      placement: 'bottomRight',
      duration: 5
    });
    
    // Refresh data
    fetchData(true);
  };

  // Stats cards (No changes needed here as they are already responsive)
  const StatCards = () => {
    return (
      <Row gutter={[16, 16]} className="stat-cards">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card total-spent">
            <div>
              <div className="stat-title">Total Spent</div>
              <div style={{ color: '#3f8600' }}>
                <LocalizedPriceDisplay 
                  usdAmount={stats.totalSpent} 
                  showSymbol={true}
                  style={{ color: '#3f8600' }}
                />
              </div>
            </div>
            <Divider className="stat-divider" />
            <div className="stat-footer">
              <Text type="secondary">Lifetime spending</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card pending-payments">
            <div>
              <div className="stat-title">Pending Payments</div>
              <div style={{ color: '#cf1322' }}>
                <LocalizedPriceDisplay 
                  usdAmount={stats.pendingPayments} 
                  showSymbol={true}
                  style={{ color: '#cf1322' }}
                />
              </div>
            </div>
            <Divider className="stat-divider" />
            <div className="stat-footer">
              <Text type="secondary">Upcoming installments</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card active-projects">
            <Statistic
              title={<span className="stat-title">Active Projects</span>}
              value={stats.activeProjects}
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileTextOutlined />}
            />
            <Divider className="stat-divider" />
            <div className="stat-footer">
              <Text type="secondary">In progress</Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card completed-projects">
            <Statistic
              title={<span className="stat-title">Completed Projects</span>}
              value={stats.completedProjects}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
            <Divider className="stat-divider" />
            <div className="stat-footer">
              <Text type="secondary">Successfully finished</Text>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // Agreement table columns
  const agreementColumns = [
    {
      title: 'Project Information',
      dataIndex: ['projectDetails', 'title'],
      key: 'title',
      width: '25%',
      render: (title, record) => (
        <div data-label="Project Information" className="project-info">
          <Title level={5} className="project-title mobile-friendly-title">
            {title || 'Untitled Project'}
          </Title>
          <div className="project-meta">
            <Tag color="blue" className="project-id">ID: {record._id?.slice(-8)}</Tag>
            <Text type="secondary" className="project-subject mobile-friendly-text">
              {record.projectDetails?.subject || 'General'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Writer Info',
      dataIndex: 'writer',
      key: 'writer',
      width: '20%',
      render: (writer) => (
        <div data-label="Writer Info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {writer ? (
            <>
              <Avatar 
                size={40} 
                icon={<UserOutlined />} 
                src={writer?.avatar}
                style={{ backgroundColor: '#667eea', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: '4px' }}>
                  <Text strong style={{ fontSize: '14px', color: '#1f2937', display: 'block', wordBreak: 'break-word' }}>
                    {writer.name}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', wordBreak: 'break-all' }}>
                    {writer?.email || 'No email'}
                  </Text>
                </div>
              </div>
            </>
          ) : (
            <Text type="secondary">Not assigned</Text>
          )}
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
        const isFullyPaid = unpaidAmount <= 0.01;
        
        // Enhanced currency detection logic
        let detectedCurrency = 'usd'; // default
        
        // If we have paymentPreferences, check for NGN indicators
        if (record.paymentPreferences) {
          const prefs = record.paymentPreferences;
          
          // If currency is explicitly set to NGN, use that
          if (prefs.currency === 'ngn') {
            detectedCurrency = 'ngn';
          }
          // If it was created with Paystack (Nigerian gateway), likely NGN
          else if (prefs.gateway === 'paystack') {
            detectedCurrency = 'ngn';
          }
          // If nativeAmount exists and is different from totalAmount, and exchangeRate is 1, likely NGN
          else if (prefs.nativeAmount && prefs.nativeAmount !== totalAmount && prefs.exchangeRate === 1) {
            detectedCurrency = 'ngn';
          }
          // If nativeAmount is much larger than what would be normal USD (>5000), likely NGN
          else if (prefs.nativeAmount && prefs.nativeAmount > 5000) {
            detectedCurrency = 'ngn';
          }
          // Otherwise use the stated currency
          else {
            detectedCurrency = prefs.currency || 'usd';
          }
        }
        
        console.log('💱 [StudentDashboard] Agreement currency debug:', {
          agreementId: record._id?.slice(-8),
          title: record.projectDetails?.title,
          paymentPreferences: record.paymentPreferences,
          currency: record.currency,
          detectedCurrency,
          totalAmount,
          paidAmount,
          reasoning: record.paymentPreferences?.gateway === 'paystack' ? 'Paystack gateway' : 
                    record.paymentPreferences?.nativeAmount > 5000 ? 'Large nativeAmount' : 
                    record.paymentPreferences?.currency || 'default'
        });
        
        return (
          <div data-label="Payment Progress" className="payment-progress">
            <div className="payment-amounts payment-amounts-mobile" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              flexWrap: 'wrap',
              fontSize: 'clamp(11px, 2.5vw, 13px)'
            }}>
              <Text strong style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '600', color: '#52c41a' }}>
                {formatCurrency(paidAmount, detectedCurrency)} paid
              </Text>
              <Text type="secondary" style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#8c8c8c' }}>
                of
              </Text>
              <Text strong style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: '#595959' }}>
                {formatCurrency(totalAmount, detectedCurrency)}
              </Text>
            </div>
            <Progress 
              percent={progressPercentage} 
              size="small" 
              status={isFullyPaid ? 'success' : 'active'}
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
            {!isFullyPaid && unpaidAmount > 0 && (
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
            <div data-label="Timeline" className="timeline-info">
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
        if (!dueDate) return <div data-label="Timeline"><Text type="secondary">No deadline</Text></div>;
        
        const isOverdue = moment().isAfter(moment(dueDate));
        const daysUntilDue = moment(dueDate).diff(moment(), 'days');
        
        return (
          <div data-label="Timeline" className="timeline-info">
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Active', value: 'active' },
        { text: 'Completed', value: 'completed' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const config = getStatusConfig(status);
        return (
          <div data-label="Status">
            <Tag 
              color={config.color}
              icon={config.icon}
              style={{ borderRadius: '8px', fontSize: '11px', fontWeight: '600', padding: '4px 12px' }}
            >
              {config.text}
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '22%',
      render: (_, record) => (
        <div data-label="Actions" className="action-buttons-container">
          {record.status === 'pending' && (
            <Tooltip title="Click to pay" placement="top">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate(`/agreements/${record._id}`)}
                className="student-action-button view-details-button"
                block
              >
                Actions
              </Button>
            </Tooltip>
          )}
          
          {record.status === 'active' && (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Button
                icon={<MessageOutlined />}
                type="primary"
                size="large"
                onClick={() => navigate(`/chat/student/${record.writer?._id}`)}
                className="student-action-button chat-writer-button"
                block
              >
                Chat with Writer
              </Button>
              <Tooltip title="Click to pay" placement="top">
                <Button
                  icon={<EyeOutlined />}
                  size="large"
                  onClick={() => navigate(`/agreements/${record._id}`)}
                  className="student-action-button view-details-secondary"
                  block
                >
                  Actions
                </Button>
              </Tooltip>
            </Space>
          )}
          
          {record.status === 'completed' && (
            <Tooltip title="Click to pay" placement="top">
              <Button
                icon={<EyeOutlined />}
                size="large"
                onClick={() => navigate(`/agreements/${record._id}`)}
                className="student-action-button view-details-button"
                block
              >
                Actions
              </Button>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  // Force dashboard to show after 3 seconds max, regardless of currency state
  useEffect(() => {
    const forceShowTimer = setTimeout(() => {
      console.log('🚨 Force showing dashboard after timeout');
      setDashboardReady(true);
    }, 3000);

    // Clear timer if dashboard loads normally
    if (!loading) {
      clearTimeout(forceShowTimer);
      setDashboardReady(true);
    }

    return () => clearTimeout(forceShowTimer);
  }, [loading]);

  // Show loader only while dashboard is loading, with force timeout
  if (loading && !dashboardReady) {
    return (
      <>
        <HeaderComponent />
        <AppLoader 
          fullScreen={false}
          tip="Loading your dashboard..."
          size="large"
          showIcon={true}
          showTip={true}
        />
      </>
    );
  }

  return (
    <>
      <HeaderComponent />
      
      <div style={modernStyles.container}>
        <div style={modernStyles.contentWrapper} className="content-wrapper-mobile">
          {/* Modern Header */}
          <div className={`welcome-header-mobile welcome-header-desktop`}>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} lg={16}>
                <div>
                  <Title 
                    level={1} 
                    className="welcome-title-mobile welcome-title-desktop"
                  >
                    Welcome back, <span className="user-name-mobile user-name-desktop">{user?.name}</span>! 👋
                  </Title>
                  <Text className="welcome-subtitle-mobile welcome-subtitle-desktop">
                    Track your projects and manage your academic success
                  </Text>
                  
                  {/* Location Status */}
                  <div className="location-status-mobile location-status-desktop">
                    <div className="location-content-mobile">
                      <EnvironmentOutlined />
                      <div className="location-text-mobile">
                        {userLocation ? (
                          <Text>
                            {userLocation.flag} {userLocation.displayName || userLocation.country} • {userLocation.currencySymbol} {userLocation.currency} • Native Pricing
                          </Text>
                        ) : (
                          <Text>
                            🇳🇬 Nigeria • ₦ NGN • Native Pricing
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
              <Col xs={24} lg={8} style={{ textAlign: window.innerWidth < 768 ? 'center' : 'right', marginTop: window.innerWidth < 768 ? '20px' : '0' }}>
                <Space 
                  size="large" 
                  wrap
                  direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
                  style={{ width: window.innerWidth < 768 ? '100%' : 'auto' }}
                >
                  <Button 
                    type="primary" 
                    icon={<TeamOutlined />}
                    onClick={() => navigate('/writers')}
                    size="large"
                    style={{
                      borderRadius: '12px',
                      height: 'clamp(44px, 10vw, 52px)',
                      paddingInline: 'clamp(20px, 6vw, 32px)',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: 'clamp(14px, 3vw, 16px)',
                      width: window.innerWidth < 768 ? '100%' : 'auto',
                      maxWidth: window.innerWidth < 768 ? '280px' : 'none',
                      minWidth: '140px'
                    }}
                  >
                    Browse Writers
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
              </Col>
            </Row>
          </div>

          {/* Modern Statistics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                style={{
                  ...modernStyles.statsCard,
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                  color: 'white'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 3.5vw, 16px)', marginBottom: '8px', fontWeight: '500' }}>
                      Total Spent
                    </div>
                    <div style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: '700', color: 'white' }}>
                      <Text style={{ color: 'white', fontSize: 'inherit', fontWeight: 'inherit' }}>
                        {formatCurrency(stats.totalSpent, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
                      </Text>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 2.5vw, 13px)', marginTop: '4px' }}>
                      <RiseOutlined /> All time payments
                    </div>
                  </div>
                  <Avatar 
                    size={window.innerWidth < 768 ? 32 : 40}
                    icon={<DollarOutlined />} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: window.innerWidth < 768 ? '14px' : '18px'
                    }} 
                  />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card 
                style={{
                  ...modernStyles.statsCard,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  color: 'white'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 3.5vw, 16px)', marginBottom: '8px', fontWeight: '500' }}>
                      This Month
                    </div>
                    <div style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: '700', color: 'white' }}>
                      <Text style={{ color: 'white', fontSize: 'inherit', fontWeight: 'inherit' }}>
                        {formatCurrency(stats.moneySpentThisMonth, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
                      </Text>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 2.5vw, 13px)', marginTop: '4px' }}>
                      <CalendarOutlined /> {moment().format('MMMM')} spending
                    </div>
                  </div>
                  <Avatar 
                    size={window.innerWidth < 768 ? 32 : 40}
                    icon={<LineChartOutlined />} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: window.innerWidth < 768 ? '14px' : '18px'
                    }} 
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card 
                style={{
                  ...modernStyles.statsCard,
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: 'white'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 3.5vw, 16px)', marginBottom: '8px', fontWeight: '500' }}>
                      Active Projects
                    </div>
                    <div style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: '700', color: 'white' }}>
                      {stats.activeProjects}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 2.5vw, 13px)', marginTop: '4px' }}>
                      <FireOutlined /> In progress
                    </div>
                  </div>
                  <Avatar 
                    size={window.innerWidth < 768 ? 32 : 40}
                    icon={<FileTextOutlined />} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: window.innerWidth < 768 ? '14px' : '18px'
                    }} 
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card 
                style={{
                  ...modernStyles.statsCard,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                  color: 'white'
                }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(14px, 3.5vw, 16px)', marginBottom: '8px', fontWeight: '500' }}>
                      Completed
                    </div>
                    <div style={{ fontSize: 'clamp(28px, 7vw, 36px)', fontWeight: '700', color: 'white' }}>
                      {stats.completedProjects}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(11px, 2.5vw, 13px)', marginTop: '4px' }}>
                      <CheckCircleOutlined /> Finished projects
                    </div>
                  </div>
                  <Avatar 
                    size={window.innerWidth < 768 ? 32 : 40}
                    icon={<TrophyOutlined />} 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: window.innerWidth < 768 ? '14px' : '18px'
                    }} 
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Secondary Stats Row */}
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} md={6}>
              <Card size="small" className="secondary-stat-card">
                <Statistic
                  title="Total Projects"
                  value={stats.totalProjects}
                  prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card size="small" className="secondary-stat-card">
                <Statistic
                  title="This Month"
                  value={stats.projectsThisMonth}
                  prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card size="small" className="secondary-stat-card">
                <Statistic
                  title="Avg. Rating"
                  value={stats.averageRating}
                  precision={1}
                  prefix={<StarOutlined style={{ color: '#faad14' }} />}
                  suffix="/ 5.0"
                  valueStyle={{ color: '#faad14', fontSize: '24px' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Content Row */}
          <Row gutter={[16, 16]}>
            {/* Agreements Section */}
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
                      {agreements.length} total projects
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
                          <FileTextOutlined style={{ fontSize: 'clamp(18px, 5vw, 22px)', color: '#52C41A', marginRight: '12px' }} />
                          <span style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', fontWeight: 600, color: '#1e293b' }}>
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

                              {/* Compact Writer Info */}
                              {agreement.writer ? (
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
                                    size={24} 
                                    icon={<UserOutlined />} 
                                    src={agreement.writer?.avatar}
                                    style={{ backgroundColor: '#667eea', flexShrink: 0 }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontSize: '12px', color: '#1f2937', fontWeight: '500', display: 'block' }}>
                                      {agreement.writer.name}
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
                                    <LoadingOutlined style={{ marginRight: '4px' }} />
                                    Awaiting assignment
                                  </Text>
                                </div>
                              )}

                              {/* Compact Payment Progress */}
                              {(() => {
                                let paidAmount = 0;
                                let totalAmount = agreement.totalAmount || 0;
                                let paidInstallments = 0;
                                let totalInstallments = 0;

                                if (agreement.installments && agreement.installments.length > 0) {
                                  totalInstallments = agreement.installments.length;
                                  paidInstallments = agreement.installments.filter(inst => 
                                    inst.status === 'paid' || inst.status === 'processing'
                                  ).length;
                                  paidAmount = agreement.installments.reduce((sum, inst) => {
                                    return sum + (inst.status === 'paid' || inst.status === 'processing' ? inst.amount : 0);
                                  }, 0);
                                } else {
                                  paidAmount = agreement.paidAmount || 0;
                                }

                                const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
                                const isFullyPaid = (totalAmount - paidAmount) <= 0.01;
                                const detectedCurrency = getAgreementCurrency(agreement);

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
                                      status={isFullyPaid ? 'success' : 'active'}
                                      strokeColor={{
                                        '0%': '#10b981',
                                        '100%': '#059669',
                                      }}
                                      style={{ marginBottom: '4px' }}
                                    />
                                    {totalInstallments > 0 && (
                                      <Text type="secondary" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CreditCardOutlined style={{ fontSize: '8px' }} />
                                        {paidInstallments}/{totalInstallments} payments
                                      </Text>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Compact Timeline */}
                              {(() => {
                                const dueDate = agreement.projectDetails?.deadline;
                                if (!dueDate) return (
                                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarOutlined style={{ color: '#9ca3af', fontSize: '12px' }} />
                                    <Text type="secondary" style={{ fontSize: '11px' }}>No deadline</Text>
                                  </div>
                                );
                                
                                const isOverdue = moment().isAfter(moment(dueDate));
                                const daysUntilDue = moment(dueDate).diff(moment(), 'days');
                                
                                return (
                                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarOutlined style={{ 
                                      color: isOverdue ? '#ef4444' : daysUntilDue <= 3 ? '#f59e0b' : '#10b981',
                                      fontSize: '12px'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                      <Text style={{ 
                                        fontSize: '12px', 
                                        fontWeight: '500',
                                        color: isOverdue ? '#ef4444' : daysUntilDue <= 3 ? '#f59e0b' : '#374151'
                                      }}>
                                        {moment(dueDate).format('MMM DD')}
                                      </Text>
                                      <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                                        {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : 
                                         daysUntilDue === 0 ? 'Today' :
                                         `${daysUntilDue}d left`}
                                      </Text>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Compact Actions */}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Button
                                  icon={<MessageOutlined />}
                                  type="primary"
                                  size="small"
                                  onClick={() => navigate(`/chat/student/${agreement.writer?._id}`)}
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
                            <ClockCircleOutlined style={{ fontSize: 'clamp(18px, 5vw, 22px)', color: '#FA8C16', marginRight: '12px' }} />
                            <span style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', fontWeight: 600, color: '#1e293b' }}>
                              Pending Projects
                            </span>
                          </Badge>
                        </div>
                        {pendingAgreements.length > 0 && (
                          <Tag className="panel-tag panel-tag-pending">
                            Waiting for Writer
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

                              {/* Compact Status & Payment */}
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
                                  <LoadingOutlined style={{ color: '#f59e0b', fontSize: '12px' }} />
                                  <Text style={{ fontSize: '11px', fontWeight: '500', color: '#92400e' }}>
                                    Waiting for Writer
                                  </Text>
                                </div>
                                <Text style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <DollarOutlined style={{ fontSize: '10px' }} />
                                  {formatCurrency(agreement.totalAmount || 0, getAgreementCurrency(agreement))}
                                </Text>
                              </div>

                              {/* Compact Timeline */}
                              {(() => {
                                const dueDate = agreement.projectDetails?.deadline;
                                if (!dueDate) return (
                                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarOutlined style={{ color: '#9ca3af', fontSize: '12px' }} />
                                    <Text type="secondary" style={{ fontSize: '11px' }}>No deadline</Text>
                                  </div>
                                );
                                
                                const daysUntilDue = moment(dueDate).diff(moment(), 'days');
                                
                                return (
                                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CalendarOutlined style={{ 
                                      color: daysUntilDue <= 7 ? '#f59e0b' : '#10b981',
                                      fontSize: '12px'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                      <Text style={{ 
                                        fontSize: '12px', 
                                        fontWeight: '500',
                                        color: '#374151'
                                      }}>
                                        {moment(dueDate).format('MMM DD')}
                                      </Text>
                                      <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>
                                        {daysUntilDue <= 0 ? 'Due today' : `${daysUntilDue}d left`}
                                      </Text>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Compact Actions */}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Button
                                  icon={<CreditCardOutlined />}
                                  type="primary"
                                  size="small"
                                  onClick={() => navigate(`/agreements/${agreement._id}`)}
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
                                  Pay
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
                          description="No pending projects"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                      )}
                    </div>
                  </Panel>

                  {/* Completed Projects */}
                  <Panel 
                    header={
                      <div className="panel-header">
                        <div className="flex items-center">
                          <CheckCircleOutlined style={{ fontSize: 'clamp(18px, 5vw, 22px)', color: '#1890FF', marginRight: '12px' }} />
                          <span style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', fontWeight: 600, color: '#1e293b' }}>
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
                                    Completed {moment(agreement.completedAt || agreement.updatedAt).fromNow()}
                                  </Text>
                                </div>
                                <Text style={{ fontSize: '12px', fontWeight: '600', color: '#065f46', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <DollarOutlined style={{ fontSize: '10px' }} />
                                  {formatCurrency(agreement.paidAmount || agreement.totalAmount || 0, getAgreementCurrency(agreement))}
                                </Text>
                              </div>

                              {/* Compact Writer Info */}
                              {agreement.writer && (
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
                                    size={24} 
                                    icon={<UserOutlined />} 
                                    src={agreement.writer?.avatar}
                                    style={{ backgroundColor: '#10b981', flexShrink: 0 }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontSize: '12px', color: '#1f2937', fontWeight: '500', display: 'block' }}>
                                      {agreement.writer.name}
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
                                  onClick={() => navigate(`/chat/student/${agreement.writer?._id}`)}
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
                    style={modernStyles.modernCard}
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
                          Local Currency: {userLocation.currencySymbol} {userLocation.currency}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        All prices shown in native Nigerian currency • No conversion fees
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
                  className="quick-actions-card quick-actions-section"
                  style={modernStyles.modernCard}
                >
                  <Space direction="vertical" className="quick-actions-mobile" style={{ width: '100%' }} size="middle">
                    <Button 
                      icon={<TeamOutlined />}
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
                      Browse Writers
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

                {/* Payment Summary */}
                <Card 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <BankOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                      <span style={{ fontSize: '18px', fontWeight: '600' }}>Payment Summary</span>
                    </div>
                  }
                  style={modernStyles.modernCard}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>
                        Total Spent
                      </Text>
                      <div style={{ fontSize: '28px', color: '#667eea', fontWeight: '700' }}>
                        <Text style={{ color: '#667eea', fontSize: 'inherit', fontWeight: 'inherit' }}>
                          {formatCurrency(stats.totalSpent, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
                        </Text>
                      </div>
                      {userLocation && (
                        <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                          <EnvironmentOutlined /> {userLocation.country} • {userLocation.currency}
                        </Text>
                      )}
                    </div>
                    <Divider />
                    <Row gutter={16}>
                      <Col span={12}>
                        <div>
                          <Text style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            Pending
                          </Text>
                          <div style={{ fontSize: '16px', color: '#fa8c16', fontWeight: '600' }}>
                            <Text style={{ color: '#fa8c16', fontSize: 'inherit', fontWeight: 'inherit' }}>
                              {formatCurrency(stats.pendingPayments, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div>
                          <Text style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                            This Month
                          </Text>
                          <div style={{ fontSize: '16px', color: '#52c41a', fontWeight: '600' }}>
                            <Text style={{ color: '#52c41a', fontSize: 'inherit', fontWeight: 'inherit' }}>
                              {formatCurrency(stats.moneySpentThisMonth, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
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
      </div>

      {/* Job Posting Modal */}
      <Modal
        title={null}
        open={showJobPostingModal}
        onCancel={handleJobPostingModalClose}
        footer={null}
        width={window.innerWidth < 768 ? '95%' : 600}
        centered
        closable={false}
        maskClosable={false}
        className="job-posting-promotion-modal"
        style={{ top: window.innerWidth < 768 ? '20px' : 'auto' }}
      >
        <div style={{ 
          textAlign: 'center', 
          padding: window.innerWidth < 768 ? '30px 16px' : '40px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 1
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '50%',
            zIndex: 1
          }}></div>
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Icon */}
            <div style={{ 
              fontSize: window.innerWidth < 768 ? '60px' : '80px', 
              marginBottom: window.innerWidth < 768 ? '16px' : '20px',
              animation: 'pulse 2s infinite'
            }}>
              <RocketOutlined />
            </div>
            
            {/* Title */}
            <Title 
              level={2} 
              style={{ 
                color: 'white', 
                marginBottom: window.innerWidth < 768 ? '12px' : '16px',
                fontSize: window.innerWidth < 768 ? '22px' : '28px',
                fontWeight: '700'
              }}
            >
              🚀 Ready to Post Your First Job?
            </Title>
            
            {/* Description */}
            <Paragraph style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: window.innerWidth < 768 ? '14px' : '16px', 
              lineHeight: '1.6',
              marginBottom: window.innerWidth < 768 ? '24px' : '30px',
              maxWidth: window.innerWidth < 768 ? '300px' : '400px',
              margin: window.innerWidth < 768 ? '0 auto 24px auto' : '0 auto 30px auto'
            }}>
              Connect with expert academic writers and get your assignments done professionally. 
              Post a job and watch talented writers compete for your project!
            </Paragraph>
            
            {/* Benefits */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              marginBottom: window.innerWidth < 768 ? '24px' : '30px',
              flexWrap: 'wrap',
              gap: window.innerWidth < 768 ? '16px' : '20px'
            }}>
              <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>
                  Quick Matching
                </Text>
              </div>
              <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>
                  Expert Writers
                </Text>
              </div>
              <div style={{ textAlign: 'center', flex: '1', minWidth: '120px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💯</div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>
                  Quality Guaranteed
                </Text>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: window.innerWidth < 768 ? '12px' : '16px', 
              justifyContent: 'center', 
              flexWrap: 'wrap',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row'
            }}>
              <Button
                type="primary"
                size="large"
                onClick={handlePostJob}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '12px',
                  height: window.innerWidth < 768 ? '44px' : '48px',
                  paddingInline: window.innerWidth < 768 ? '24px' : '32px',
                  fontSize: window.innerWidth < 768 ? '14px' : '16px',
                  fontWeight: '600',
                  backdropFilter: 'blur(10px)',
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
                icon={<PlusOutlined />}
              >
                Post My First Job
              </Button>
              <Button
                size="large"
                onClick={handleJobPostingModalClose}
                style={{
                  background: 'transparent',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '12px',
                  height: window.innerWidth < 768 ? '44px' : '48px',
                  paddingInline: window.innerWidth < 768 ? '20px' : '24px',
                  fontSize: window.innerWidth < 768 ? '14px' : '16px',
                  fontWeight: '500',
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              >
                Maybe Later
              </Button>
            </div>
            
            {/* Small text */}
            <Text style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: '12px', 
              marginTop: '20px',
              display: 'block'
            }}>
              You can always post jobs later from the navigation menu
            </Text>
          </div>
        </div>
      </Modal>

      <style>{`
/* Job posting modal animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.job-posting-promotion-modal .ant-modal-content {
  border-radius: 20px !important;
  overflow: hidden !important;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
}

.job-posting-promotion-modal .ant-modal-body {
  padding: 0 !important;
}

@media (max-width: 768px) {
  .job-posting-promotion-modal .ant-modal {
    width: 95% !important;
    max-width: 400px !important;
  }
  
  .job-posting-promotion-modal .ant-modal-content {
    margin: 0 !important;
  }
  
  /* Enhanced mobile popup styling */
  .job-posting-promotion-modal .ant-modal {
    margin: 10px !important;
    max-width: calc(100vw - 20px) !important;
  }
  
  .job-posting-promotion-modal .ant-modal-content {
    border-radius: 16px !important;
    overflow: hidden !important;
  }
  
  .job-posting-promotion-modal .ant-modal-body {
    padding: 0 !important;
  }
}

@media (max-width: 768px) {
  /* Mobile header improvements */
  .ant-card .ant-row {
    flex-direction: column !important;
    gap: 16px !important;
  }
  
  .ant-card .ant-col {
    text-align: center !important;
    width: 100% !important;
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
}
`}</style>
      <MobileBottomTabs />
    </>
  );
};

export default StudentDashboard;