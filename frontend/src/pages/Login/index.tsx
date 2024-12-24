import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Modal } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import Confetti from 'react-confetti';
import styles from './index.module.css';

interface LoginForm {
  username: string;
  password: string;
}

// 模拟用户数据
const MOCK_USER = {
  id: 1,
  username: 'admin',
  password: 'admin123', // 实际项目中密码应该加密存储
  email: 'admin@example.com',
  role: 'admin'
};

// 模拟token生成
const generateToken = (username: string) => {
  return `mock_token_${username}_${Date.now()}`;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [form] = Form.useForm();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showWelcomeText, setShowWelcomeText] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showWelcome) {
      // 重置所有状态
      setShowUsername(false);
      setShowWelcomeText(false);
      setShowConfetti(false);

      // 第一句话
      timer = setTimeout(() => {
        setShowUsername(true);
        
        // 第二句话
        timer = setTimeout(() => {
          setShowWelcomeText(true);
          
          // 等待第二句话动画完成后再显示祝福语和礼炮
          timer = setTimeout(() => {
            setShowConfetti(true);
            
            // 等待动画完成后关闭
            timer = setTimeout(() => {
              setShowConfetti(false);
              timer = setTimeout(() => {
                setShowWelcome(false);
                setShowUsername(false);
                setShowWelcomeText(false);
                const from = (location.state as any)?.from?.pathname || '/';
                navigate(from, { replace: true });
              }, 500);
            }, 3500);
          }, 1500); // 增加延迟，等待第二句话动画完成
        }, 1200);
      }, 300);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [showWelcome, location, navigate]);

  const onFinish = async (values: LoginForm) => {
    try {
      // 模拟登录验证
      if (values.username === MOCK_USER.username && values.password === MOCK_USER.password) {
        // 生成模拟token
        const token = generateToken(values.username);
        
        // 构造用户数据（排除密码）
        const { password, ...userData } = MOCK_USER;
        
        // 调用登录方法
        login(token, userData);
        message.success('登录成功');

        // 显示欢迎动画
        setShowWelcome(true);
      } else {
        throw new Error('用户名或密码错误');
      }
    } catch (error) {
      message.error('用户名或密码错误');
    }
  };

  return (
    <div className={styles.container}>
      <Card title="虚拟商品管理系统" className={styles.card}>
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ username: 'admin', password: 'admin123' }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#666' }}>
            默认账号：admin / admin123
          </div>
        </Form>
      </Card>

      <Modal
        open={showWelcome}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={400}
        className={styles.welcomeModal}
      >
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeText}>
            <div className={`${styles.username} ${showUsername ? styles.show : ''}`}>
              {MOCK_USER.username}
            </div>
            <div className={`${styles.welcome} ${showWelcomeText ? styles.show : ''}`}>
              欢迎回来
            </div>
          </div>
          <div className={styles.wish}>
            <span className={styles.wishText}>祝你拥有美好的一天！</span>
          </div>
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              numberOfPieces={150}
              recycle={false}
              gravity={0.15}
              initialVelocityY={10}
              initialVelocityX={2}
              tweenDuration={200}
              friction={0.99}
              colors={['#ff6b6b', '#ffd93d', '#4096ff', '#a8e6cf', '#ffffff']}
              drawShape={ctx => {
                ctx.beginPath();
                const size = Math.random() * 10 + 5;
                ctx.rect(-size / 2, -size / 2, size, size);
                ctx.fill();
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Login; 