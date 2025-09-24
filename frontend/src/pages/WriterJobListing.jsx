import React from 'react';
import { Layout, Typography } from 'antd';
import HeaderComponent from '../components/HeaderComponent.jsx';
import JobListing from '../components/JobListing.jsx';
import MobileBottomTabs from '../components/MobileBottomTabs.jsx';

const { Content } = Layout;
const { Title } = Typography;

const WriterJobListing = () => {
  return (
    <>
      <HeaderComponent />
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ 
          padding: window.innerWidth < 768 ? '8px' : '24px',
          paddingTop: window.innerWidth < 768 ? '8px' : '24px',
          paddingBottom: window.innerWidth < 768 ? '88px' : '24px',
          background: '#f5f5f5',
          minHeight: '100vh',
          overflow: 'hidden'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            width: '100%',
            padding: window.innerWidth < 768 ? '0' : '0',
            overflow: 'hidden'
          }}>
            <JobListing />
          </div>
        </Content>
      </Layout>
      <MobileBottomTabs />
    </>
  );
};

export default WriterJobListing;
