import React from 'react';
import { Modal, Descriptions, Tag, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined } from '@ant-design/icons';

const UserModal = ({ 
  visible, 
  onClose, 
  user, 
  onDelete, 
  isCurrentUser = false 
}) => {
  console.log('🔍 [UserModal] Props received:', { visible, user, isCurrentUser, onDelete: !!onDelete });
  
  if (!user) return null;

  const handleDelete = () => {
    console.log('🗑️ [UserModal] Delete button clicked for user:', user);
    console.log('🗑️ [UserModal] isCurrentUser:', isCurrentUser);
    console.log('🗑️ [UserModal] onDelete function:', onDelete);
    
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${user.name}? This action cannot be undone and will remove all associated data.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      style: { zIndex: 10000 },
      maskStyle: { zIndex: 9999 },
      onOk: async () => {
        try {
          console.log('🗑️ [UserModal] Confirmed deletion, calling onDelete...');
          await onDelete(user._id, user.name);
          console.log('🗑️ [UserModal] onDelete completed, closing modal...');
          onClose();
        } catch (error) {
          console.error('❌ [UserModal] Error in onOk:', error);
        }
      }
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserOutlined style={{ color: '#1890ff' }} />
          <span>User Details - {user.name}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        (
          <Button 
            key="delete" 
            danger 
            onClick={(e) => {
              console.log('🗑️ [UserModal] Delete button clicked directly');
              e.stopPropagation();
              handleDelete();
            }}
            style={{ marginLeft: '8px' }}
            disabled={isCurrentUser}
          >
            {isCurrentUser ? 'Cannot Delete Self' : 'Delete User'}
          </Button>
        )
      ]}
      width={600}
      style={{ zIndex: 9999 }}
      maskStyle={{ zIndex: 9998 }}
    >
      <div style={{ padding: '16px 0' }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item 
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined />
                Name
              </span>
            }
          >
            {user.name || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MailOutlined />
                Email
              </span>
            }
          >
            {user.email || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined />
                Role
              </span>
            }
          >
            <Tag 
              color={
                user.role === 'admin' ? 'red' : 
                user.role === 'writer' ? 'blue' : 'green'
              }
              style={{ 
                borderRadius: '8px', 
                fontWeight: '600',
                textTransform: 'capitalize'
              }}
            >
              {user.role}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined />
                Status
              </span>
            }
          >
            <Tag 
              color={user.isActive !== false ? 'green' : 'red'}
              style={{ borderRadius: '8px', fontWeight: '600' }}
            >
              {user.isActive !== false ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          
          {user.phone && (
            <Descriptions.Item 
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneOutlined />
                  Phone
                </span>
              }
            >
              {user.phone}
            </Descriptions.Item>
          )}
          
          <Descriptions.Item 
            label={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarOutlined />
                Joined
              </span>
            }
          >
            {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
          </Descriptions.Item>
          
          {user.writerProfile && (
            <>
              <Descriptions.Item 
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserOutlined />
                    Writer Status
                  </span>
                }
              >
                <Tag 
                  color={user.writerProfile.isApproved ? 'green' : 'orange'}
                  style={{ borderRadius: '8px', fontWeight: '600' }}
                >
                  {user.writerProfile.isApproved ? 'Approved' : 'Pending'}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item 
                label={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserOutlined />
                    Published
                  </span>
                }
              >
                <Tag 
                  color={user.writerProfile.isPublished ? 'blue' : 'default'}
                  style={{ borderRadius: '8px', fontWeight: '600' }}
                >
                  {user.writerProfile.isPublished ? 'Yes' : 'No'}
                </Tag>
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </div>
    </Modal>
  );
};

export default UserModal;
