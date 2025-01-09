import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import styles from './index.module.css';
import { register } from '@/services/auth';

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: RegisterForm) => {
    try {
      setLoading(true);
      await register(values);
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('请输入密码');
    }
    if (value.length < 8) {
      return Promise.reject('密码长度不能少于8位');
    }
    if (!/[A-Z]/.test(value)) {
      return Promise.reject('密码必须包含大写字母');
    }
    if (!/[a-z]/.test(value)) {
      return Promise.reject('密码必须包含小写字母');
    }
    if (!/\d/.test(value)) {
      return Promise.reject('密码必须包含数字');
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject('请确认密码');
    }
    if (value !== form.getFieldValue('password')) {
      return Promise.reject('两次输入的密码不一致');
    }
    return Promise.resolve();
  };

  return (
    <div className={styles.container}>
      <Card title="注册账号" className={styles.card}>
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名长度不能少于3位' },
              { max: 20, message: '用户名长度不能超过20位' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ validator: validatePassword }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ validator: validateConfirmPassword }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div className={styles.loginLink}>
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register; 