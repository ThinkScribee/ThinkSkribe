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
  message,
  Popconfirm,
  Table,
  Progress,
  Alert
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  MessageOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { jobApi } from '../api/jobs.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import JobPostingModal from './JobPostingModal.jsx';
import { useNavigate } from 'react-router-dom';
import { startChat } from '../api/chat.js';
import './JobComponents.css';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100, // Increased page size to show more jobs
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [postingModalVisible, setPostingModalVisible] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailsVisible, setJobDetailsVisible] = useState(false);
  
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

      const response = await jobApi.getMyJobs(params);
      
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

  // Handle job creation/update success
  const handleJobSuccess = (response) => {
    setPostingModalVisible(false);
    setEditingJob(null);
    loadJobs(pagination.current);
  };

  // Handle edit job
  const handleEditJob = (job) => {
    setEditingJob(job);
    setPostingModalVisible(true);
  };

  // Handle delete job
  const handleDeleteJob = async (jobId) => {
    try {
      await jobApi.deleteJob(jobId);
      message.success('Job deleted successfully!');
      loadJobs(pagination.current);
    } catch (error) {
      console.error('Error deleting job:', error);
      message.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  // Handle view job details
  const handleViewJob = async (job) => {
    setSelectedJob(job);
    setJobDetailsVisible(true);
  };

  // Handle accept application
  const handleAcceptApplication = async (jobId, applicationId) => {
    try {
      await jobApi.acceptApplication(jobId, applicationId);
      message.success('Application accepted successfully!');
      loadJobs(pagination.current);
    } catch (error) {
      console.error('Error accepting application:', error);
      message.error(error.response?.data?.message || 'Failed to accept application');
    }
  };

  // Handle chat with writer
  const handleChatWithWriter = async (writerId) => {
    if (!writerId) {
      message.error('Writer information not available');
      return;
    }
    
    try {
      // Start or find chat with the writer
      const chat = await startChat(writerId);
      if (chat && chat._id) {
        navigate(`/chat/student/${chat._id}`);
      } else {
        message.error('Failed to start chat with writer');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      message.error('Failed to start chat with writer');
    }
  };

  // Get urgency color
  const getUrgencyColor = (deadline) => {
    const urgency = jobApi.getUrgencyLevel(deadline);
    return jobApi.getUrgencyColor(urgency);
  };

  // Render job card
  const renderJobCard = (job) => {
    const timeRemaining = jobApi.getTimeRemaining(job.deadline);
    const urgencyColor = getUrgencyColor(job.deadline);
    const canEdit = jobApi.canEditJob(job, user);
    const canDelete = jobApi.canDeleteJob(job, user);

    return (
      <Card
        key={job._id}
        hoverable
        className="job-card job-card-mobile"
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
              onClick={() => handleViewJob(job)}
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
          canEdit && (
            <Tooltip title="Edit Job">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditJob(job)}
                size={window.innerWidth < 768 ? 'small' : 'middle'}
                style={{ 
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  height: window.innerWidth < 768 ? '32px' : 'auto',
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              >
                Edit
              </Button>
            </Tooltip>
          ),
          canDelete && (
            <Popconfirm
              title="Are you sure you want to delete this job?"
              onConfirm={() => handleDeleteJob(job._id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete Job">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size={window.innerWidth < 768 ? 'small' : 'middle'}
                  style={{ 
                    fontSize: window.innerWidth < 768 ? '12px' : '14px',
                    height: window.innerWidth < 768 ? '32px' : 'auto',
                    width: window.innerWidth < 768 ? '100%' : 'auto'
                  }}
                >
                  Delete
                </Button>
              </Tooltip>
            </Popconfirm>
          )
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={<FileTextOutlined />}
              style={{ backgroundColor: jobApi.getJobStatusColor(job.status) }}
            />
          }
          title={
            <Space>
              <Text strong>{job.title}</Text>
              <Tag color={jobApi.getJobStatusColor(job.status)}>
                {jobApi.getJobStatusDisplayName(job.status)}
              </Tag>
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
              
              <Space wrap style={{ marginBottom: '8px' }}>
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
                    <Badge count={job.applications?.length || 0} showZero size="small">
                      <Text type="secondary" style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }}>
                        Applications
                      </Text>
                    </Badge>
                  </Space>
                </Col>
              </Row>

              <Row gutter={window.innerWidth < 768 ? 8 : 16} style={{ marginTop: '4px' }}>
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
                <Col span={window.innerWidth < 768 ? 12 : 12}>
                  {job.assignedTo && (
                    <Space size="small">
                      <UserOutlined style={{ fontSize: window.innerWidth < 768 ? '12px' : '14px' }} />
                      <Text type="secondary" style={{ 
                        fontSize: window.innerWidth < 768 ? '11px' : '13px',
                        wordBreak: 'break-word'
                      }}>
                        Assigned to: {job.assignedTo.name}
                      </Text>
                    </Space>
                  )}
                </Col>
              </Row>
            </Space>
          }
        />
      </Card>
    );
  };

  // Application columns for table
  const applicationColumns = [
    {
      title: 'Writer',
      dataIndex: ['writer', 'name'],
      key: 'writer',
      render: (text, record) => (
        <Space>
          <Avatar src={record.writer?.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <div>
              <Button
                type="link"
                icon={<MessageOutlined />}
                onClick={() => handleChatWithWriter(record.writer?._id)}
                style={{ padding: 0, height: 'auto', fontSize: '12px' }}
              >
                Chat
              </Button>
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Proposed Amount',
      dataIndex: 'proposedAmount',
      key: 'proposedAmount',
      render: (amount) => amount ? jobApi.formatJobBudget(amount, 'NGN') : '-'
    },
    {
      title: 'Estimated Time',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
      render: (time) => time || '-'
    },
    {
      title: 'Applied',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (date) => moment(date).fromNow()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'accepted' ? 'green' : status === 'rejected' ? 'red' : 'blue'}>
          {status === 'accepted' ? 'Accepted' : 
           status === 'rejected' ? 'Rejected' : 'Pending'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record, index) => {
        if (record.status !== 'pending') return null;
        
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => handleAcceptApplication(selectedJob._id, record._id)}
            >
              Accept
            </Button>
            <Button
              size="small"
              onClick={() => {
                // Handle reject application
                message.info('Reject functionality to be implemented');
              }}
            >
              Reject
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <div className="mobile-bottom-tabs-visible">
      <div className="job-management-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        gap: window.innerWidth < 768 ? '20px' : '0',
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
            My Jobs
          </Space>
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setPostingModalVisible(true)}
          size={window.innerWidth < 768 ? 'middle' : 'large'}
          style={{ 
            width: window.innerWidth < 768 ? '100%' : 'auto',
            minWidth: window.innerWidth < 768 ? 'auto' : '160px',
            height: window.innerWidth < 768 ? '48px' : '52px',
            fontSize: window.innerWidth < 768 ? '14px' : '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #015382 0%, #017DB0 100%)',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(1, 83, 130, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 20px rgba(1, 83, 130, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(1, 83, 130, 0.3)';
          }}
        >
          {window.innerWidth < 768 ? 'Post Job' : 'Post New Job'}
        </Button>
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
          <Col xs={24} sm={16} md={16} lg={16} xl={16}>
            <Input
              placeholder="Search your jobs..."
              allowClear
              suffix={<SearchOutlined onClick={() => handleSearch(filters.search)} style={{ cursor: 'pointer', color: '#1890ff' }} />}
              onPressEnter={(e) => handleSearch(e.target.value)}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              value={filters.search}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={8} lg={8} xl={8}>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="open">Open</Option>
              <Option value="in-progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
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

      {/* Job Posting Modal */}
      <JobPostingModal
        visible={postingModalVisible}
        onCancel={() => {
          setPostingModalVisible(false);
          setEditingJob(null);
        }}
        onSuccess={handleJobSuccess}
        editingJob={editingJob}
      />

      {/* Job Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Job Details
          </Space>
        }
        open={jobDetailsVisible}
        onCancel={() => setJobDetailsVisible(false)}
        footer={null}
        width={800}
      >
        {selectedJob && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={4}>{selectedJob.title}</Title>
              <Paragraph>{selectedJob.description}</Paragraph>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>Type: </Text>
                  <Tag color="blue">{jobApi.getJobTypeDisplayName(selectedJob.jobType)}</Tag>
                </Col>
                <Col span={8}>
                  <Text strong>Level: </Text>
                  <Tag color="green">{jobApi.getAcademicLevelDisplayName(selectedJob.academicLevel)}</Tag>
                </Col>
                <Col span={8}>
                  <Text strong>Subject: </Text>
                  <Text>{selectedJob.subject}</Text>
                </Col>
              </Row>
              
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <Text strong>Budget: </Text>
                  <Text style={{ color: '#52c41a' }}>
                    {jobApi.formatJobBudget(selectedJob.budget.amount, selectedJob.budget.currency)}
                  </Text>
                </Col>
                <Col span={8}>
                  <Text strong>Deadline: </Text>
                  <Text>{moment(selectedJob.deadline).format('MMM DD, YYYY HH:mm')}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>Status: </Text>
                  <Tag color={jobApi.getJobStatusColor(selectedJob.status)}>
                    {jobApi.getJobStatusDisplayName(selectedJob.status)}
                  </Tag>
                </Col>
              </Row>
            </Card>

            {selectedJob.applications && selectedJob.applications.length > 0 && (
              <div>
                <Title level={5}>Applications ({selectedJob.applications.length})</Title>
                <Table
                  columns={applicationColumns}
                  dataSource={selectedJob.applications}
                  rowKey="_id"
                  pagination={false}
                  size="small"
                />
              </div>
            )}

            {selectedJob.attachments && selectedJob.attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Attachments</Title>
                <List
                  dataSource={selectedJob.attachments}
                  renderItem={(file) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<FileTextOutlined />} />}
                        title={file.name}
                        description={`${jobApi.formatFileSize(file.size)} • ${file.type}`}
                      />
                      <Button type="link" href={file.url} target="_blank">
                        Download
                      </Button>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default JobManagement;
