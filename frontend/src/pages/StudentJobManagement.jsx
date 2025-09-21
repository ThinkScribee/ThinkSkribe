import React from 'react';
import { Layout, Typography } from 'antd';
import HeaderComponent from '../components/HeaderComponent.jsx';
import JobManagement from '../components/JobManagement.jsx';

const { Content } = Layout;
const { Title } = Typography;

const StudentJobManagement = () => {
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
            <JobManagement />
          </div>
        </Content>
      </Layout>
    </>
  );
};

export default StudentJobManagement;
