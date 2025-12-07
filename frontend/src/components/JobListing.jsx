import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Avatar,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Row,
  Col,
  Typography,
  Divider,
  Tooltip,
  Badge,
  Empty,
  Spin,
  Pagination,
  Modal,
  Form,
  InputNumber,
  message,
  Alert
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SendOutlined,
  StarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MessageOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { jobApi } from '../api/jobs.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';
import { startChat } from '../api/chat.js';
import './JobComponents.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const JobListing = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50, // Increased page size for writers to see more jobs
    total: 0
  });
  const [filters, setFilters] = useState({
    jobType: '',
    academicLevel: '',
    minBudget: '',
    maxBudget: '',
    search: ''
  });
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyForm] = Form.useForm();
  const [applying, setApplying] = useState(false);
  
  const { user } = useAuth();
  const { socket } = useNotifications();
  const navigate = useNavigate();

  // Load jobs
  const loadJobs = async (page = 1, newFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.pageSize,
        ...newFilters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await jobApi.getJobs(params);
      
      // Handle response structure - now with pagination preserved by interceptor
      if (response && response.data && response.pagination) {
        setJobs(response.data);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.pagination.total
        }));
      } else if (Array.isArray(response)) {
        // Fallback if interceptor returns just array
        setJobs(response);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: response.length
        }));
      } else {
        // Fallback for unexpected structure
        setJobs([]);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: 0
        }));
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      message.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  // Load jobs on component mount and when filters change
  useEffect(() => {
    loadJobs(1, filters);
  }, [filters]);

  // Handle search
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination change
  const handlePageChange = (page) => {
    loadJobs(page);
  };

  // Handle job view
  const handleJobView = async (job) => {
    try {
      // Track job view via socket
      if (socket) {
        socket.emit('jobViewed', {
          jobId: job._id,
          userId: user._id
        });
      }
    } catch (error) {
      console.error('Error tracking job view:', error);
    }
  };

  // Handle apply for job
  const handleApply = (job) => {
    setSelectedJob(job);
    setApplyModalVisible(true);
    applyForm.resetFields();
  };

  // Handle application submission
  const handleApplicationSubmit = async (values) => {
    if (!selectedJob) return;

    setApplying(true);
    try {
      const applicationData = {
        message: values.message,
        proposedAmount: values.proposedAmount,
        estimatedTime: values.estimatedTime
      };

      await jobApi.applyForJob(selectedJob._id, applicationData);
      
      // Emit real-time event
      if (socket) {
        socket.emit('jobApplicationSubmitted', {
          jobId: selectedJob._id,
          writerId: user._id,
          writerName: user.name,
          jobTitle: selectedJob.title
        });
      }

      message.success('Application submitted successfully!');
      setApplyModalVisible(false);
      setSelectedJob(null);
      
      // Reload jobs to update application status
      loadJobs(pagination.current);
    } catch (error) {
      console.error('Error applying for job:', error);
      message.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  // Handle direct chat access
  const handleChatWithStudent = async (job) => {
    if (!job.postedBy || !job.postedBy._id) {
      message.error('Student information not available');
      return;
    }
    
    try {
      // Start or find chat with the student
      const chat = await startChat(job.postedBy._id);
      if (chat && chat._id) {
        navigate(`/chat/writer/${chat._id}`);
      } else {
        message.error('Failed to start chat with student');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      message.error('Failed to start chat with student');
    }
  };

  // Get urgency color
  const getUrgencyColor = (deadline) => {
    const urgency = jobApi.getUrgencyLevel(deadline);
    return jobApi.getUrgencyColor(urgency);
  };

  // Check if user can apply
  const canApply = (job) => {
    return jobApi.canApplyForJob(job, user);
  };

  // Get user's application status
  const getApplicationStatus = (job) => {
    const application = jobApi.getUserApplication(job, user._id);
    if (!application) return null;
    
    return (
      <Tag color={application.status === 'accepted' ? 'green' : application.status === 'rejected' ? 'red' : 'blue'}>
        {application.status === 'accepted' ? 'Accepted' : 
         application.status === 'rejected' ? 'Rejected' : 'Pending'}
      </Tag>
    );
  };

  // Render job card
  const renderJobCard = (job) => {
    const timeRemaining = jobApi.getTimeRemaining(job.deadline);
    const urgencyColor = getUrgencyColor(job.deadline);
    const canUserApply = canApply(job);
    const applicationStatus = getApplicationStatus(job);

    return (
      <Card
        key={job._id}
        hoverable
        style={{ 
          marginBottom: 20,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%'
        }}
        className="job-card job-card-mobile"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
        }}
        actions={[
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleJobView(job)}
              size={window.innerWidth < 768 ? 'small' : 'middle'}
              style={{ 
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                height: window.innerWidth < 768 ? '32px' : 'auto',
                width: window.innerWidth < 768 ? '100%' : 'auto'
              }}
            >
              View
            </Button>
          </Tooltip>,
          <Tooltip title="Chat with Student">
            <Button
              type="text"
              icon={<MessageOutlined />}
              onClick={() => handleChatWithStudent(job)}
              size={window.innerWidth < 768 ? 'small' : 'middle'}
              style={{ 
                color: '#52c41a',
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                height: window.innerWidth < 768 ? '32px' : 'auto',
                width: window.innerWidth < 768 ? '100%' : 'auto'
              }}
            >
              Chat
            </Button>
          </Tooltip>,
          canUserApply ? (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleApply(job)}
              size={window.innerWidth < 768 ? 'small' : 'middle'}
              style={{ 
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                height: window.innerWidth < 768 ? '32px' : 'auto',
                width: window.innerWidth < 768 ? '100%' : 'auto'
              }}
            >
              Apply
            </Button>
          ) : applicationStatus || (
            <Button 
              disabled
              size={window.innerWidth < 768 ? 'small' : 'middle'}
              style={{ 
                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                height: window.innerWidth < 768 ? '32px' : 'auto',
                width: window.innerWidth < 768 ? '100%' : 'auto'
              }}
            >
              {job.status !== 'open' ? 'Closed' : 'Already Applied'}
            </Button>
          )
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={<UserOutlined />}
              src={job.postedBy?.avatar}
            />
          }
          title={
            <Space>
              <Text strong>{job.title}</Text>
              {applicationStatus}
            </Space>
          }
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph 
                ellipsis={{ 
                  rows: window.innerWidth < 768 ? 2 : 2,
                  expandable: false,
                  symbol: '...'
                }}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'normal',
                  lineHeight: '1.4',
                  fontSize: window.innerWidth < 768 ? '13px' : '14px'
                }}
              >
                {job.description}
              </Paragraph>
              
              <Space wrap className="job-tags" style={{ marginBottom: '8px' }}>
                <Tag color="blue" style={{ fontSize: window.innerWidth < 768 ? '11px' : '12px', margin: '2px' }}>
                  {jobApi.getJobTypeDisplayName(job.jobType)}
                </Tag>
                <Tag color="green" style={{ fontSize: window.innerWidth < 768 ? '11px' : '12px', margin: '2px' }}>
                  {jobApi.getAcademicLevelDisplayName(job.academicLevel)}
                </Tag>
                <Tag color="blue" style={{ fontSize: window.innerWidth < 768 ? '11px' : '12px', margin: '2px' }}>
                  {job.subject}
                </Tag>
                <Tag color="orange" style={{ fontSize: window.innerWidth < 768 ? '11px' : '12px', margin: '2px' }}>
                  {job.priority}
                </Tag>
              </Space>

              <Row gutter={window.innerWidth < 768 ? 8 : 16}>
                <Col span={window.innerWidth < 768 ? 12 : 8}>
                  <Space size="small">
                    <DollarOutlined style={{ color: '#52c41a', fontSize: window.innerWidth < 768 ? '12px' : '14px' }} />
                    <Text strong style={{ 
                      color: '#52c41a',
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      wordBreak: 'break-word'
                    }}>
                      {jobApi.formatJobBudget(job.budget.amount, job.budget.currency)}
                    </Text>
                  </Space>
                </Col>
                <Col span={window.innerWidth < 768 ? 12 : 8}>
                  <Space size="small">
                    <CalendarOutlined style={{ color: urgencyColor, fontSize: window.innerWidth < 768 ? '12px' : '14px' }} />
                    <Text style={{ 
                      color: urgencyColor,
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      wordBreak: 'break-word'
                    }}>
                      {timeRemaining}
                    </Text>
                  </Space>
                </Col>
                <Col span={window.innerWidth < 768 ? 24 : 8} style={{ marginTop: window.innerWidth < 768 ? '4px' : '0' }}>
                  <Space size="small">
                    <UserOutlined style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }} />
                    <Text style={{ 
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      wordBreak: 'break-word'
                    }}>
                      {job.postedBy?.name}
                    </Text>
                  </Space>
                </Col>
              </Row>

              <Row gutter={window.innerWidth < 768 ? 8 : 16} style={{ marginTop: '4px' }}>
                <Col span={window.innerWidth < 768 ? 12 : 12}>
                  <Space size="small">
                    <Badge count={job.applications?.length || 0} showZero size="small">
                      <Text type="secondary" style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>
                        Applications
                      </Text>
                    </Badge>
                  </Space>
                </Col>
                <Col span={window.innerWidth < 768 ? 12 : 12}>
                  <Space size="small">
                    <ClockCircleOutlined style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }} />
                    <Text type="secondary" style={{ 
                      fontSize: window.innerWidth < 768 ? '11px' : '13px',
                      wordBreak: 'break-word'
                    }}>
                      Posted {moment(job.createdAt).fromNow()}
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Space>
          }
        />
      </Card>
    );
  };

  return (
    <div className="mobile-bottom-tabs-visible">
      <div style={{ 
        marginBottom: 24,
        padding: window.innerWidth < 768 ? '16px' : '24px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}>
        <Title level={window.innerWidth < 768 ? 3 : 2} style={{ 
          margin: 0,
          background: 'linear-gradient(135deg, #015382 0%, #017DB0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700',
          textAlign: window.innerWidth < 768 ? 'center' : 'left'
        }}>
          <Space>
            <FileTextOutlined style={{ color: '#015382' }} />
            Available Jobs
          </Space>
        </Title>
      </div>

      {/* Search and Filters */}
      <Card 
        style={{ 
          marginBottom: 24,
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }} 
        className="job-filters"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Input
              placeholder="Search jobs..."
              allowClear
              suffix={<SearchOutlined onClick={() => handleSearch(filters.search)} style={{ cursor: 'pointer', color: '#1890ff' }} />}
              onPressEnter={(e) => handleSearch(e.target.value)}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              value={filters.search}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={4} xl={4}>
            <Select
              placeholder="Job Type"
              allowClear
              style={{ width: '100%' }}
              value={filters.jobType}
              onChange={(value) => handleFilterChange('jobType', value)}
            >
              <Option value="full-project">Full Project</Option>
              <Option value="it_Report">IT/SIWES Report</Option>
              <Option value="term-paper">Term Paper</Option>
              <Option value="chapter">Chapter</Option>
              <Option value="assignment">Assignment</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={4} xl={4}>
            <Select
              placeholder="Academic Level"
              allowClear
              style={{ width: '100%' }}
              value={filters.academicLevel}
              onChange={(value) => handleFilterChange('academicLevel', value)}
            >
              <Option value="undergraduate">Undergraduate</Option>
              <Option value="masters">Masters</Option>
              <Option value="phd">PhD</Option>
              <Option value="professional">Professional</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4} lg={4} xl={4}>
            <InputNumber
              placeholder="Min Budget"
              style={{ width: '100%' }}
              value={filters.minBudget}
              onChange={(value) => handleFilterChange('minBudget', value)}
              formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₦\s?|(,*)/g, '')}
            />
          </Col>
          <Col xs={12} sm={6} md={4} lg={4} xl={4}>
            <InputNumber
              placeholder="Max Budget"
              style={{ width: '100%' }}
              value={filters.maxBudget}
              onChange={(value) => handleFilterChange('maxBudget', value)}
              formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₦\s?|(,*)/g, '')}
            />
          </Col>
        </Row>
      </Card>

      {/* Jobs List */}
      <Spin spinning={loading}>
        {jobs.length === 0 ? (
          <Empty
            description="No jobs found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div>
            {jobs.map(renderJobCard)}
            
            {/* Pagination - Only show if there are many jobs */}
            {pagination.total > pagination.pageSize && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination
                  current={pagination.current}
                  total={pagination.total}
                  pageSize={pagination.pageSize}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    `${range[0]}-${range[1]} of ${total} jobs`
                  }
                />
              </div>
            )}
          </div>
        )}
      </Spin>

      {/* Application Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Apply for Job
          </Space>
        }
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedJob && (
          <div>
            <Alert
              message={`Applying for: ${selectedJob.title}`}
              description={
                <div>
                  <div>Budget: {jobApi.formatJobBudget(selectedJob.budget.amount, selectedJob.budget.currency)}</div>
                  <div style={{ marginTop: 8 }}>
                    <Button
                      type="link"
                      icon={<MessageOutlined />}
                      onClick={() => handleChatWithStudent(selectedJob)}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      Chat with {selectedJob.postedBy?.name} directly
                    </Button>
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={applyForm}
              layout="vertical"
              onFinish={handleApplicationSubmit}
            >
              <Form.Item
                name="message"
                label="Application Message"
                rules={[
                  { required: true, message: 'Please enter your application message' },
                  { max: 1000, message: 'Message cannot exceed 1000 characters' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Tell the client why you're the best fit for this job. Include your relevant experience, approach, and any questions you have..."
                  maxLength={1000}
                  showCount
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="proposedAmount"
                    label="Proposed Amount (Optional)"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Your proposed amount"
                      min={0}
                      formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/₦\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="estimatedTime"
                    label="Estimated Time (Optional)"
                  >
                    <Input placeholder="e.g., 3 days, 1 week" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setApplyModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={applying}>
                    Submit Application
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobListing;
