import React, { useState } from 'react';
import { Card, Form, Input, Button, Upload, Avatar, message } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import styles from './index.module.css';

const AdminSettings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [form] = Form.useForm();
  const [avatar, setAvatar] = useState<string | null>(null);

  const onFinish = (values: any) => {
    try {
      // 这里应该调用API更新用户信息，现在先模拟更新
      const updatedUser = {
        ...user,
        ...values,
        avatar: avatar || user?.avatar,
      };
      updateUser(updatedUser);
      message.success('个人信息更新成功');
    } catch (error) {
      message.error('更新失败，请重试');
    }
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      // 这里应该是上传后返回的URL，现在先用base64
      const reader = new FileReader();
      reader.readAsDataURL(info.file.originFileObj);
      reader.onload = () => {
        setAvatar(reader.result as string);
      };
    }
  };

  return (
    <div className={styles.container}>
      <Card title="个人信息设置" className={styles.card}>
        <div className={styles.avatarSection}>
          <Avatar
            size={100}
            icon={<UserOutlined />}
            src={avatar || user?.avatar}
            className={styles.avatar}
          />
          <Upload
            showUploadList={false}
            accept="image/*"
            onChange={handleAvatarChange}
            customRequest={({ onSuccess }) => {
              // 模拟上传成功
              setTimeout(() => {
                onSuccess?.('ok');
              }, 500);
            }}
          >
            <Button icon={<UploadOutlined />}>更换头像</Button>
          </Upload>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            username: user?.username,
            email: user?.email,
            nickname: user?.nickname || '',
            phone: user?.phone || '',
            signature: user?.signature || '',
          }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="昵称"
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            label="个性签名"
            name="signature"
          >
            <Input.TextArea
              placeholder="请输入个性签名"
              rows={4}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminSettings; 