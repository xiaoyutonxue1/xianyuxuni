import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Modal, Checkbox } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import Confetti from 'react-confetti';
import styles from './index.module.css';
import { login } from '@/services/auth';
import { Link } from 'react-router-dom';

interface LoginForm {
  username: string;
  password: string;
  rememberMe?: boolean;
}

const STORAGE_KEY = 'remembered_account';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginStore } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [showWelcomeText, setShowWelcomeText] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // 组件加载时读取保存的账号密码
  useEffect(() => {
    const remembered = localStorage.getItem(STORAGE_KEY);
    if (remembered) {
      const { username, password } = JSON.parse(remembered);
      form.setFieldsValue({
        username,
        password,
        rememberMe: true,
      });
    }
  }, [form]);

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
          }, 1500);
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
      setLoading(true);
      const { rememberMe, ...loginParams } = values;
      const result = await login(loginParams);
      loginStore(result.data.accessToken, result.data.user);
      
      // 根据记住密码选项保存或清除账号密码
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          username: values.username,
          password: values.password,
        }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      
      message.success('登录成功');
      setShowWelcome(true);
    } catch (error) {
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
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
          initialValues={{ rememberMe: false }}
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

          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>记住密码</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div className={styles.registerLink}>
            还没有账号？<Link to="/register">立即注册</Link>
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
              {form.getFieldValue('username')}
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