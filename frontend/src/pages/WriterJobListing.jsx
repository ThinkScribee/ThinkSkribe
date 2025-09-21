import React from 'react';
import { Layout, Typography } from 'antd';
import HeaderComponent from '../components/HeaderComponent.jsx';
import JobListing from '../components/JobListing.jsx';

const { Content } = Layout;
const { Title } = Typography;

const WriterJobListing = () => {
  return (
    <>
      <HeaderComponent />
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ 
          padding: window.innerWidth < 768 ? '16px' : '24px',
          paddingTop: window.innerWidth < 768 ? '16px' : '24px'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            width: '100%'
          }}>
            <JobListing />
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default WriterJobListing;
