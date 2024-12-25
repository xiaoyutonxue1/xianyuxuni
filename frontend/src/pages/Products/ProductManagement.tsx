import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Space, message, Select, Tag, Modal, Image, DatePicker, Popover, Dropdown, Progress, Checkbox } from 'antd';
import { EditOutlined, StopOutlined, CalendarOutlined, ExportOutlined, DeleteOutlined, DownOutlined } from '@ant-design/icons';
import EditProductForm from './EditProductForm';
import type { Product, ProductSelection, ProductSourceStatus, ProductStatus, ProductCategory } from '../../types/product';
import useProductStore from '../../store/productStore';
import useSettingsStore from '../../store/settingsStore';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { deliveryMethods, deliveryMethodMap } from '../../constants';

const { Search } = Input;
const { RangePicker } = DatePicker;

// 添加 File System Access API 的类型声明
declare global {
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }
}

// 将Product类型转换为ProductSelection类型
const convertProductToSelection = (product: Product): ProductSelection => {
  console.log('Converting product to selection:', product);
  return {
    ...product,
    source_status: product.source === 'manual' ? 'manual' : 'crawler_success' as ProductSourceStatus,
  };
};

// 将ProductSelection类型转换为Product类型
const convertSelectionToProduct = (selection: any, originalProduct: Product): Product => {
  return {
    ...originalProduct,
    ...selection,
    lastUpdated: new Date().toISOString(),
  };
};

// 基础亮度分析
const analyzeBasicBrightness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    totalBrightness += brightness;
  }

  const averageBrightness = totalBrightness / (data.length / 4);
  
  if (averageBrightness > 192) {
    return 'rgba(0, 0, 0, 0.8)';
  } else if (averageBrightness > 128) {
    return 'rgba(0, 0, 0, 0.9)';
  } else if (averageBrightness > 64) {
    return 'rgba(255, 255, 255, 0.9)';
  } else {
    return 'rgba(255, 255, 255, 0.8)';
  }
};

// 区域亮度分析
const analyzeRegionBrightness = (ctx: CanvasRenderingContext2D, width: number, height: number, position: string, fontSize: number) => {
  const regionSize = fontSize * 4;
  let startX = 0, startY = 0;

  switch (position) {
    case 'top-left':
      startX = 0;
      startY = 0;
      break;
    case 'top-right':
      startX = width - regionSize;
      startY = 0;
      break;
    case 'bottom-left':
      startX = 0;
      startY = height - regionSize;
      break;
    case 'bottom-right':
      startX = width - regionSize;
      startY = height - regionSize;
      break;
    default: // center
      startX = (width - regionSize) / 2;
      startY = (height - regionSize) / 2;
  }

  const imageData = ctx.getImageData(startX, startY, regionSize, regionSize);
  const data = imageData.data;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
    totalBrightness += brightness;
  }

  const averageBrightness = totalBrightness / (data.length / 4);
  
  if (averageBrightness > 192) {
    return 'rgba(0, 0, 0, 0.8)';
  } else if (averageBrightness > 128) {
    return 'rgba(0, 0, 0, 0.9)';
  } else if (averageBrightness > 64) {
    return 'rgba(255, 255, 255, 0.9)';
  } else {
    return 'rgba(255, 255, 255, 0.8)';
  }
};

// 对比度分析
const analyzeColorContrast = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let maxR = 0, maxG = 0, maxB = 0;
  let minR = 255, minG = 255, minB = 255;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    maxR = Math.max(maxR, r);
    maxG = Math.max(maxG, g);
    maxB = Math.max(maxB, b);
    minR = Math.min(minR, r);
    minG = Math.min(minG, g);
    minB = Math.min(minB, b);
  }

  const contrastR = maxR - minR;
  const contrastG = maxG - minG;
  const contrastB = maxB - minB;
  const overallContrast = (contrastR + contrastG + contrastB) / 3;

  if (overallContrast > 128) {
    return 'rgba(0, 0, 0, 0.8)';
  } else {
    return 'rgba(255, 255, 255, 0.8)';
  }
};

// 综合分析函数
const analyzeImageColor = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  settings: StoreAccount['watermarkSettings']
): string => {
  if (!settings?.useSmartColor) {
    return settings?.color || '#000000';
  }

  if (settings?.useContrastAnalysis) {
    return analyzeColorContrast(ctx, width, height);
  }

  if (settings?.useRegionAnalysis) {
    return analyzeRegionBrightness(
      ctx, 
      width, 
      height, 
      settings.position || 'center',
      settings.fontSize || 20
    );
  }

  return analyzeBasicBrightness(ctx, width, height);
};

const ProductManagement: React.FC = () => {
  const [loading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [completenessFilter, setCompletenessFilter] = useState<string>('');
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Product[]>([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [updateStatusAfterExport, setUpdateStatusAfterExport] = useState(false);
  const [addWatermark, setAddWatermark] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // 使用 store
  const { products, updateProduct, removeProduct, updateDeliveryMethods } = useProductStore();
  const { productSettings, storeAccounts } = useSettingsStore();

  // 更新发货方式格式
  useEffect(() => {
    updateDeliveryMethods();
  }, []);

  // 过滤和搜索商品
  const getFilteredProducts = () => {
    let filteredData = [...products];
    
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.distributedTitle?.toLowerCase().includes(searchLower)
      );
    }

    // 状态筛选
    if (statusFilter) {
      filteredData = filteredData.filter(item => item.status === statusFilter);
    }

    // 分类筛选
    if (categoryFilter) {
      filteredData = filteredData.filter(item => item.category === categoryFilter);
    }

    // 发货方式筛选
    if (deliveryMethodFilter) {
      console.log('Filtering by delivery method:', deliveryMethodFilter);
      filteredData = filteredData.filter(item => {
        // 如果是多规格商品
        if (item.hasSpecs && Array.isArray(item.specs) && item.specs.length > 0) {
          // 检查每个规格的发货方式
          const hasMatchingSpec = item.specs.some(spec => {
            // 确保规格对象存在且有发货方式
            if (!spec || typeof spec !== 'object') return false;
            
            // 检查发货方式是否匹配（支持中文和英文值）
            const matches = spec.deliveryMethod === deliveryMethodFilter || 
                          spec.deliveryMethod === deliveryMethodMap[deliveryMethodFilter] ||
                          Object.entries(deliveryMethodMap).find(([key, value]) => value === spec.deliveryMethod)?.[0] === deliveryMethodFilter;
            
            console.log(`Spec ${spec.name || 'unknown'} delivery method:`, spec.deliveryMethod, 'matches:', matches);
            return matches;
          });
          
          if (hasMatchingSpec) {
            console.log('Found matching spec in product:', item.name);
          }
          return hasMatchingSpec;
        }
        
        // 单规格商品
        if (!item.deliveryMethod) {
          console.log('Product has no delivery method:', item.name);
          return false;
        }
        
        // 检查发货方式是否匹配（支持中文和英文值）
        const matches = item.deliveryMethod === deliveryMethodFilter || 
                       item.deliveryMethod === deliveryMethodMap[deliveryMethodFilter] ||
                       Object.entries(deliveryMethodMap).find(([key, value]) => value === item.deliveryMethod)?.[0] === deliveryMethodFilter;
        
        if (matches) {
          console.log('Found matching single product:', item.name);
        }
        return matches;
      });
      
      console.log('Filtered products count:', filteredData.length);
    }

    // 完整度筛选
    if (completenessFilter) {
      filteredData = filteredData.filter(item => {
        const incomplete = getIncompleteItems(item);
        switch (completenessFilter) {
          case 'missing_name':
            return !item.name;
          case 'missing_category':
            return !item.category;
          case 'missing_price':
            return typeof item.price !== 'number';
          case 'missing_stock':
            return typeof item.stock !== 'number';
          case 'missing_delivery':
            return !item.deliveryMethod || !item.deliveryInfo;
          case 'missing_cover':
            return !item.coverImage;
          case 'missing_images':
            return !item.commonImages?.length;
          case 'missing_title':
            return !item.distributedTitle;
          case 'missing_content':
            return !item.distributedContent;
          case 'incomplete':
            return incomplete.length > 0;
          case 'complete':
            return incomplete.length === 0;
          default:
            return true;
        }
      });
    }

    // 日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      filteredData = filteredData.filter(item => {
        const createdAt = dayjs(item.createdAt);
        return createdAt.isAfter(dateRange[0], 'day') && createdAt.isBefore(dateRange[1], 'day');
      });
    }

    return filteredData;
  };

  // 日期快选项
  const dateRangePresets: {
    label: string;
    value: [Dayjs, Dayjs];
  }[] = [
    { label: '最近7天', value: [dayjs().subtract(7, 'd'), dayjs()] },
    { label: '最近30天', value: [dayjs().subtract(30, 'd'), dayjs()] },
    { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
    { label: '上月', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
  ];

  // 日期筛选内容
  const dateFilterContent = (
    <div style={{ padding: '8px 0' }}>
      <RangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        presets={dateRangePresets}
        allowClear
      />
    </div>
  );

  // 监听products变化
  useEffect(() => {
    console.log('Current products:', products);
  }, [products]);

  // 处理编辑
  const handleEdit = (record: Product) => {
    console.log('Editing product:', record);
    try {
      setSelectedProduct(record);
      setIsEditModalVisible(true);
      console.log('Edit modal should be visible now');
    } catch (error) {
      console.error('Error in handleEdit:', error);
    }
  };

  // 监听Modal和选中商品的变化
  useEffect(() => {
    console.log('Modal visible:', isEditModalVisible);
    console.log('Selected product:', selectedProduct);
    if (isEditModalVisible && selectedProduct) {
      console.log('Converting product to selection:', selectedProduct);
      const selection = convertProductToSelection(selectedProduct);
      console.log('Converted selection:', selection);
    }
  }, [isEditModalVisible, selectedProduct]);

  // 处理编辑提交
  const handleEditSubmit = async (values: any) => {
    try {
      if (!selectedProduct) return;
      
      console.log('Submitting edit with values:', values);
      
      // 将编辑后的据转换回Product类型
      const updatedProduct = convertSelectionToProduct(values, selectedProduct);
      
      // 更新商品数据
      updateProduct(updatedProduct);
      message.success('编辑成功');
      setIsEditModalVisible(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Edit failed:', error);
      message.error('编辑失败');
    }
  };

  // 处理下架
  const handleOffline = (record: Product) => {
    Modal.confirm({
      title: '确认下架',
      content: `确定要下架商品"${record.name}"吗？`,
      onOk: async () => {
        try {
          updateProduct({
            ...record,
            status: 'offline',
            lastUpdated: new Date().toISOString()
          });
          message.success('下架成功');
        } catch (error) {
          message.error('下架失败');
        }
      }
    });
  };

  // 处理多选
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Product[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedRows(selectedRows);
    }
  };

  // 处理批量下架
  const handleBatchOffline = () => {
    Modal.confirm({
      title: '确认下架',
      content: `确定要下架选中的 ${selectedRowKeys.length} 个商品吗？`,
      onOk: async () => {
        try {
          selectedRows.forEach(product => {
            updateProduct({
              ...product,
              status: 'offline',
              lastUpdated: new Date().toISOString()
            });
          });
          message.success('批量下架成功');
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          message.error('批量下架失败');
        }
      }
    });
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中��� ${selectedRowKeys.length} 个商品����？操作不可恢复！`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          selectedRows.forEach(product => {
            removeProduct(product.id);
          });
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          setSelectedRows([]);
        } catch (error) {
          message.error('批量删除失败');
        }
      }
    });
  };

  // 处理图片保存
  const saveImage = async (
    imgUrl: string,
    fileName: string,
    watermarkText?: string,
    watermarkSettings?: any
  ) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // 绘制原图
        ctx.drawImage(img, 0, 0);

        // 如果有水印文本，添加水印
        if (watermarkText && watermarkSettings) {
          // 设置水印样式
          const fontSize = watermarkSettings.fontSize || 20;
          const opacity = (watermarkSettings.opacity || 15) / 100;
          const position = watermarkSettings.position || 'center';
          const rotation = (watermarkSettings.rotation || 0) * Math.PI / 180;
          const mode = watermarkSettings.mode || 'single';

          // 根据智能水印设置选择颜色
          let color;
          if (watermarkSettings.useSmartColor) {
            if (watermarkSettings.useContrastAnalysis) {
              color = analyzeColorContrast(ctx, canvas.width, canvas.height);
            } else if (watermarkSettings.useRegionAnalysis) {
              color = analyzeRegionBrightness(ctx, canvas.width, canvas.height, position, fontSize);
            } else {
              color = analyzeBasicBrightness(ctx, canvas.width, canvas.height);
            }
          } else {
            color = watermarkSettings.color || '#000000';
          }

          ctx.save();
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (mode === 'single') {
            // 计算位置
            let x = canvas.width / 2;
            let y = canvas.height / 2;
            
            switch (position) {
              case 'top-left':
                x = fontSize * 2;
                y = fontSize;
                break;
              case 'top-right':
                x = canvas.width - fontSize * 2;
                y = fontSize;
                break;
              case 'bottom-left':
                x = fontSize * 2;
                y = canvas.height - fontSize;
                break;
              case 'bottom-right':
                x = canvas.width - fontSize * 2;
                y = canvas.height - fontSize;
                break;
            }

            // 应用旋转
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillText(watermarkText, 0, 0);
          } else {
            // 平铺模式
            const textWidth = ctx.measureText(watermarkText).width;
            const gap = textWidth + fontSize;
            
            for (let y = fontSize; y < canvas.height; y += gap) {
              for (let x = fontSize * 2; x < canvas.width; x += gap) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(rotation);
                ctx.fillText(watermarkText, 0, 0);
                ctx.restore();
              }
            }
          }
          ctx.restore();
        }

        // 转换为blob并保存
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Failed to create blob'));
          }
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imgUrl;
    });
  };

  // 处理批量导出
  const handleBatchExport = async () => {
    if (!selectedRowKeys.length) {
      message.warning('请选择要导出的商品');
      return;
    }

    try {
      setExporting(true);
      const selectedProducts = products.filter(p => selectedRowKeys.includes(p.id));
      const storeAccount = useSettingsStore.getState().storeAccounts.find(
        store => store.id === currentStore
      );

      // 获取水印设置
      const watermarkText = storeAccount?.watermarkText;
      const watermarkSettings = storeAccount?.features?.watermarkSettings;

      // 创建导出目录
      const dirHandle = await window.showDirectoryPicker();
      
      for (const product of selectedProducts) {
        // 为每个商品创建一个子文件夹
        const productFolderHandle = await dirHandle.getDirectoryHandle(
          `${product.title || '未命名商品'}_${product.id}`,
          { create: true }
        );

        // 导出图片
        if (product.images?.length) {
          const imagesFolderHandle = await productFolderHandle.getDirectoryHandle('images', { create: true });
          
          for (let i = 0; i < product.images.length; i++) {
            const imgUrl = product.images[i];
            const fileName = `商品图片_${i + 1}.jpg`;
            
            try {
              // 使用更新后的saveImage函数
              await saveImage(
                imgUrl,
                fileName,
                addWatermark ? watermarkText : undefined,
                addWatermark ? watermarkSettings : undefined
              );
            } catch (error) {
              console.error('保存图片失败:', error);
              message.error(`保存图片失败: ${error.message}`);
            }
          }
        }

        // 导出其他信息...
      }

      message.success('导出完成');
    } catch (error) {
      console.error('导出失败:', error);
      message.error(`导出失败: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  // 处理导出按钮点击
  const handleExportClick = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的商品');
      return;
    }
    setExportModalVisible(true);
  };

  // 处理导出确认
  const handleExportConfirm = async () => {
    let exportSuccess = false;
    
    try {
      // 行导出逻辑
      await handleBatchExport();
      exportSuccess = true;
      // 导出成功后立即关闭面板
      setExportModalVisible(false);
      setUpdateStatusAfterExport(false);
    } catch (error) {
      console.error('Export failed:', error);
    }

    // 只有在导出成功且勾选了更新状态时，才更新商品状态
    if (exportSuccess && updateStatusAfterExport && selectedRowKeys.length > 0) {
      let successCount = 0;
      let failedProducts: string[] = [];

      // 逐个更新商品状态
      for (const product of selectedRows) {
        try {
          const updatedProduct = {
            ...product,
            status: 'pending' as ProductStatus,
            lastUpdated: new Date().toISOString()
          };
          
          await updateProduct(updatedProduct);
          successCount++;
        } catch (error) {
          console.error(`Failed to update status for product: ${product.name}`, error);
          failedProducts.push(product.name);
        }
      }

      // 根据更新结果显示提示
      if (successCount === selectedRows.length) {
        message.success('商品状态已全部更新为待发布');
      } else if (successCount === 0) {
        message.error('商品状态更新失败');
      } else {
        message.warning(
          `部分商品状态更新成功（${successCount}/${selectedRows.length}）\n` +
          `失败商品：${failedProducts.join('、')}`
        );
      }

      // 刷新商品列表
      fetchProducts();
    }
  };

  // 处理导出取消
  const handleExportCancel = () => {
    setExportModalVisible(false);
    setUpdateStatusAfterExport(false);
  };

  // 批量操作菜单
  const batchOperationMenu = {
    items: [
      {
        key: 'export',
        label: (
          <Button 
            type="text" 
            icon={<ExportOutlined />} 
            onClick={handleExportClick}
            disabled={selectedRowKeys.length === 0}
          >
            批量导出
          </Button>
        )
      },
      {
        key: 'offline',
        label: (
          <Button type="text" danger icon={<StopOutlined />} onClick={handleBatchOffline}>
            批量下架
          </Button>
        )
      },
      {
        key: 'delete',
        label: (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={handleBatchDelete}>
            批量删除
          </Button>
        )
      }
    ]
  };

  // 计算商品完整度
  const calculateCompleteness = (record: Product): number => {
    let total = 0;
    let completed = 0;

    // 基础信息检查
    if (record.name) completed++;
    if (record.category) completed++;
    if (typeof record.price === 'number') completed++;
    if (typeof record.stock === 'number') completed++;
    total += 4;

    // 发货信息检查
    total += 2;
    if (record.deliveryMethod) completed++;
    if (record.deliveryInfo) completed++;

    // 图片检查
    total += 2;
    if (record.coverImage) completed++;
    if (record.commonImages && record.commonImages.length > 0) completed++;

    // 分发内容检查
    total += 2;
    if (record.distributedTitle) completed++;
    if (record.distributedContent) completed++;

    return Math.floor((completed / total) * 100);
  };

  // 获取未填写的项
  const getIncompleteItems = (record: Product): string[] => {
    const incomplete: string[] = [];

    // 基础信息检查
    if (!record.name) incomplete.push('商品名称');
    if (!record.category) incomplete.push('商品分类');
    if (typeof record.price !== 'number') incomplete.push('售价');
    if (typeof record.stock !== 'number') incomplete.push('库存');
    
    // 发货信息检查
    if (!record.deliveryMethod) incomplete.push('发货方式');
    if (!record.deliveryInfo) incomplete.push('发货信息');
    
    // 图片检查
    if (!record.coverImage) incomplete.push('商品头图');
    if (!record.commonImages?.length) incomplete.push('公共图片');
    
    // 分发内容检查
    if (!record.distributedTitle) incomplete.push('商品标题');
    if (!record.distributedContent) incomplete.push('商品文案');

    return incomplete;
  };

  // 处理导出商品
  const handleExport = async (product: Product) => {
    try {
      // 获取当前店铺的水印设置
      const currentStore = storeAccounts.find(store => store.id === product.storeId);
      const watermarkText = currentStore?.watermarkText;
      const watermarkSettings = currentStore?.watermarkSettings;

      // 创建文件夹
      const folderName = `${product.name}【${currentStore?.name || '未知店铺'}】`;
      const dirHandle = await window.showDirectoryPicker();
      const productFolderHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
      const imagesFolderHandle = await productFolderHandle.getDirectoryHandle('images', { create: true });

      // 保存封面图片
      if (product.coverImage) {
        const coverImageBlob = await saveImage(
          product.coverImage,
          addWatermark ? watermarkText : undefined,
          addWatermark ? watermarkSettings : undefined
        );
        const coverImageHandle = await imagesFolderHandle.getFileHandle('封面图片.jpg', { create: true });
        const coverImageWritable = await coverImageHandle.createWritable();
        await coverImageWritable.write(coverImageBlob);
        await coverImageWritable.close();
      }

      // 保存公共图片
      if (product.commonImages?.length > 0) {
        for (let i = 0; i < product.commonImages.length; i++) {
          const image = product.commonImages[i];
          if (image.url) {
            const imageBlob = await saveImage(
              image.url,
              addWatermark ? watermarkText : undefined,
              addWatermark ? watermarkSettings : undefined
            );
            const imageHandle = await imagesFolderHandle.getFileHandle(`公共图片_${i + 1}.jpg`, { create: true });
            const imageWritable = await imageHandle.createWritable();
            await imageWritable.write(imageBlob);
            await imageWritable.close();
          }
        }
      }

      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  const columns: ColumnsType<Product> = [
    {
      title: '商品信息',
      key: 'productInfo',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.distributedTitle && (
            <span className="text-gray-500">{record.distributedTitle}</span>
          )}
          <Space>
            <span className="font-medium">{record.name}</span>
            <Tag>{record.category}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: '店铺',
      key: 'store',
      width: 150,
      render: (_, record) => {
        const store = storeAccounts.find(store => store.id === record.storeId);
        return (
          <Space direction="vertical" size={0}>
            <span>{store?.name || '未知店铺'}</span>
            <Tag color="blue">{store?.platform || '未知平台'}</Tag>
          </Space>
        );
      },
      filters: storeAccounts.map(store => ({
        text: store.name,
        value: store.id,
      })),
      onFilter: (value, record) => record.storeId === value,
    },
    {
      title: '头图',
      key: 'coverImage',
      width: 120,
      render: (_, record) => (
        record.coverImage ? (
          <Image
            src={record.coverImage}
            alt="商品头图"
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
          />
        ) : null
      ),
    },
    {
      title: '价格/库存',
      key: 'priceAndStock',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span className="font-medium text-lg">¥{record.price?.toFixed(2) || '0.00'}</span>
          <span className="text-gray-500">库存: {record.stock || 0}</span>
        </Space>
      ),
      sorter: (a, b) => {
        // 首先按价格排序
        if (a.price !== b.price) {
          return a.price - b.price;
        }
        // 价格相同时按库存排序
        return a.stock - b.stock;
      },
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          pending: { color: 'processing', text: '待发布' },
          published: { color: 'success', text: '已发布' },
          failed: { color: 'error', text: '发布失败' },
          offline: { color: 'default', text: '已下架' },
        };
        const { color, text } = statusMap[record.status];
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{text}</Tag>
            {record.publishedAt && (
              <span className="text-gray-500 text-xs">
                发布于 {dayjs(record.publishedAt).format('YYYY-MM-DD HH:mm')}
              </span>
            )}
          </Space>
        );
      },
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '待发布', value: 'pending' },
        { text: '已发布', value: 'published' },
        { text: '发布失败', value: 'failed' },
        { text: '已下架', value: 'offline' },
      ],
      onFilter: (value, record) => record.status === value,
      sorter: (a, b) => a.status.localeCompare(b.status),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: (
        <Space>
          新建时间
          <Popover 
            content={dateFilterContent}
            trigger="click"
            placement="bottom"
            title="选择日期范围"
          >
            <Button
              type="text"
              icon={<CalendarOutlined style={{ color: '#8c8c8c' }} />}
              size="small"
            />
          </Popover>
        </Space>
      ),
      key: 'createdAt',
      render: (_, record) => dayjs(record.createdAt).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'descend',
    },
    {
      title: '完整度',
      key: 'completeness',
      width: 150,
      render: (_, record) => {
        const percent = calculateCompleteness(record);
        const incomplete = getIncompleteItems(record);
        return (
          <Popover
            content={
              incomplete.length > 0 ? (
                <div>
                  <div className="text-red-500 mb-2">未填写项目：</div>
                  <ul className="list-disc pl-4">
                    {incomplete.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-green-500">所有必填项目已完成</div>
              )
            }
            title="完整度详情"
            trigger="hover"
          >
            <Space direction="vertical" size={0} style={{ width: '100%' }}>
              <Progress percent={percent} size="small" />
              <span className="text-xs text-gray-500">{`${percent}%`}</span>
            </Space>
          </Popover>
        );
      },
      sorter: (a, b) => calculateCompleteness(a) - calculateCompleteness(b),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
          >
            <EditOutlined />
            编辑
          </Button>
          {record.status !== 'offline' && (
            <Button 
              type="link" 
              danger 
              onClick={() => handleOffline(record)}
            >
              <StopOutlined />
              下架
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-4">
          <Space>
            {selectedRowKeys.length > 0 && (
              <Dropdown menu={batchOperationMenu} placement="bottomLeft">
                <Button>
                  <Space>
                    批量操作
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            )}
            <Select
              placeholder="商品状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              options={[
                { label: '全部状态', value: '' },
                { label: '草稿', value: 'draft' },
                { label: '待发布', value: 'pending' },
                { label: '已发布', value: 'published' },
                { label: '发布失败', value: 'failed' },
                { label: '已下架', value: 'offline' },
              ]}
            />
            <Select
              placeholder="商品分类"
              style={{ width: 120 }}
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
              options={[
                { label: '全部分类', value: '' },
                ...(productSettings?.categories?.map(category => ({
                  label: category,
                  value: category,
                })) || [])
              ]}
            />
            <Select
              placeholder="发货方式"
              style={{ width: 160 }}
              value={deliveryMethodFilter}
              onChange={setDeliveryMethodFilter}
              allowClear
              options={[
                { label: '全部发货方式', value: '' },
                ...(deliveryMethods.map(method => ({
                  label: method.label,
                  value: method.value,
                })))
              ]}
            />
            <Select<string>
              placeholder="完整度筛选"
              style={{ width: 160 }}
              value={completenessFilter}
              onChange={setCompletenessFilter}
              allowClear
              options={[
                { label: '全部商品', value: '' },
                { label: '完整商品', value: 'complete' },
                { label: '不完整商品', value: 'incomplete' },
                { type: 'divider' },
                { label: '缺少商品名称', value: 'missing_name' },
                { label: '缺少商品分类', value: 'missing_category' },
                { label: '缺少售价', value: 'missing_price' },
                { label: '缺少库存', value: 'missing_stock' },
                { label: '缺少发货信息', value: 'missing_delivery' },
                { label: '缺少商品头图', value: 'missing_cover' },
                { label: '缺少公共图片', value: 'missing_images' },
                { label: '缺少商品标题', value: 'missing_title' },
                { label: '缺少商品文案', value: 'missing_content' },
              ]}
            />
          </Space>
          <Search
            placeholder="搜索商品名称/分标题"
            style={{ width: 300 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={getFilteredProducts()}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          loading={loading}
        />
      </Card>
      
      {/* 编辑弹窗 */}
      <Modal
        title="编辑商品"
        open={isEditModalVisible}
        onCancel={() => {
          console.log('Closing modal');
          setIsEditModalVisible(false);
          setSelectedProduct(null);
        }}
        footer={null}
        width={800}
        centered
        destroyOnClose
      >
        {selectedProduct ? (
          <>
            {console.log('Rendering EditProductForm with product:', selectedProduct)}
            <EditProductForm
              initialValues={convertProductToSelection(selectedProduct)}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                console.log('Canceling edit');
                setIsEditModalVisible(false);
                setSelectedProduct(null);
              }}
            />
          </>
        ) : (
          <div>No product selected</div>
        )}
      </Modal>
      
      {/* 导出面板 */}
      <Modal
        title="导出商品"
        open={exportModalVisible}
        onOk={handleExportConfirm}
        onCancel={handleExportCancel}
        okText="确认导出"
        cancelText="取消"
      >
        <div className="py-4 space-y-4">
          <div className="text-gray-500 mb-2">
            已选择 {selectedRowKeys.length} 个商品
          </div>
          <Checkbox
            checked={updateStatusAfterExport}
            onChange={(e) => setUpdateStatusAfterExport(e.target.checked)}
          >
            导出后将选中商品状态更新为待发布
          </Checkbox>
          <div>
            <Checkbox
              checked={addWatermark}
              onChange={(e) => setAddWatermark(e.target.checked)}
            >
              添加店铺水印
            </Checkbox>
            <div className="text-gray-400 text-sm ml-6">
              系统会根据图片特征智能选择水印颜色，确保水印清晰可见
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement; 