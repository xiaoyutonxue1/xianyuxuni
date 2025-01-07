import type { ProductListingItem } from '../types/product';

// 模拟商品数据
const mockProducts: ProductListingItem[] = [
  {
    id: 1,
    name: '王者荣耀点券充值',
    store: 'store1',
    category: '游戏充值',
    status: 'draft',
    price: '98.00',
    originalPrice: '100.00',
    stock: 999,
    sales: 152,
    createdAt: '2024-03-01 09:00:00',
    updatedAt: '2024-03-01 10:00:00',
    lastUpdateBy: '系统管理员',
    specs: [
      { id: '1', name: '648点券', price: '98.00', originalPrice: '100.00', stock: 999, deliveryMethod: 'auto' },
      { id: '2', name: '1648点券', price: '248.00', originalPrice: '250.00', stock: 888, deliveryMethod: 'auto' },
    ],
    headImage: 'https://example.com/head1.jpg',
    publicImages: ['https://example.com/public1.jpg', 'https://example.com/public2.jpg'],
    distributedTo: ['store2', 'store3'],
    description: '王者荣耀官方点券充值,安全可靠,秒到账',
    keywords: ['王者荣耀', '点券', '充值'],
    remark: '热销商品',
    method: 'crawler',
    crawlerStatus: 'processing',
    source: '闲鱼',
    sourceUrl: 'https://2.taobao.com/item1',
    processStep: 1,
  },
  {
    id: 2,
    name: '和平精英UC充值',
    store: 'store1',
    category: '游戏充值',
    status: 'draft',
    price: '198.00',
    originalPrice: '200.00',
    stock: 888,
    sales: 98,
    createdAt: '2024-03-01 10:30:00',
    updatedAt: '2024-03-01 11:00:00',
    lastUpdateBy: '系统管理员',
    specs: [
      { id: '3', name: '1000UC', price: '198.00', originalPrice: '200.00', stock: 888, deliveryMethod: 'auto' },
    ],
    headImage: 'https://example.com/head2.jpg',
    publicImages: ['https://example.com/public3.jpg'],
    distributedTo: ['store2'],
    description: '和平精英UC充值,安全可靠,秒到账',
    keywords: ['和平精英', 'UC', '充值'],
    remark: '新品上架',
    method: 'crawler',
    crawlerStatus: 'processed',
    source: '闲鱼',
    sourceUrl: 'https://2.taobao.com/item2',
    processStep: 3,
  },
  {
    id: 3,
    name: 'Steam充值卡',
    store: 'store1',
    category: '游戏充值',
    status: 'draft',
    price: '500.00',
    originalPrice: '500.00',
    stock: 50,
    sales: 0,
    createdAt: '2024-03-02 09:00:00',
    updatedAt: '2024-03-02 09:15:00',
    lastUpdateBy: '运营专员A',
    description: 'Steam充值卡,面值500元',
    method: 'manual',
  },
  {
    id: 4,
    name: '腾讯视频会员12个月',
    store: 'store1',
    category: '视频会员',
    status: 'draft',
    price: '253.00',
    originalPrice: '253.00',
    stock: 100,
    sales: 0,
    createdAt: '2024-03-02 14:00:00',
    updatedAt: '2024-03-02 14:20:00',
    lastUpdateBy: '运营专员B',
    description: '腾讯视频VIP会员年卡',
    method: 'crawler',
    crawlerStatus: 'failed',
    source: '闲鱼',
    sourceUrl: 'https://2.taobao.com/item4',
    failReason: '商品信息不完整',
  },
  {
    id: 5,
    name: '网易云音乐年卡',
    store: 'store1',
    category: '音乐会员',
    status: 'draft',
    price: '128.00',
    originalPrice: '128.00',
    stock: 200,
    sales: 0,
    createdAt: '2024-03-02 16:30:00',
    updatedAt: '2024-03-02 16:45:00',
    lastUpdateBy: '系统管理员',
    description: '网易云音乐黑胶VIP会员12个月',
    method: 'crawler',
    crawlerStatus: 'pending',
    source: '闲鱼',
    sourceUrl: 'https://2.taobao.com/item5',
    processStep: 0,
  }
];

// 模拟数据服务
class MockDataService {
  private products: ProductListingItem[] = [...mockProducts];
  private nextId = 6;

  // 获取商品列表
  getProducts(params: any) {
    let filteredProducts = [...this.products];

    // 应用搜索过滤
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword) ||
        product.keywords?.some(k => k.toLowerCase().includes(keyword))
      );
    }

    // 应用分类过滤
    if (params.category) {
      filteredProducts = filteredProducts.filter(product => 
        product.category === params.category
      );
    }

    // 应用店铺过滤
    if (params.store) {
      filteredProducts = filteredProducts.filter(product => 
        product.store === params.store
      );
    }

    // 应用状态过滤
    if (params.status) {
      filteredProducts = filteredProducts.filter(product => 
        product.status === params.status
      );
    }

    // 应用选品方式过滤
    if (params.method) {
      filteredProducts = filteredProducts.filter(product => 
        product.method === params.method
      );
    }

    // 应用排序
    if (params.sortField) {
      filteredProducts.sort((a, b) => {
        const aValue = a[params.sortField];
        const bValue = b[params.sortField];
        if (params.sortOrder === 'ascend') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    } else {
      // 默认按创建时间倒序排列
      filteredProducts.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // 计算分页
    const pageSize = params.pageSize || 10;
    const page = params.page || 1;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedProducts = filteredProducts.slice(start, end);

    return {
      items: paginatedProducts,
      total: filteredProducts.length
    };
  }

  // 获取单个商品
  getProduct(id: number) {
    const product = this.products.find(p => p.id === id);
    if (!product) throw new Error('商品不存在');
    return product;
  }

  // 创建商品
  createProduct(product: Partial<ProductListingItem>) {
    const newProduct: ProductListingItem = {
      id: this.nextId++,
      name: '',
      store: 'store1',
      category: '',
      status: 'draft',
      price: '0',
      originalPrice: '0',
      stock: 0,
      sales: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdateBy: '系统管理员',
      method: product.method || 'manual',
      ...product
    };

    // 如果是爬虫选品,模拟爬虫处理过程
    if (newProduct.method === 'crawler') {
      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === newProduct.id);
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            crawlerStatus: 'processing',
            processStep: 1,
            updatedAt: new Date().toISOString(),
          };
        }
      }, 2000);

      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === newProduct.id);
        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            crawlerStatus: 'processing',
            processStep: 2,
            updatedAt: new Date().toISOString(),
          };
        }
      }, 4000);

      setTimeout(() => {
        const index = this.products.findIndex(p => p.id === newProduct.id);
        if (index !== -1) {
          // 随机成功或失败
          const success = Math.random() > 0.2;
          this.products[index] = {
            ...this.products[index],
            crawlerStatus: success ? 'processed' : 'failed',
            processStep: success ? 3 : 2,
            failReason: success ? undefined : '数据验证失败',
            updatedAt: new Date().toISOString(),
          };
        }
      }, 6000);
    }

    this.products.push(newProduct);
    return newProduct;
  }

  // 更新商品
  updateProduct(id: number, product: Partial<ProductListingItem>) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('商品不存在');
    
    this.products[index] = {
      ...this.products[index],
      ...product,
      updatedAt: new Date().toISOString(),
      lastUpdateBy: '系统管理员'
    };
    
    return this.products[index];
  }

  // 删除商品
  deleteProduct(id: number) {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('商品不存在');
    this.products.splice(index, 1);
  }

  // 批量删除商品
  batchDeleteProducts(ids: number[]) {
    this.products = this.products.filter(p => !ids.includes(p.id));
  }

  // 批量编辑商品
  batchEditProducts(payload: any) {
    const { ids, updates } = payload;
    this.products = this.products.map(product => {
      if (ids.includes(product.id)) {
        const updatedProduct = { ...product };
        
        if (updates.price) {
          const price = Number(product.price);
          updatedProduct.price = (price * (1 + updates.price.adjustment)).toFixed(2);
        }

        if (updates.stock) {
          switch (updates.stock.operation) {
            case 'set':
              updatedProduct.stock = updates.stock.value;
              break;
            case 'add':
              updatedProduct.stock += updates.stock.value;
              break;
            case 'subtract':
              updatedProduct.stock = Math.max(0, updatedProduct.stock - updates.stock.value);
              break;
          }
        }

        if (updates.status) {
          updatedProduct.status = updates.status;
        }

        if (updates.deliveryMethod) {
          updatedProduct.specs = product.specs?.map(spec => ({
            ...spec,
            deliveryMethod: updates.deliveryMethod
          }));
        }

        if (updates.keywords) {
          updatedProduct.keywords = updates.keywords;
        }

        if (updates.description?.appendText) {
          updatedProduct.description = (product.description || '') + '\n' + updates.description.appendText;
        }

        updatedProduct.updatedAt = new Date().toISOString();
        updatedProduct.lastUpdateBy = '系统管理员';

        return updatedProduct;
      }
      return product;
    });
  }

  // 分配商品到账号
  distributeProducts(payload: { productIds: number[], accountIds: string[] }) {
    const { productIds, accountIds } = payload;
    const productsToDistribute = this.products.filter(p => productIds.includes(p.id));
    
    productsToDistribute.forEach(product => {
      accountIds.forEach(accountId => {
        this.createProduct({
          ...product,
          id: undefined,
          store: accountId,
          status: 'draft',
          distributedTo: [accountId],
        });
      });
    });
  }
}

export const mockDataService = new MockDataService(); 