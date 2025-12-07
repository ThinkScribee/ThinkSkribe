// src/components/StudentWriterList.jsx

import React, { useEffect, useState } from 'react';
import './StudentWriterList.css';
import { 
  Card, 
  Avatar, 
  Spin, 
  Alert, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Rate, 
  Tag, 
  Badge,
  Pagination,
  Select,
  Input,
  Divider,
  Tooltip,
  Statistic,
  Layout,
  Grid
} from 'antd';
import { 
  MessageOutlined, 
  StarOutlined, 
  BookOutlined, 
  ClockCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  WhatsAppOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import HeaderComponent from '../components/HeaderComponent';
import { getRecommendedWriters } from '../api/user';
import { startChat } from '../api/chat';
import { PREDEFINED_SPECIALTIES } from '../utils/specialties';
import { useWriterStore } from '../store/writerStore';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Option } = Select;

// Placeholder writers with WhatsApp numbers
const PLACEHOLDER_WRITERS = [
  {
    _id: 'writer1',
    name: 'Scribe1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scribe1',
    rating: 4.9,
    reviewCount: 127,
    projectsCompleted: 89,
    responseTime: 0.3,
    isOnline: true,
    verified: true,
    whatsappNumber: '+2347041282517',
    writerProfile: {
      bio: 'PhD in Literature with 8+ years of academic writing experience. Specializing in research papers, dissertations, and literary analysis.',
      specialties: ['Literature', 'Research Papers', 'Dissertations', 'Academic Writing']
    }
  },
  {
    _id: 'writer2',
    name: 'Scribe2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scribe2',
    rating: 4.8,
    reviewCount: 95,
    projectsCompleted: 76,
    responseTime: 0.3,
    isOnline: true,
    verified: true,
    whatsappNumber: '+2349095368912',
    writerProfile: {
      bio: 'Computer Science professor and expert in technical writing. Helping students excel in STEM subjects and programming assignments.',
      specialties: ['Computer Science', 'Programming', 'Technical Writing', 'Mathematics']
    }
  },
  {
    _id: 'writer3',
    name: 'Scribe3',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scribe3',
    rating: 4.9,
    reviewCount: 143,
    projectsCompleted: 112,
    responseTime: 0.3,
    isOnline: true,
    verified: true,
    whatsappNumber: '+2349032979532',
    writerProfile: {
      bio: 'Psychology PhD with expertise in behavioral research and statistical analysis. Passionate about helping students succeed.',
      specialties: ['Psychology', 'Statistics', 'Research Methods', 'Data Analysis']
    }
  },
  {
    _id: 'writer4',
    name: 'Scribe4',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scribe4',
    rating: 4.7,
    reviewCount: 82,
    projectsCompleted: 64,
    responseTime: 0.3,
    isOnline: true,
    verified: true,
    whatsappNumber: '+2349050035785',
    writerProfile: {
      bio: 'Business Administration expert with MBA and 10+ years in corporate consulting. Specializing in business cases and reports.',
      specialties: ['Business Administration', 'Marketing', 'Finance', 'Management']
    }
  },
  {
    _id: 'writer5',
    name: 'Scribe5',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scribe5',
    rating: 4.8,
    reviewCount: 108,
    projectsCompleted: 91,
    responseTime: 0.3,
    isOnline: true,
    verified: true,
    whatsappNumber: '+2347041282517',
    writerProfile: {
      bio: 'Medical researcher and healthcare professional. Expert in medical writing, nursing papers, and healthcare case studies.',
      specialties: ['Medicine', 'Nursing', 'Healthcare', 'Medical Research']
    }
  },
  {
    _id: 'writer6',
    name: 'Scribe6',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scribe6',
    rating: 4.6,
    reviewCount: 67,
    projectsCompleted: 52,
    responseTime: 0.3,
    isOnline: true,
    verified: true,
    whatsappNumber: '+2349095368912',
    writerProfile: {
      bio: 'History professor with expertise in historical analysis and research. Helping students with essays, research papers, and thesis work.',
      specialties: ['History', 'Political Science', 'Social Studies', 'Research']
    }
  }
];

const StudentWriterList = () => {
  const location = useLocation();
  const [writers, setWriters] = useState(PLACEHOLDER_WRITERS);
  const [filteredWriters, setFilteredWriters] = useState(PLACEHOLDER_WRITERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const navigate = useNavigate();
  const { processWriterData, updateWriterProfileData } = useWriterStore();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  

  // Initialize with placeholder data
  useEffect(() => {
    setWriters(PLACEHOLDER_WRITERS);
    setFilteredWriters(PLACEHOLDER_WRITERS);
  }, []);

  // Track referral visits to /writers when ?ref=CODE is present
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const ref = params.get('ref');
      if (!ref) return;

      const referralCode = ref.toUpperCase();

      // Save for later signup if user proceeds
      localStorage.setItem('pending_referral_code', referralCode);

      // Avoid duplicate tracking in a session
      const sessionKey = `ref_visit_tracked_writers_${referralCode}`;
      if (sessionStorage.getItem(sessionKey)) return;

      // Lazy import to avoid cyclic deps
      import('../api/influencer').then(({ influencerApi }) => {
        influencerApi.trackReferralVisit(referralCode, 'writers');
        sessionStorage.setItem(sessionKey, '1');
      }).catch(() => {
        // no-op on failure
      });
    } catch (e) {
      // no-op
    }
  }, [location.search]);

  // Note: Real-time updates removed for public access
  // Socket functionality requires authentication

  useEffect(() => {
    const fullTitle = "Connect with Expert Academic Writers";
    let i = 0;
    
    const typingInterval = setInterval(() => {
      if (i < fullTitle.length) {
        setTitle(fullTitle.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setTypingComplete(true);
      }
    }, 80);

    return () => clearInterval(typingInterval);
  }, []);

  // Filter and sort writers
  useEffect(() => {
    let filtered = (writers || []).filter(writer => {
      const matchesSearch = writer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (writer.writerProfile?.specialties || []).some(spec => 
                             spec.toLowerCase().includes(searchTerm.toLowerCase())
                           );
      
      const matchesSpecialty = selectedSpecialty === 'all' ||
                              (writer.writerProfile?.specialties || []).includes(selectedSpecialty);
      
      return matchesSearch && matchesSpecialty;
    });

    // Sort writers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'online':
          // Online writers first, then by rating
          if (a.isOnline !== b.isOnline) {
            return b.isOnline ? 1 : -1;
          }
          return (b.rating || 0) - (a.rating || 0);
        case 'rating':
          // First priority: Online status (online writers come first)
          if (a.isOnline !== b.isOnline) {
            return b.isOnline ? 1 : -1;
          }
          return (b.rating || 0) - (a.rating || 0);
        case 'projects':
          // First priority: Online status (online writers come first)
          if (a.isOnline !== b.isOnline) {
            return b.isOnline ? 1 : -1;
          }
          return (b.projectsCompleted || 0) - (a.projectsCompleted || 0);
        case 'response':
          // First priority: Online status (online writers come first)
          if (a.isOnline !== b.isOnline) {
            return b.isOnline ? 1 : -1;
          }
          return (a.responseTime || 0) - (b.responseTime || 0);
        case 'name':
          // First priority: Online status (online writers come first)
          if (a.isOnline !== b.isOnline) {
            return b.isOnline ? 1 : -1;
          }
          return (a.name || '').localeCompare(b.name || '');
        default:
          // Default: Online writers first, then by rating
          if (a.isOnline !== b.isOnline) {
            return b.isOnline ? 1 : -1;
          }
          return (b.rating || 0) - (a.rating || 0);
      }
    });

    setFilteredWriters(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [writers, searchTerm, selectedSpecialty, sortBy]);

  const handleWhatsAppChat = (whatsappNumber, writerName) => {
    const message = encodeURIComponent(`Hi ${writerName}, I found your profile on ThinqScribe and I'm interested in your academic writing services. Could you please help me with my project?`);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Get unique specialties for filter
  const specialties = [...new Set(
    (writers || []).flatMap(writer => (writer.writerProfile?.specialties || []))
  )];

  // Pagination
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentWriters = filteredWriters.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <HeaderComponent />
        <Content style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', fontSize: '16px', color: '#6b7280' }}>
              Loading writers...
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <HeaderComponent />
        <Content style={{ padding: '40px 20px' }}>
          <div style={{ maxWidth: '600px', margin: '40px auto' }}>
            <Alert
              message="Unable to Load Writers"
              description={error}
              type="error"
              showIcon
              style={{ borderRadius: '8px' }}
            />
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <HeaderComponent />
      <Content>
        {/* Professional Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          padding: isMobile ? '40px 0' : '100px 0',
          color: 'white',
          position: 'relative'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Title 
                  level={1} 
                  style={{ 
                    color: 'white',
                    fontSize: isMobile ? '32px' : '48px',
                    fontWeight: '800',
                    marginBottom: '24px',
                    lineHeight: 1.2
                  }}
                >
                  Connect with Expert Academic Writers
                </Title>
                <Paragraph style={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: isMobile ? '18px' : '22px',
                  marginBottom: '40px',
                  lineHeight: 1.6,
                  fontWeight: '400'
                }}>
                  Get instant access to professional writers who specialize in your field. 
                  Chat directly via WhatsApp and get your academic projects completed with excellence.
                </Paragraph>
                
                {/* Clean Stats */}
                <Row gutter={[32, 16]} justify="center">
                  <Col xs={8} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: isMobile ? '28px' : '36px', 
                        fontWeight: '800', 
                        color: 'white',
                        marginBottom: '8px'
                      }}>
                        {writers.length}+
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '14px' : '16px', 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: '500'
                      }}>
                        Expert Writers
                      </div>
                    </div>
                  </Col>
                  <Col xs={8} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: isMobile ? '28px' : '36px', 
                        fontWeight: '800', 
                        color: 'white',
                        marginBottom: '8px'
                      }}>
                        4.8★
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '14px' : '16px', 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: '500'
                      }}>
                        Average Rating
                      </div>
                    </div>
                  </Col>
                  <Col xs={8} sm={6}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: isMobile ? '28px' : '36px', 
                        fontWeight: '800', 
                        color: 'white',
                        marginBottom: '8px'
                      }}>
                        24/7
                      </div>
                      <div style={{ 
                        fontSize: isMobile ? '14px' : '16px', 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: '500'
                      }}>
                        Support
                      </div>
                    </div>
                  </Col>
                </Row>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Clean Filters Section */}
        <div style={{ 
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: isMobile ? '16px 0' : '32px 0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8} md={8}>
                <Input
                  placeholder="Search writers..."
                  prefix={<SearchOutlined style={{ color: '#6b7280' }} />}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ 
                    borderRadius: '8px',
                    height: '44px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px'
                  }}
                />
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Select
                  placeholder="Filter by expertise"
                  value={selectedSpecialty}
                  onChange={setSelectedSpecialty}
                  style={{ 
                    width: '100%', 
                    fontSize: '14px'
                  }}
                  size="middle"
                >
                  <Option value="all">All Specialties</Option>
                  {specialties.map(specialty => (
                    <Option key={specialty} value={specialty}>{specialty}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={8} md={8}>
                <Select
                  placeholder="Sort by"
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ 
                    width: '100%', 
                    fontSize: '14px'
                  }}
                  size="middle"
                >
                  <Option value="online">Online First</Option>
                  <Option value="rating">Highest Rated</Option>
                  <Option value="projects">Most Projects</Option>
                  <Option value="response">Fastest Response</Option>
                  <Option value="name">Name (A-Z)</Option>
                </Select>
              </Col>
            </Row>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '16px',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {filteredWriters.length} writers available
            </div>
          </div>
        </div>

        {/* Writers List */}
        <div style={{ padding: isMobile ? '20px 0' : '40px 0', background: '#f9fafb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px' }}>
            {currentWriters.length > 0 ? (
              <>
                <div style={{ 
                  background: 'white', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb'
                }}>
                  {currentWriters.map((writer, index) => (
                    <div 
                      key={writer._id}
                      style={{
                        padding: isMobile ? '16px' : '24px',
                        borderBottom: index < currentWriters.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      {isMobile ? (
                        // Mobile Layout - Vertical Stack
                        <div>
                          {/* Header with Avatar and Name */}
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ position: 'relative' }}>
                              {writer.isOnline && (
                                <div style={{
                                  position: 'absolute',
                                  top: '0px',
                                  right: '0px',
                                  width: '14px',
                                  height: '14px',
                                  backgroundColor: '#22c55e',
                                  borderRadius: '50%',
                                  border: '3px solid white',
                                  zIndex: 2
                                }}></div>
                              )}
                              <Avatar
                                size={64}
                                src={writer.avatar}
                                style={{
                                  backgroundColor: '#015382',
                                  border: '3px solid #f8fafc'
                                }}
                              />
                              {writer.verified && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-2px',
                                  right: '-2px',
                                  backgroundColor: '#3b82f6',
                                  borderRadius: '50%',
                                  width: '22px',
                                  height: '22px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '3px solid white'
                                }}>
                                  <CheckCircleOutlined style={{ color: 'white', fontSize: '11px' }} />
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <Title level={5} style={{ 
                                  margin: 0, 
                                  fontSize: '18px',
                                  color: '#1f2937',
                                  fontWeight: '700'
                                }}>
                                  {writer.name}
                                </Title>
                                <div style={{
                                  backgroundColor: writer.isOnline ? '#dcfce7' : '#f3f4f6',
                                  color: writer.isOnline ? '#166534' : '#6b7280',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  {writer.isOnline ? 'Online' : 'Away'}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <Rate 
                                  disabled 
                                  value={writer.rating || 0} 
                                  style={{ fontSize: '14px' }}
                                />
                                <Text style={{ 
                                  fontSize: '14px', 
                                  color: '#6b7280',
                                  fontWeight: '600'
                                }}>
                                  {writer.rating ? writer.rating.toFixed(1) : 'New'}
                                </Text>
                              </div>
                              <Text style={{ 
                                fontSize: '13px', 
                                color: '#9ca3af'
                              }}>
                                {writer.reviewCount || 0} reviews • {writer.projectsCompleted > 0 ? `${writer.projectsCompleted}+ projects` : 'New writer'}
                              </Text>
                            </div>
                          </div>

                          {/* Bio */}
                          <div style={{ marginBottom: '16px' }}>
                            <Text style={{ 
                              fontSize: '14px', 
                              color: '#4b5563',
                              lineHeight: '1.6',
                              display: 'block'
                            }}>
                              {writer.writerProfile?.bio ? (
                                (writer.writerProfile.bio.length > 120
                                  ? `${writer.writerProfile.bio.substring(0, 120)}...`
                                  : writer.writerProfile.bio
                                )
                              ) : (
                                'Experienced academic writer ready to help with your projects.'
                              )}
                            </Text>
                          </div>

                          {/* Specialties */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {(writer.writerProfile?.specialties || []).slice(0, 4).map((specialty, idx) => (
                                <span 
                                  key={idx} 
                                  style={{ 
                                    fontSize: '12px', 
                                    backgroundColor: '#eff6ff',
                                    color: '#1e40af',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    fontWeight: '500',
                                    border: '1px solid #dbeafe'
                                  }}
                                >
                                  {specialty}
                                </span>
                              ))}
                              {(writer.writerProfile?.specialties || []).length > 4 && (
                                <span style={{ 
                                  fontSize: '12px', 
                                  backgroundColor: '#f3f4f6',
                                  color: '#6b7280',
                                  padding: '6px 12px',
                                  borderRadius: '16px',
                                  fontWeight: '500'
                                }}>
                                  +{(writer.writerProfile?.specialties || []).length - 4}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats Row */}
                          <div style={{ 
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '12px',
                            padding: '16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '12px',
                            marginBottom: '16px'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: '700', 
                                color: '#015382',
                                marginBottom: '4px'
                              }}>
                                {writer.projectsCompleted > 0 ? `${writer.projectsCompleted}+` : 'New'}
                              </div>
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Projects
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: '700', 
                                color: writer.responseTime <= 4 ? '#059669' : '#d97706',
                                marginBottom: '4px'
                              }}>
                                {writer.responseTime <= 0.1 ? 'Instant' :
                                 writer.responseTime <= 0.5 ? 'Quick' :
                                 writer.responseTime <= 1 ? 'Fast' : 'Soon'
                                }
                              </div>
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Response
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ 
                                fontSize: '16px', 
                                fontWeight: '700', 
                                color: '#3b82f6',
                                marginBottom: '4px'
                              }}>
                                {writer.rating ? writer.rating.toFixed(1) : 'New'}
                              </div>
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#6b7280',
                                fontWeight: '500'
                              }}>
                                Rating
                              </div>
                            </div>
                          </div>

                          {/* WhatsApp Button */}
                          <Button
                            type="primary"
                            icon={<WhatsAppOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhatsAppChat(writer.whatsappNumber, writer.name);
                            }}
                            block
                            style={{
                              backgroundColor: '#25d366',
                              borderColor: '#25d366',
                              borderRadius: '12px',
                              height: '48px',
                              fontSize: '15px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            Chat on WhatsApp
                          </Button>
                        </div>
                      ) : (
                        // Desktop Layout - Horizontal
                        <Row gutter={[16, 16]} align="middle">
                          {/* Avatar and Basic Info */}
                          <Col xs={24} sm={8} md={6}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ position: 'relative' }}>
                                {writer.isOnline && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: '#22c55e',
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    zIndex: 2
                                  }}></div>
                                )}
                                <Avatar
                                  size={64}
                                  src={writer.avatar}
                                  style={{
                                    backgroundColor: '#015382',
                                    border: '2px solid #f8fafc'
                                  }}
                                />
                                {writer.verified && (
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    backgroundColor: '#3b82f6',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white'
                                  }}>
                                    <CheckCircleOutlined style={{ color: 'white', fontSize: '10px' }} />
                                  </div>
                                )}
                              </div>
                              <div>
                                <Title level={5} style={{ 
                                  margin: '0 0 4px 0', 
                                  fontSize: '18px',
                                  color: '#1f2937',
                                  fontWeight: '700'
                                }}>
                                  {writer.name}
                                </Title>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <Rate 
                                    disabled 
                                    value={writer.rating || 0} 
                                    style={{ fontSize: '12px' }}
                                  />
                                  <Text style={{ 
                                    fontSize: '12px', 
                                    color: '#6b7280',
                                    fontWeight: '500'
                                  }}>
                                    {writer.rating ? writer.rating.toFixed(1) : 'New'}
                                  </Text>
                                </div>
                                <Text style={{ 
                                  fontSize: '12px', 
                                  color: '#9ca3af'
                                }}>
                                  {writer.reviewCount || 0} reviews • {writer.projectsCompleted > 0 ? `${writer.projectsCompleted}+ projects` : 'New writer'}
                                </Text>
                              </div>
                            </div>
                          </Col>

                          {/* Bio and Specialties */}
                          <Col xs={24} sm={10} md={10}>
                            <div>
                              <Text style={{ 
                                fontSize: '14px', 
                                color: '#4b5563',
                                lineHeight: '1.5',
                                display: 'block',
                                marginBottom: '12px'
                              }}>
                                {writer.writerProfile?.bio ? (
                                  (writer.writerProfile.bio.length > 100
                                    ? `${writer.writerProfile.bio.substring(0, 100)}...`
                                    : writer.writerProfile.bio
                                  )
                                ) : (
                                  'Experienced academic writer ready to help with your projects.'
                                )}
                              </Text>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(writer.writerProfile?.specialties || []).slice(0, 3).map((specialty, idx) => (
                                  <span 
                                    key={idx} 
                                    style={{ 
                                      fontSize: '11px', 
                                      backgroundColor: '#eff6ff',
                                      color: '#1e40af',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                      fontWeight: '500',
                                      border: '1px solid #dbeafe'
                                    }}
                                  >
                                    {specialty}
                                  </span>
                                ))}
                                {(writer.writerProfile?.specialties || []).length > 3 && (
                                  <span style={{ 
                                    fontSize: '11px', 
                                    backgroundColor: '#f3f4f6',
                                    color: '#6b7280',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontWeight: '500'
                                  }}>
                                    +{(writer.writerProfile?.specialties || []).length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Col>

                          {/* Stats and Action */}
                          <Col xs={24} sm={6} md={8}>
                            <div style={{ textAlign: 'right' }}>
                              {/* Quick Stats */}
                              <div style={{ 
                                display: 'flex', 
                                gap: '16px', 
                                marginBottom: '16px',
                                justifyContent: 'flex-end'
                              }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    color: '#015382',
                                    marginBottom: '2px'
                                  }}>
                                    {writer.projectsCompleted > 0 ? `${writer.projectsCompleted}+` : 'New'}
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px', 
                                    color: '#6b7280',
                                    fontWeight: '500'
                                  }}>
                                    Projects
                                  </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    color: writer.responseTime <= 4 ? '#059669' : '#d97706',
                                    marginBottom: '2px'
                                  }}>
                                    {writer.responseTime <= 0.1 ? 'Instant' :
                                     writer.responseTime <= 0.5 ? 'Quick' :
                                     writer.responseTime <= 1 ? 'Fast' : 'Soon'
                                    }
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px', 
                                    color: '#6b7280',
                                    fontWeight: '500'
                                  }}>
                                    Response
                                  </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '700', 
                                    color: writer.isOnline ? '#059669' : '#6b7280',
                                    marginBottom: '2px'
                                  }}>
                                    {writer.isOnline ? 'Online' : 'Away'}
                                  </div>
                                  <div style={{ 
                                    fontSize: '10px', 
                                    color: '#6b7280',
                                    fontWeight: '500'
                                  }}>
                                    Status
                                  </div>
                                </div>
                              </div>

                              {/* WhatsApp Button */}
                              <Button
                                type="primary"
                                icon={<WhatsAppOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWhatsAppChat(writer.whatsappNumber, writer.name);
                                }}
                                style={{
                                  backgroundColor: '#25d366',
                                  borderColor: '#25d366',
                                  borderRadius: '8px',
                                  height: '36px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  minWidth: '140px'
                                }}
                              >
                                Chat on WhatsApp
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <Pagination
                    current={currentPage}
                    total={filteredWriters.length}
                    pageSize={pageSize}
                    onChange={setCurrentPage}
                    onShowSizeChange={(current, size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    showSizeChanger={!isMobile}
                    showQuickJumper={!isMobile}
                    showTotal={(total, range) => 
                      `${range[0]}-${range[1]} of ${total} writers`
                    }
                  />
                </div>
              </>
            ) : (
              // Empty State
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <UserOutlined style={{ fontSize: '64px', color: '#d1d5db', marginBottom: '20px' }} />
                <Title level={3} style={{ color: '#6b7280', marginBottom: '12px' }}>
                  No Writers Found
                </Title>
                <Text style={{ color: '#9ca3af', fontSize: '16px', marginBottom: '20px', display: 'block' }}>
                  Try adjusting your search criteria
                </Text>
                <Button 
                  type="primary"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedSpecialty('all');
                  }}
                  style={{
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6',
                    borderRadius: '8px',
                    height: '40px',
                    paddingInline: '24px'
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default StudentWriterList;