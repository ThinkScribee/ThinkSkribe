import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { agreementApi } from '../api/agreement';
import { paymentApi } from '../api/payment';
import { fetchWriterDashboardData } from '../api/writerDashboard';
import { useNavigate } from 'react-router-dom';
import NewHeader from '../components/NewHeader';
import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Star,
  ArrowRight,
  RefreshCw,
  Eye,
  MessageCircle,
  Award,
  Target,
  Activity,
  Wallet,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const NewWriterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEarnings: 0,
      availableBalance: 0,
      pendingEarnings: 0,
      completedProjects: 0,
      activeProjects: 0,
      pendingProjects: 0
    },
    recentProjects: [],
    pendingAgreements: []
  });





  const handleRefresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Helper function to get agreement currency
  const getAgreementCurrency = (agreement) => {
    if (agreement?.currency) return agreement.currency.toLowerCase();
    if (agreement?.student?.location?.countryCode === 'ng') return 'ngn';
    if (userLocation?.countryCode === 'ng' || userLocation?.country === 'Nigeria') return 'ngn';
    return 'usd';
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
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

  const ProjectCard = ({ project, index, type = 'recent' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span>${project.budget}</span>
            </span>
            {project.deadline && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            project.status === 'completed' ? 'bg-green-100 text-green-700' :
            project.status === 'active' ? 'bg-blue-100 text-blue-700' :
            project.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {project.status}
          </span>
          <button
            onClick={() => navigate(`/agreements/${project._id}`)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>{type === 'pending' ? 'Review' : 'View'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const EarningsChart = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Monthly Earnings</h3>
          <p className="text-3xl font-bold">${dashboardData.stats.totalEarnings.toLocaleString()}</p>
          <p className="text-blue-100 text-sm mt-1">+23% from last month</p>
        </div>
        <div className="p-3 bg-white/20 rounded-xl">
          <BarChart3 className="w-8 h-8" />
        </div>
      </div>
      
      {/* Simple earnings visualization */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-100">Available</span>
          <span className="font-semibold">${dashboardData.stats.availableBalance}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-500"
            style={{ 
              width: `${(dashboardData.stats.availableBalance / dashboardData.stats.totalEarnings) * 100}%` 
            }}
          ></div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-100">Pending</span>
          <span className="font-semibold">${dashboardData.stats.pendingEarnings}</span>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
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
                  Welcome back, {user?.name?.split(' ')[0]}! 🚀
                </h1>
                <p className="text-gray-600 mt-2">
                  Here's your writing performance overview.
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
                  onClick={() => navigate('/writer/jobs')}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Browse Jobs</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={DollarSign}
              title="Total Earnings"
              value={`$${dashboardData.stats.totalEarnings.toLocaleString()}`}
              color="bg-gradient-to-br from-green-500 to-green-600"
              trend="+23%"
              onClick={() => navigate('/payments/history')}
            />
            <StatCard
              icon={Wallet}
              title="Available Balance"
              value={`$${dashboardData.stats.availableBalance.toLocaleString()}`}
              subtitle="Ready to withdraw"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Clock}
              title="Pending Earnings"
              value={`$${dashboardData.stats.pendingEarnings.toLocaleString()}`}
              subtitle="In review"
              color="bg-gradient-to-br from-orange-500 to-orange-600"
            />
            <StatCard
              icon={CheckCircle}
              title="Completed Projects"
              value={dashboardData.stats.completedProjects}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            <StatCard
              icon={Activity}
              title="Active Projects"
              value={dashboardData.stats.activeProjects}
              subtitle="Currently working"
              color="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            <StatCard
              icon={Zap}
              title="Pending Reviews"
              value={dashboardData.stats.pendingProjects}
              subtitle="Awaiting approval"
              color="bg-gradient-to-br from-yellow-500 to-yellow-600"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Projects */}
            <div className="lg:col-span-2 space-y-6">
              {/* Earnings Overview */}
              <EarningsChart />

              {/* Recent Projects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                  <button
                    onClick={() => navigate('/writer/jobs')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {dashboardData.recentProjects.length > 0 ? (
                    dashboardData.recentProjects.slice(0, 4).map((project, index) => (
                      <ProjectCard key={project._id} project={project} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-600 mb-4">Start browsing available jobs</p>
                      <button
                        onClick={() => navigate('/writer/jobs')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Jobs
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pending Agreements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Pending Reviews</h2>
                  {dashboardData.pendingAgreements.length > 0 && (
                    <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                      {dashboardData.pendingAgreements.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {dashboardData.pendingAgreements.length > 0 ? (
                    dashboardData.pendingAgreements.slice(0, 3).map((project, index) => (
                      <ProjectCard key={project._id} project={project} index={index} type="pending" />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">All caught up!</p>
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
                    onClick={() => navigate('/writer/jobs')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Browse Available Jobs</span>
                  </button>
                  <button
                    onClick={() => navigate('/chat/writer')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Messages</span>
                  </button>
                  <button
                    onClick={() => navigate('/payments/history')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Payment History</span>
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Users className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Profile Settings</span>
                  </button>
                </div>
              </motion.div>

              {/* Performance Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-6">Performance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-600">Rating</span>
                    </div>
                    <span className="font-semibold">4.9/5.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">Success Rate</span>
                    </div>
                    <span className="font-semibold">98%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Avg. Delivery</span>
                    </div>
                    <span className="font-semibold">2.3 days</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewWriterDashboard;