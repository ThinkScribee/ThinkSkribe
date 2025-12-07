import React from 'react';
import { Typography, Layout, Breadcrumb, Card, Row, Col, Space, Divider } from 'antd';
import { Link } from 'react-router-dom';
import { FileTextOutlined, UserOutlined, SafetyOutlined, DollarOutlined, ExclamationCircleOutlined, PhoneOutlined } from '@ant-design/icons';
import HeaderComponent from '../components/HeaderComponent';
import './Terms.css';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

const Terms = () => {
  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <HeaderComponent />
      <Content style={{ padding: '0', marginTop: '64px' }}>
        {/* Simple Header */}
        <div style={{
          background: '#f8fafc',
          padding: '40px 0',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Row justify="center">
              <Col xs={24} md={20} lg={16}>
                <div style={{ textAlign: 'center' }}>
                  <Title 
                    level={1} 
                    style={{ 
                      color: '#1e293b',
                      fontSize: 'clamp(28px, 5vw, 36px)',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}
                  >
                    Terms of Service
                  </Title>
                  <Text style={{ 
                    color: '#64748b',
                    fontSize: '16px'
                  }}>
                    Last Updated: {new Date().toLocaleDateString()}
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ background: 'white', padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Breadcrumb>
              <Breadcrumb.Item><Link to="/" style={{ color: '#1e3a8a' }}>Home</Link></Breadcrumb.Item>
              <Breadcrumb.Item style={{ color: '#64748b' }}>Terms of Service</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>
        
        {/* Content */}
        <div style={{ padding: '80px 0' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <Row justify="center">
              <Col xs={24} lg={20}>
                <Card 
                  style={{ 
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                    border: 'none'
                  }}
                >
                  <div style={{ padding: '40px' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {/* Introduction */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FileTextOutlined style={{ color: 'white', fontSize: '20px' }} />
                          </div>
                          <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                            1. Introduction
                          </Title>
                        </div>
                        <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7' }}>
                          Welcome to ThinqScribe. These Terms of Service ("Terms") govern your use of our website, services, and applications (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Service.
                        </Paragraph>
                      </div>

                      <Divider style={{ margin: '32px 0' }} />
                      
                      {/* Definitions */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <UserOutlined style={{ color: 'white', fontSize: '20px' }} />
                          </div>
                          <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                            2. Definitions
                          </Title>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '12px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                              <Text strong style={{ color: '#1e293b' }}>"Service"</Text> refers to the ThinqScribe platform, website, and all related services.
                            </li>
                            <li style={{ marginBottom: '12px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                              <Text strong style={{ color: '#1e293b' }}>"User"</Text> refers to individuals who register for an account on our Service.
                            </li>
                            <li style={{ marginBottom: '12px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                              <Text strong style={{ color: '#1e293b' }}>"Writer"</Text> refers to individuals who provide academic writing services through our platform.
                            </li>
                            <li style={{ marginBottom: '12px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                              <Text strong style={{ color: '#1e293b' }}>"Student"</Text> refers to individuals who seek academic assistance through our platform.
                            </li>
                            <li style={{ marginBottom: '0', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>
                              <Text strong style={{ color: '#1e293b' }}>"Content"</Text> refers to text, images, videos, documents, and other materials that are uploaded, posted, or shared on our Service.
                            </li>
                          </ul>
                        </div>
                      </div>
                      <Divider style={{ margin: '32px 0' }} />
                      
                      {/* User Accounts */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <UserOutlined style={{ color: 'white', fontSize: '20px' }} />
                          </div>
                          <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                            3. User Accounts
                          </Title>
                        </div>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              3.1 Registration
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              To use certain features of our Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                            </Paragraph>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              3.2 Account Security
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your account.
                            </Paragraph>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              3.3 Account Termination
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties, or for any other reason.
                            </Paragraph>
                          </div>
                        </Space>
                      </div>

                      <Divider style={{ margin: '32px 0' }} />
                      
                      {/* Acceptable Use */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <SafetyOutlined style={{ color: 'white', fontSize: '20px' }} />
                          </div>
                          <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                            4. Acceptable Use
                          </Title>
                        </div>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              4.1 Compliance with Laws
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', marginBottom: '16px' }}>
                              You agree to use our Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
                            </Paragraph>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                              <li style={{ marginBottom: '8px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                              <li style={{ marginBottom: '8px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>To engage in any conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
                              <li style={{ marginBottom: '8px', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>To impersonate or attempt to impersonate another user or any other person or entity.</li>
                              <li style={{ marginBottom: '0', color: '#64748b', fontSize: '16px', lineHeight: '1.6' }}>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm us or users of the Service.</li>
                            </ul>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              4.2 Academic Integrity
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              Our Service is designed to provide academic assistance and support. Users are expected to use the Service in accordance with their institution's academic integrity policies. The content provided through our Service is intended for reference and learning purposes only.
                            </Paragraph>
                          </div>
                        </Space>
                      </div>

                      <Divider style={{ margin: '32px 0' }} />
                      
                      {/* Payment Terms */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <DollarOutlined style={{ color: 'white', fontSize: '20px' }} />
                          </div>
                          <Title level={2} style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
                            5. Payment Terms
                          </Title>
                        </div>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              5.1 Fees
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              Some aspects of the Service may be provided for a fee. You agree to pay all fees in accordance with the pricing and payment terms presented to you for such services.
                            </Paragraph>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              5.2 Billing
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              We use third-party payment processors to bill you through a payment account linked to your account on the Service. Payment processing services may be subject to separate terms and conditions provided by our payment processors.
                            </Paragraph>
                          </div>
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <Title level={4} style={{ color: '#374151', fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
                              5.3 Refunds
                            </Title>
                            <Paragraph style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', margin: 0 }}>
                              Refunds may be issued in accordance with our Refund Policy, which is incorporated by reference into these Terms.
                            </Paragraph>
                          </div>
                        </Space>
                      </div>

                      <Divider style={{ margin: '32px 0' }} />

                      {/* Contact Section */}
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        padding: '32px',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <PhoneOutlined style={{ color: 'white', fontSize: '20px' }} />
                          </div>
                          <Title level={3} style={{ color: '#1e293b', margin: 0 }}>
                            Questions About Our Terms?
                          </Title>
                        </div>
                        <Paragraph style={{ color: '#64748b', fontSize: '16px', marginBottom: '24px' }}>
                          If you have any questions about these Terms of Service, please contact us at support@thinkscribe.com
                        </Paragraph>
                        <div style={{ 
                          background: 'white',
                          padding: '16px 24px',
                          borderRadius: '12px',
                          display: 'inline-block'
                        }}>
                          <Text style={{ 
                            color: '#1e3a8a',
                            fontSize: '16px',
                            fontWeight: '600'
                          }}>
                            support@thinkscribe.com
                          </Text>
                        </div>
                      </div>
                    </Space>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Terms; 