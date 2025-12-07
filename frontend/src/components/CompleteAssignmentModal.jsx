import React from 'react';
import { Modal, Button, notification } from 'antd';
import { CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

const CompleteAssignmentModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  projectTitle = "this assignment",
  loading = false 
}) => {
  
  const handleOk = async () => {
    console.log('🎯 [Modal] User confirmed completion');
    if (onConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    console.log('❌ [Modal] User cancelled completion');
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      centered
      maskClosable={false}
      confirmLoading={loading}
      okText="✓ Yes, Complete Assignment"
      cancelText="Cancel"
      okButtonProps={{
        size: 'large',
        style: { 
          height: '48px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          minWidth: '200px'
        }
      }}
      cancelButtonProps={{
        size: 'large',
        style: { 
          height: '48px',
          borderRadius: '12px',
          fontWeight: '600',
          border: '2px solid #e2e8f0',
          backgroundColor: 'white',
          color: '#64748b',
          minWidth: '120px'
        }
      }}
      styles={{
        body: { padding: '0' },
        header: { display: 'none' }
      }}
    >
      {/* Custom Header */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '32px 32px 24px 32px',
        textAlign: 'center',
        color: 'white',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <CheckCircleOutlined style={{ fontSize: '32px', color: 'white' }} />
        </div>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          margin: '0 0 8px 0',
          color: 'white'
        }}>
          Complete Assignment
        </h2>
        <p style={{ 
          fontSize: '16px', 
          margin: 0,
          color: 'rgba(255, 255, 255, 0.9)'
        }}>
          Mark this project as finished and process payment
        </p>
      </div>
      {/* Content */}
      <div style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ 
            fontSize: '18px', 
            marginBottom: '8px', 
            lineHeight: '1.6',
            color: '#1f2937',
            fontWeight: '500'
          }}>
            Are you sure you want to mark
          </p>
          <p style={{ 
            fontSize: '20px', 
            marginBottom: '16px', 
            lineHeight: '1.5',
            color: '#059669',
            fontWeight: '700'
          }}>
            "{projectTitle}"
          </p>
          <p style={{ 
            fontSize: '18px', 
            margin: 0, 
            lineHeight: '1.6',
            color: '#1f2937',
            fontWeight: '500'
          }}>
            as completed?
          </p>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
          border: '2px solid #bbf7d0', 
          borderRadius: '16px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircleOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <strong style={{ color: '#059669', fontSize: '16px' }}>What happens next:</strong>
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '28px', 
            color: '#047857',
            fontSize: '15px',
            lineHeight: '1.7'
          }}>
            <li style={{ marginBottom: '8px' }}>Assignment will be marked as completed</li>
            <li style={{ marginBottom: '8px' }}>Payment will be processed automatically</li>
            <li style={{ marginBottom: '8px' }}>Student will be notified immediately</li>
            <li>Project will move to completed section</li>
          </ul>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
          border: '2px solid #fde68a', 
          borderRadius: '12px', 
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#f59e0b',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ThunderboltOutlined style={{ color: 'white', fontSize: '16px' }} />
          </div>
          <p style={{ 
            color: '#92400e', 
            fontSize: '15px', 
            margin: 0, 
            fontWeight: '600',
            lineHeight: '1.5'
          }}>
            <strong>Important:</strong> This action cannot be undone. Please ensure the assignment meets all requirements before proceeding.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CompleteAssignmentModal;