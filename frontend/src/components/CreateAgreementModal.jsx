import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Button, Typography, Space, message, Card } from 'antd';
import { FileTextOutlined, DollarOutlined } from '@ant-design/icons';
import { useCurrency } from '../hooks/useCurrency';

const { Text } = Typography;

const CreateAgreementModal = forwardRef(({ visible, onClose, onSubmit, loading, writer }, ref) => {
  const [form] = Form.useForm();
  const { location, loading: locationLoading } = useCurrency();
  const [currency, setCurrency] = useState('usd'); // default USD

  const getCurrencySymbol = (cur) => (cur === 'ngn' ? '₦' : '$');

  const resetAllFields = () => {
    form.resetFields();
  };

  useImperativeHandle(ref, () => ({ resetFields: resetAllFields }));

  useEffect(() => {
    if (visible) resetAllFields();
  }, [visible]);

  // Detect location -> NGN for Nigeria, USD otherwise
  useEffect(() => {
    if (!locationLoading) {
      const ngn = location?.countryCode?.toLowerCase() === 'ng';
      setCurrency(ngn ? 'ngn' : 'usd');
    }
  }, [location, locationLoading]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const amount = Number(values.installmentAmount || 0);
      if (!amount || amount <= 0) {
        message.error('Please enter a valid installment amount.');
        return;
      }

      const agreementData = {
        writerId: writer?._id,
        projectDetails: {
          title: values.title
        },
        totalAmount: amount,
        installments: [
          {
            amount,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        ],
        paymentPreferences: {
          currency,
          gateway: currency === 'ngn' ? 'paystack' : 'stripe',
          location: location ? {
            country: location.country,
            countryCode: location.countryCode
          } : null,
          nativeAmount: amount
        }
      };

      await onSubmit(agreementData);
    } catch (error) {
      if (error?.errorFields) {
        message.error('Please fill the required fields.');
      } else {
        console.error('CreateAgreement submit error:', error);
        message.error('Unable to create agreement.');
      }
    }
  };

  return (
    <Modal
      title={
        <div style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', marginBottom: 16 }}>
          <Space>
            <FileTextOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <Text strong style={{ fontSize: 18, color: '#262626' }}>Create Service Agreement</Text>
          </Space>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={480}
      destroyOnClose
      bodyStyle={{ padding: 16 }}
      centered
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Card size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            name="title"
            label={<Text strong>Project Topic</Text>}
            rules={[{ required: true, message: 'Please enter the project topic' }]}
          >
            <Input placeholder="e.g., Impacts of Social Media on Education" />
          </Form.Item>

          <Form.Item
            name="installmentAmount"
            label={
              <Space>
                <DollarOutlined style={{ color: '#10b981' }} />
                <Text strong>
                  Installment Amount ({currency.toUpperCase()})
                </Text>
              </Space>
            }
            rules={[{ required: true, message: 'Please enter the installment amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              precision={2}
              placeholder="Amount to pay per installment"
              prefix={getCurrencySymbol(currency)}
            />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Detected currency based on your location: {locationLoading ? 'Detecting...' : currency.toUpperCase()}
          </Text>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Create Agreement
          </Button>
        </div>
      </Form>
    </Modal>
  );
});

export default CreateAgreementModal;