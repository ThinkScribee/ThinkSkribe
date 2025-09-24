import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Button,
  message,
  Space,
  Divider,
  Card,
  Row,
  Col,
  Typography,
  Alert,
  Tooltip,
  Tag
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  BookOutlined,
  FileTextOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import moment from 'moment';
import dayjs from 'dayjs';
import { jobApi } from '../api/jobs.js';
import { useAuth } from '../context/AuthContext.jsx';
import './JobComponents.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const JobPostingModal = ({ visible, onCancel, onSuccess, editingJob = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({});
  const [fileList, setFileList] = useState([]);
  const [budgetValidation, setBudgetValidation] = useState({ valid: true });
  const { user } = useAuth();

  // Load pricing information
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const response = await jobApi.getJobPricing();
        setPricing(response);
      } catch (error) {
        console.error('Error loading pricing:', error);
      }
    };
    
    if (visible) {
      loadPricing();
    }
  }, [visible]);

  // Load job data for editing
  useEffect(() => {
    if (editingJob && visible) {
      form.setFieldsValue({
        ...editingJob,
        deadline: dayjs(editingJob.deadline),
        'budget.amount': editingJob.budget.amount,
        'budget.currency': editingJob.budget.currency,
        'requirements.wordCount.min': editingJob.requirements?.wordCount?.min,
        'requirements.wordCount.max': editingJob.requirements?.wordCount?.max,
        'requirements.formatting': editingJob.requirements?.formatting,
        'requirements.language': editingJob.requirements?.language,
        'requirements.additionalNotes': editingJob.requirements?.additionalNotes
      });
      
      // Set file list for editing
      if (editingJob.attachments) {
        setFileList(editingJob.attachments.map((file, index) => ({
          uid: `existing-${index}`,
          name: file.name,
          status: 'done',
          url: file.url,
          type: file.type,
          size: file.size
        })));
      }
    } else if (visible) {
      form.resetFields();
      setFileList([]);
    }
  }, [editingJob, visible, form]);

  // Validate budget when job type or amount changes
  const handleBudgetValidation = (jobType, amount, currency) => {
    if (jobType && amount) {
      const validation = jobApi.validateJobBudget(jobType, amount, currency);
      setBudgetValidation(validation);
    } else {
      setBudgetValidation({ valid: true });
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!budgetValidation.valid) {
      message.error(budgetValidation.message);
      return;
    }

    setLoading(true);
    try {
      const jobData = {
        title: values.title,
        description: values.description,
        jobType: values.jobType,
        budget: {
          amount: values.budget.amount,
          currency: values.budget.currency || 'NGN'
        },
        deadline: values.deadline.toISOString(),
        academicLevel: values.academicLevel,
        subject: values.subject,
        priority: values.priority || 'medium',
        requirements: {
          wordCount: {
            min: values['requirements.wordCount.min'],
            max: values['requirements.wordCount.max']
          },
          formatting: values['requirements.formatting'],
          language: values['requirements.language'],
          additionalNotes: values['requirements.additionalNotes']
        },
        tags: values.tags || []
      };

      let response;
      if (editingJob) {
        response = await jobApi.updateJob(editingJob._id, jobData);
        message.success('Job updated successfully!');
      } else {
        response = await jobApi.createJob(jobData);
        message.success('Job posted successfully!');
      }

      onSuccess(response);
      form.resetFields();
      setFileList([]);
    } catch (error) {
      console.error('Error submitting job:', error);
      message.error(error.response?.data?.message || 'Failed to submit job');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!editingJob) {
      message.warning('Please save the job first before uploading files');
      return false;
    }

    try {
      const response = await jobApi.uploadJobAttachment(editingJob._id, file);
      message.success('File uploaded successfully!');
      return false; // Prevent default upload behavior
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Failed to upload file');
      return false;
    }
  };

  // Handle file removal
  const handleFileRemove = (file) => {
    setFileList(prev => prev.filter(item => item.uid !== file.uid));
  };

  // Get pricing info for selected job type
  const getPricingInfo = (jobType) => {
    if (!jobType || !pricing[jobType]) return null;
    
    const info = pricing[jobType];
    return (
      <Alert
        message={`Minimum Amount: ${jobApi.formatJobBudget(info.minAmount, info.currency)}`}
        description={info.description}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span style={{ 
            fontSize: window.innerWidth < 768 ? '16px' : '18px',
            fontWeight: '600',
            wordBreak: 'break-word'
          }}>
            {editingJob ? 'Edit Job' : 'Post New Job'}
          </span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={window.innerWidth < 768 ? '98%' : 900}
      destroyOnClose
      style={{ 
        top: window.innerWidth < 768 ? 5 : 20,
        margin: window.innerWidth < 768 ? '0 auto' : 'auto'
      }}
      className="job-posting-modal professional-modal"
      centered={window.innerWidth < 768}
      bodyStyle={{ 
        padding: window.innerWidth < 768 ? '16px' : '32px',
        maxHeight: window.innerWidth < 768 ? 'calc(100vh - 120px)' : 'none',
        overflowY: window.innerWidth < 768 ? 'auto' : 'visible'
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="job-form"
        initialValues={{
          'budget.currency': 'NGN',
          priority: 'medium',
          'requirements.formatting': 'Not specified',
          'requirements.language': 'English'
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Form.Item
              name="title"
              label="Job Title"
              rules={[
                { required: true, message: 'Please enter job title' },
                { max: 200, message: 'Title cannot exceed 200 characters' }
              ]}
            >
              <Input 
                placeholder="Enter a clear, descriptive title for your job" 
                style={{
                  fontSize: window.innerWidth < 768 ? '16px' : '14px',
                  height: window.innerWidth < 768 ? '48px' : '40px'
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              name="jobType"
              label="Job Type"
              rules={[{ required: true, message: 'Please select job type' }]}
            >
              <Select
                placeholder="Select job type"
                onChange={(value) => {
                  const amount = form.getFieldValue('budget.amount');
                  const currency = form.getFieldValue('budget.currency');
                  handleBudgetValidation(value, amount, currency);
                }}
              >
                <Option value="full-project">Full Project (₦80,000+)</Option>
                <Option value="it_Report">IT/SIWES Report (₦20,000+)</Option>
                <Option value="term-paper">Term Paper (₦25,000+)</Option>
                <Option value="chapter">Chapter (₦30,000 per chapter)</Option>
                <Option value="assignment">Assignment (₦10,000+)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              name="academicLevel"
              label="Academic Level"
              rules={[{ required: true, message: 'Please select academic level' }]}
            >
              <Select placeholder="Select academic level">
                <Option value="undergraduate">Undergraduate</Option>
                <Option value="masters">Masters</Option>
                <Option value="phd">PhD</Option>
                <Option value="professional">Professional</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              name="subject"
              label="Subject/Field"
              rules={[
                { required: true, message: 'Please enter subject' },
                { max: 100, message: 'Subject cannot exceed 100 characters' }
              ]}
            >
              <Input placeholder="e.g., Computer Science, Business, Literature" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Form.Item
              name="priority"
              label="Priority"
            >
              <Select placeholder="Select priority">
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Job Description"
          rules={[
            { required: true, message: 'Please enter job description' },
            { max: 5000, message: 'Description cannot exceed 5000 characters' }
          ]}
        >
          <TextArea
            rows={window.innerWidth < 768 ? 4 : 6}
            placeholder="Provide detailed description of your requirements, including specific instructions, expectations, and any additional information that would help writers understand the scope of work..."
            showCount
            maxLength={5000}
            style={{
              fontSize: window.innerWidth < 768 ? '16px' : '14px',
              resize: 'vertical'
            }}
          />
        </Form.Item>

        <Card title={<Space><DollarOutlined />Budget & Timeline</Space>} size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <Form.Item
                name={['budget', 'amount']}
                label="Budget Amount"
                rules={[{ required: true, message: 'Please enter budget amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter amount"
                  min={0}
                  formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₦\s?|(,*)/g, '')}
                  onChange={(value) => {
                    const jobType = form.getFieldValue('jobType');
                    const currency = form.getFieldValue('budget.currency');
                    handleBudgetValidation(jobType, value, currency);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <Form.Item
                name={['budget', 'currency']}
                label="Currency"
              >
                <Select>
                  <Option value="NGN">Nigerian Naira (₦)</Option>
                  <Option value="USD">US Dollar ($)</Option>
                  <Option value="EUR">Euro (€)</Option>
                  <Option value="GBP">British Pound (£)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <Form.Item
                name="deadline"
                label="Deadline"
                rules={[{ required: true, message: 'Please select deadline' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  placeholder="Select deadline"
                />
              </Form.Item>
            </Col>
          </Row>

          {form.getFieldValue('jobType') && getPricingInfo(form.getFieldValue('jobType'))}
          
          {!budgetValidation.valid && (
            <Alert
              message={budgetValidation.message}
              type="error"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </Card>

        <Card title={<Space><BookOutlined />Requirements</Space>} size="small" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <Form.Item
                name={['requirements', 'wordCount', 'min']}
                label="Min Word Count"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Minimum"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <Form.Item
                name={['requirements', 'wordCount', 'max']}
                label="Max Word Count"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Maximum"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
              <Form.Item
                name={['requirements', 'formatting']}
                label="Formatting Style"
              >
                <Select>
                  <Option value="APA">APA</Option>
                  <Option value="MLA">MLA</Option>
                  <Option value="Chicago">Chicago</Option>
                  <Option value="Harvard">Harvard</Option>
                  <Option value="Other">Other</Option>
                  <Option value="Not specified">Not specified</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Form.Item
                name={['requirements', 'language']}
                label="Language"
              >
                <Input placeholder="e.g., English, French, Spanish" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Form.Item
                name="tags"
                label="Tags"
              >
                <Select
                  mode="tags"
                  placeholder="Add tags to help writers find your job"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['requirements', 'additionalNotes']}
            label="Additional Notes"
          >
            <TextArea
              rows={3}
              placeholder="Any additional requirements, special instructions, or notes for the writer..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Card>

        {editingJob && (
          <Card title="Attachments" size="small" style={{ marginTop: 16 }}>
            <Upload
              fileList={fileList}
              beforeUpload={handleFileUpload}
              onRemove={handleFileRemove}
              multiple
            >
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Upload any relevant documents, guidelines, or reference materials
            </Text>
          </Card>
        )}

        <Divider />

        <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
          <Space 
            size="middle" 
            direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
            style={{ 
              width: '100%', 
              justifyContent: window.innerWidth < 768 ? 'stretch' : 'flex-end' 
            }}
          >
            <Button 
              onClick={onCancel}
              size="large"
              style={{ 
                width: window.innerWidth < 768 ? '100%' : 'auto',
                minWidth: '100px',
                height: window.innerWidth < 768 ? '52px' : '48px',
                fontSize: window.innerWidth < 768 ? '16px' : '16px',
                borderRadius: '12px',
                wordBreak: 'normal'
              }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              style={{ 
                width: window.innerWidth < 768 ? '100%' : 'auto',
                minWidth: '120px',
                height: window.innerWidth < 768 ? '52px' : '48px',
                fontSize: window.innerWidth < 768 ? '16px' : '16px',
                fontWeight: '600',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                wordBreak: 'normal'
              }}
            >
              {editingJob ? 'Update Job' : 'Post Job'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default JobPostingModal;
