import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { fetchStudentDashboardData, getRecommendedWriters } from '../api/user';
import { agreementApi } from '../api/agreement';
import { paymentApi } from '../api/payment';
import { useNavigate, useLocation } from 'react-router-dom';
import NewHeader from '../components/NewHeader';
import { useCurrency } from '../hooks/useCurrency';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Calendar,
  Star,
  ArrowRight,
  RefreshCw,
  Plus,
  Eye,
  MessageCircle,
  Award,
  Target,
  Activity,
  MapPin,
  CreditCard,
  AlertCircle,
  Wallet,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';

const NewStudentDashboard = () => {
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

  // Create a ref to store the fetchData function to avoid dependency loops
  const fetchDataRef = useRef();

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

  // Calculate monthly spending from agreements
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
        
        // Check installments for payments made this month
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
                  
                  // Convert based on user location (default to Nigerian conversion if location not loaded yet)
                  const isNigerian = true; // Default to Nigerian pricing for now
                  if (isNigerian) {
                    if (agreementCurrency === 'usd') {
                      monthlySpent += amount * 1500; // Convert USD to NGN
                    } else {
                      monthlySpent += amount; // Keep NGN as is
                    }
                  } else {
                    monthlySpent += amount; // For non-Nigerian users, use as is
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
            
            // Convert based on user location (default to Nigerian conversion if location not loaded yet)
            const isNigerian = true; // Default to Nigerian pricing for now
            if (isNigerian) {
              if (agreementCurrency === 'usd') {
                monthlySpent += agreement.paidAmount * 1500; // Convert USD to NGN
              } else {
                monthlySpent += agreement.paidAmount; // Keep NGN as is
              }
            } else {
              monthlySpent += agreement.paidAmount; // For non-Nigerian users, use as is
            }
          }
        }
      }
    });
    
    return monthlySpent;
  };

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    console.log('🚀 fetchData called:', { isAuthenticated, userId: user?._id, showRefreshIndicator });
    
    if (!isAuthenticated || !user?._id) {
      console.log('❌ fetchData aborted: not authenticated or no user ID');
      return;
    }
    
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      
      console.log('📊 Setting loading state...');
      
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
      
      // Calculate financial data from agreements using enhanced currency detection
      const calculatedPendingPayments = [...pending, ...active].reduce((sum, agreement) => {
        const pendingAmount = agreement?.installments?.reduce((total, installment) => {
          if (installment.status !== 'processing' && installment.status !== 'paid') {
            const agreementCurrency = getAgreementCurrency(agreement);
            const amount = installment.amount || 0;
            
            // Convert based on user location (default to Nigerian conversion for now)
            const isNigerian = true; // Default to Nigerian pricing for now
            if (isNigerian) {
              if (agreementCurrency === 'usd') {
                return total + (amount * 1500); // Convert USD to NGN
              } else {
                return total + amount; // Keep NGN as is
              }
            } else {
              return total + amount; // For non-Nigerian users, use as is
            }
          }
          return total;
        }, 0) || 0;
        return sum + pendingAmount;
      }, 0);
      
      // Calculate total spent from agreements with proper conversion
      let totalPaidAmount = 0;
      agreementsList.forEach(agreement => {
        // Check multiple fields for paid amounts
        let amountToAdd = 0;
        if (agreement.paidAmount && typeof agreement.paidAmount === 'number') {
          amountToAdd = agreement.paidAmount;
        } else if (agreement.status === 'completed' && agreement.totalAmount) {
          // If completed but no paidAmount, use totalAmount
          amountToAdd = agreement.totalAmount;
        } else if (agreement.installments) {
          // Calculate from paid installments
          amountToAdd = agreement.installments.reduce((sum, inst) => {
            if (inst.status === 'paid' || inst.status === 'processing') {
              return sum + (inst.amount || 0);
            }
            return sum;
          }, 0);
        }

        if (amountToAdd > 0) {
          const agreementCurrency = getAgreementCurrency(agreement);
          
          // Convert based on user location (default to Nigerian conversion for now)
          const isNigerian = true; // Default to Nigerian pricing for now
          if (isNigerian) {
            if (agreementCurrency === 'usd') {
              totalPaidAmount += amountToAdd * 1500; // Convert USD to NGN
            } else {
              totalPaidAmount += amountToAdd; // Keep NGN as is
            }
          } else {
            totalPaidAmount += amountToAdd; // For non-Nigerian users, use as is
          }
        }
      });
      
      // Calculate monthly spending using the proper function
      const monthlySpending = calculateMonthlySpending(agreementsList);
      
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
    } finally {
      console.log('🏁 fetchData completed, setting loading to false');
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?._id]);

  // Store fetchData in ref for stable access
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    console.log('🔍 Dashboard useEffect triggered:', { isAuthenticated, userRole: user?.role, userId: user?._id });
    
    if (!isAuthenticated || user?.role !== 'student') {
      console.log('❌ Authentication failed, redirecting to signin');
      navigate('/signin');
      return;
    }
    
    // Check for forced refresh immediately, no delays
    const forceRefresh = localStorage.getItem('forceRefreshDashboard');
    if (forceRefresh) {
      console.log('🔄 Forced dashboard refresh detected');
      localStorage.removeItem('forceRefreshDashboard');
    }
    
    console.log('✅ Starting fetchData...');
    // Fetch data immediately - no more delays
    fetchData();
  }, [isAuthenticated, user?.role, navigate]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleAgreementAccepted = (data) => {
      console.log('📥 Agreement accepted:', data);
      fetchData();
    };

    const handleAgreementUpdated = (data) => {
      console.log('📥 Agreement updated:', data);
      fetchData();
    };

    const handleAgreementCompleted = (data) => {
      console.log('📥 Agreement completed:', data);
      fetchData();
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
  }, [socket, isAuthenticated]);

  // Force dashboard to show after 3 seconds max, regardless of currency state
  useEffect(() => {
    const forceShowTimer = setTimeout(() => {
      console.log('🚨 Force showing dashboard after timeout');
      setDashboardReady(true);
    }, 3000);

    return () => clearTimeout(forceShowTimer);
  }, []);

  // Set dashboard ready when loading completes
  useEffect(() => {
    if (!loading) {
      console.log('✅ Loading completed, setting dashboard ready');
      setDashboardReady(true);
    }
  }, [loading]);

  const handleRefresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const ProjectCard = ({ project, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{project.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span>${project.budget}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            project.status === 'completed' ? 'bg-green-100 text-green-700' :
            project.status === 'active' ? 'bg-blue-100 text-blue-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {project.status}
          </span>
          <button
            onClick={() => navigate(`/agreements/${project._id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>View</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const WriterCard = ({ writer, index }) => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {writer.name?.charAt(0) || 'W'}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{writer.name}</h3>
          <p className="text-sm text-gray-600">{writer.specialization}</p>
          <div className="flex items-center space-x-1 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{writer.rating || '5.0'}</span>
            <span className="text-xs text-gray-500">({writer.reviews || 0} reviews)</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => navigate(`/writers/${writer._id}`)}
        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded-lg font-medium transition-colors"
      >
        View Profile
      </button>
    </motion.div>
  );

  // Show loader only while dashboard is loading, with force timeout
  if (loading && !dashboardReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NewHeader />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewHeader />
      
      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-600 mt-2">
                  Here's what's happening with your projects today.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => navigate('/agreements/create')}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={DollarSign}
              title="Total Spent"
              value={formatCurrency(stats.totalSpent, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend="+12%"
            />
            <StatCard
              icon={Wallet}
              title="This Month"
              value={formatCurrency(stats.moneySpentThisMonth, (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria' || !userLocation) ? 'ngn' : 'usd')}
              subtitle={`${moment().format('MMMM')} spending`}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Activity}
              title="Active Projects"
              value={stats.activeProjects}
              subtitle="Currently in progress"
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              icon={CheckCircle}
              title="Completed"
              value={stats.completedProjects}
              subtitle="Successfully finished"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Projects */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                  <button
                    onClick={() => navigate('/student/jobs')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {agreements.length > 0 ? (
                    agreements.slice(0, 5).map((project, index) => (
                      <ProjectCard key={project._id} project={project} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-600 mb-4">Start by creating your first project</p>
                      <button
                        onClick={() => navigate('/agreements/create')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Project
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recommended Writers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Top Writers</h2>
                  <button
                    onClick={() => navigate('/writers')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>Browse All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {recommendedWriters.length > 0 ? (
                    recommendedWriters.slice(0, 3).map((writer, index) => (
                      <WriterCard key={writer._id} writer={writer} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No writers available</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/agreements/create')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Create New Project</span>
                  </button>
                  <button
                    onClick={() => navigate('/writers')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Browse Writers</span>
                  </button>
                  <button
                    onClick={() => navigate('/chat/student')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Messages</span>
                  </button>
                  <button
                    onClick={() => navigate('/payments/history')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Award className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Payment History</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewStudentDashboard;