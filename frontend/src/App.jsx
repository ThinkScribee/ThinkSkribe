import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ThinqScribeLanding from './pages/LandingPage.jsx';
import NewLandingPage from './pages/NewLandingPage.jsx';
import SignInPremium from './pages/SignInPremium.jsx';
import SignUpPremium from './pages/SignUpPremium.jsx';
import NewSignIn from './pages/NewSignIn.jsx';
import NewSignUp from './pages/NewSignUp.jsx';
import StudentChat from './pages/StudentChat';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ForgotPasswordNew from './pages/ForgotPasswordNew';
import ResetPasswordNew from './pages/ResetPasswordNew';
import StudentDashboard from './pages/StudentDashboard';
import WriterDashboard from './pages/WriterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import WriterChat from './pages/WriterChat';
import NotAuthorized from './pages/NotAuthorized';
import AgreementPage from './pages/AgreementPage';
import PaymentPage from './pages/PaymentPage';
import Dashboard from "./pages/DashBoard"
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailed from './pages/PaymentFailed';
import PaymentHistory from './pages/PaymentHistory';
import ProfileSettings from './pages/ProfileSettings';
import Search from './pages/Search';
import StudentWriterList from './pages/StudentWriterList';
import WriterProfile from './pages/WriterProfile';
import Notifications from './pages/Notifications';
import AboutUs from './pages/AboutUs';
import ContactSupport from './pages/ContactSupport';
import OurWriters from './pages/OurWriters';
import QualityPromise from './pages/QualityPromise';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ThesisWritingServices from './pages/ThesisWritingServices.jsx';
import DissertationWritingServices from './pages/DissertationWritingServices.jsx';
import ResearchPaperWritingServices from './pages/ResearchPaperWritingServices.jsx';
import TermPaperWritingServices from './pages/TermPaperWritingServices.jsx';
import SeminarWritingServices from './pages/SeminarWritingServices.jsx';
import ArticleCritiqueWritingServices from './pages/ArticleCritiqueWritingServices.jsx';
import QuestionnaireWritingServices from './pages/QuestionnaireWritingServices.jsx';
import GrammarChecker from './pages/GrammarChecker.jsx';
import CitationGenerator from './pages/CitationGenerator.jsx';
import PlagiarismDetector from './pages/PlagiarismDetector.jsx';
import WritingEnhancement from './pages/WritingEnhancement.jsx';
import StructureAnalyzer from './pages/StructureAnalyzer.jsx';
import EssayWritingServices from './pages/EssayWritingServices.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CallProvider } from './context/CallContext';
import { Typography } from 'antd';
import StudentAssignments from './pages/StudentAssignments';
import About from './pages/About.jsx'

import { message } from 'antd';
import { AppLoadingProvider } from './context/AppLoadingContext';
import AppLoader from './components/AppLoader';
import PaymentSuccess from './pages/PaymentSuccess';
import CreateAgreementWrapper from './pages/CreateAgreementWrapper.jsx';
import EnhancedPaymentPage from './pages/EnhancedPaymentPage.jsx';
import InfluencerDashboard from './pages/InfluencerDashboard.jsx';
import InfluencerDetails from './pages/InfluencerDetails.jsx';
import ExportChats from './pages/ExportChats.jsx';
import FooterComponent from './components/FooterComponent.jsx';
import MobileBottomTabs from './components/MobileBottomTabs.jsx';
import StudentJobManagement from './pages/StudentJobManagement.jsx';
import WriterJobListing from './pages/WriterJobListing.jsx';
const { Title, Text, Paragraph } = Typography;

// Configure Ant Design message
message.config({
  top: 100,
  duration: 3,
  maxCount: 3,
  rtl: false
});

// Inner component that can access auth context
const AppRoutes = () => {
  const { user } = useAuth();

  return (
            <>
              <Routes>
                {/* Public routes */}
                <Route path="/writers" element={
          <StudentWriterList />
    
      } />
                <Route path="/" element={<NewLandingPage />} />
                <Route path="/old-landing" element={<ThinqScribeLanding />} />
                <Route path="/signin" element={<NewSignIn />} />
                <Route path="/signup" element={<NewSignUp />} />
                <Route path="/old-signin" element={<SignInPremium />} />
                <Route path="/old-signup" element={<SignUpPremium />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/forgot-password" element={<ForgotPasswordNew />} />
                <Route path="/reset-password/:resetToken" element={<ResetPasswordNew />} />
                {/* Legacy routes for backward compatibility */}
                <Route path="/forgot-password-old" element={<ForgotPassword />} />
                <Route path="/reset-password-old/:token" element={<ResetPassword />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />
                <Route path="/about" element={<About />} />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="/contact-support" element={<ContactSupport />} />
                <Route path="/our-writers" element={<OurWriters />} />
                <Route path="/quality-promise" element={<QualityPromise />} />
                {/* SEO Services Pages */}
                <Route path="/essay-writing-services" element={<EssayWritingServices />} />
                <Route path="/thesis-writing-services" element={<ThesisWritingServices />} />
                <Route path="/dissertation-writing-services" element={<DissertationWritingServices />} />
                <Route path="/research-paper-writing-services" element={<ResearchPaperWritingServices />} />
                <Route path="/term-paper-writing-services" element={<TermPaperWritingServices />} />
                <Route path="/seminar-writing-services" element={<SeminarWritingServices />} />
                <Route path="/article-critique-writing-services" element={<ArticleCritiqueWritingServices />} />
                <Route path="/questionnaire-writing-services" element={<QuestionnaireWritingServices />} />
                {/* AI Tool Pages */}
                <Route path="/grammar-checker" element={<GrammarChecker />} />
                <Route path="/citation-generator" element={<CitationGenerator />} />
                <Route path="/plagiarism-detector" element={<PlagiarismDetector />} />
                <Route path="/writing-enhancement" element={<WritingEnhancement />} />
                <Route path="/structure-analyzer" element={<StructureAnalyzer />} />
                
                <Route path="/signup/ref/:referralCode" element={<NewSignUp />} />
            
            
                {/* Dashboard routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/student/dashboard" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                } />
      <Route path="/writer/dashboard" element={
        <ProtectedRoute allowedRoles={['writer']}>
          <WriterDashboard />
        </ProtectedRoute>
      } />
                
      

                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/influencers" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InfluencerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/influencers/:id" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InfluencerDetails />
                  </ProtectedRoute>
                } />
                <Route path="/admin/export-chats" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ExportChats />
                  </ProtectedRoute>
                } />
                
      {/* Job Management routes */}
      <Route path="/student/jobs" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentJobManagement />
        </ProtectedRoute>
      } />
      <Route path="/writer/jobs" element={
        <ProtectedRoute allowedRoles={['writer']}>
          <WriterJobListing />
        </ProtectedRoute>
      } />
                
      {/* Chat routes */}
      <Route path="/chat/student/:chatId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentChat />
        </ProtectedRoute>
      } />
      <Route path="/chat/writer/:chatId" element={
        <ProtectedRoute allowedRoles={['writer']}>
          <WriterChat />
        </ProtectedRoute>
      } />
      <Route path="/chat/writer" element={
        <ProtectedRoute allowedRoles={['writer']}>
          <WriterChat />
        </ProtectedRoute>
      } />
      <Route path="/chat/student" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentChat />
        </ProtectedRoute>
      } />
                
      
      {/* Search and assignment routes */}
      <Route path="/search" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Search />
        </ProtectedRoute>
      } />
    
      <Route path="/writers/:writerId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <WriterProfile />
        </ProtectedRoute>
      } />
                <Route path="/notifications" element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } />
      <Route path="/profile" element={
                  <ProtectedRoute>
          <ProfileSettings />
                  </ProtectedRoute>
                } />
      <Route path="/agreements/:agreementId" element={
                  <ProtectedRoute>
          <AgreementPage />
                  </ProtectedRoute>
                } />
                <Route path="/agreements/create" element={
                  <ProtectedRoute>
                    <CreateAgreementWrapper/>
                  </ProtectedRoute>
                } />
                <Route path="/payment/enhanced" element={
                  <ProtectedRoute>
                    <EnhancedPaymentPage/>
                  </ProtectedRoute>
                } />
      <Route path="/payment/:agreementId" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PaymentPage />
                  </ProtectedRoute>
                } />
      <Route path="/payment-success" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <PaymentSuccessPage />
                  </ProtectedRoute>
                } />
      <Route path="/payment-failed" element={
        <ProtectedRoute allowedRoles={['student']}>
                    <PaymentFailed />
                  </ProtectedRoute>
                } />
                <Route path="/assignments" element={
        <ProtectedRoute allowedRoles={['student']}>
                    <StudentAssignments />
                  </ProtectedRoute>
                } />
                <Route path="/payments/history" element={
                  <ProtectedRoute allowedRoles={['writer']}>
                    <PaymentHistory/>
                  </ProtectedRoute>
                } />
              
                {/* Payment Routes - Must be before agreement routes */}
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentSuccess />} />
                <Route path="/payment/error" element={<PaymentSuccess />} />
                <Route path="/payment/cancelled" element={<PaymentSuccess />} />
                <Route path="/payment/callback" element={<PaymentSuccess />} />

              </Routes>
              <MobileBottomTabs />
            </>
  );
};

// Component to conditionally render footer based on current route
const ConditionalFooter = () => {
  const location = useLocation();
  
  // Define unprotected routes where footer should be shown
  const unprotectedRoutes = [
    '/',
    '/terms',
    '/privacy',
    '/forgot-password',
    '/reset-password',
    '/not-authorized',
    '/about',
    '/about-us',
    '/contact-support',
    '/our-writers',
    '/quality-promise',
    '/essay-writing-services',
    '/thesis-writing-services',
    '/dissertation-writing-services',
    '/research-paper-writing-services',
    '/term-paper-writing-services',
    '/seminar-writing-services',
    '/article-critique-writing-services',
    '/questionnaire-writing-services',
    '/grammar-checker',
    '/citation-generator',
    '/plagiarism-detector',
    '/writing-enhancement',
    '/structure-analyzer'
  ];
  
  // Check if current route is unprotected
  const isUnprotectedRoute = unprotectedRoutes.includes(location.pathname) || 
                            location.pathname.startsWith('/signup/ref/');
  
  return isUnprotectedRoute ? <FooterComponent /> : null;
};

function App() {
  // Note: Global CSS variables are now defined in index.css
  // Removing dynamic styles to prevent conflicts
  
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            style: {
              background: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <CurrencyProvider>
              <CallProvider>
                <AppLoadingProvider>
                  <>
                    <AppRoutes />
                    <ConditionalFooter />
                  </>
                </AppLoadingProvider>
              </CallProvider>
            </CurrencyProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;