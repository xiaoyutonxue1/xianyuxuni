import axios from 'axios';
import { message } from 'antd';
import { mockDataService } from './mockData';

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// 临时图片上传处理
const handleImageUpload = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // 将图片转换为base64格式
      const base64 = reader.result as string;
      // 模拟上传延迟
      setTimeout(() => {
        resolve(base64);
      }, 500);
    };
    reader.readAsDataURL(file);
  });
};

// 请求拦截器
request.interceptors.request.use(
  async config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 临时处理图片上传
    if (config.url === '/upload/image' && config.data instanceof FormData) {
      const file = config.data.get('file') as File;
      if (file) {
        try {
          const base64 = await handleImageUpload(file);
          throw {
            isCustomResponse: true,
            data: { url: base64 }
          };
        } catch (error) {
          if ((error as any).isCustomResponse) {
            throw error;
          }
          console.error('图片处理失败:', error);
        }
      }
    }

    // 模拟API请求
    try {
      let response;
      const url = config.url?.toLowerCase();
      const method = config.method?.toLowerCase();

      if (url === '/products' && method === 'get') {
        response = mockDataService.getProducts(config.params);
      } else if (url?.startsWith('/products/') && method === 'get') {
        const id = Number(url.split('/')[2]);
        response = mockDataService.getProduct(id);
      } else if (url === '/products' && method === 'post') {
        response = mockDataService.createProduct(config.data);
      } else if (url?.startsWith('/products/') && method === 'put') {
        const id = Number(url.split('/')[2]);
        response = mockDataService.updateProduct(id, config.data);
      } else if (url?.startsWith('/products/') && method === 'delete') {
        const id = Number(url.split('/')[2]);
        mockDataService.deleteProduct(id);
        response = null;
      } else if (url === '/products/batch' && method === 'delete') {
        mockDataService.batchDeleteProducts(config.data.ids);
        response = null;
      } else if (url === '/products/batch' && method === 'put') {
        mockDataService.batchEditProducts(config.data);
        response = null;
      } else if (url === '/products/distribute' && method === 'post') {
        mockDataService.distributeProducts(config.data);
        response = null;
      }

      if (response !== undefined) {
        throw {
          isCustomResponse: true,
          data: response
        };
      }
    } catch (error) {
      if ((error as any).isCustomResponse) {
        throw error;
      }
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 处理我们的特殊响应
    if (error.isCustomResponse) {
      return error.data;
    }

    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          message.error(data.message || '请求参数错误');
          break;
        case 401:
          message.error('未登录或登录已过期');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有权限访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误');
          break;
        default:
          message.error('网络错误');
      }
    } else if (error.request) {
      message.error('网络连接失败');
    } else {
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export default request; 