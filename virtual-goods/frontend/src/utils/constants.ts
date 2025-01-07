// 商品分类选项
export const categoryOptions = [
  { label: '学习资料', value: 'study' },
  { label: '日剧', value: 'japanese_drama' },
  { label: '美剧', value: 'american_drama' },
  { label: '漫画', value: 'manga' },
  { label: '韩剧', value: 'korean_drama' },
  { label: '国内电视剧', value: 'chinese_drama' },
  { label: '动漫', value: 'anime' },
  { label: '电子书', value: 'ebook' },
  { label: '电影', value: 'movie' },
];

// 发货方式选项
export const deliveryMethods = [
  { 
    label: '百度网盘链接', 
    value: 'baiduDisk',
    pattern: '^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$',
    example: '示例: https://pan.baidu.com/s/abc123',
    placeholder: '请输入百度网盘分享链接'
  },
  { 
    label: '百度网盘群链接', 
    value: 'baiduDiskGroup',
    pattern: '^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$',
    example: '示例: https://pan.baidu.com/s/abc123',
    placeholder: '请输入百度网盘群分享链接'
  },
  { 
    label: '百度网盘群口令', 
    value: 'baiduDiskGroupCode',
    pattern: '^[a-zA-Z0-9]{4}$',
    example: '示例: abc1',
    placeholder: '请输入4位提取码'
  },
  { 
    label: '夸克网盘链接', 
    value: 'quarkDisk',
    pattern: '^https?://pan\\.quark\\.cn/s/[a-zA-Z0-9]+$',
    example: '示例: https://pan.quark.cn/s/abc123',
    placeholder: '请输入夸克网盘分享链接'
  },
  { 
    label: '夸克网盘群链接', 
    value: 'quarkDiskGroup',
    pattern: '^https?://pan\\.quark\\.cn/s/[a-zA-Z0-9]+$',
    example: '示例: https://pan.quark.cn/s/abc123',
    placeholder: '请输入夸克网盘群分享链接'
  }
];

// 发货方式映射
export const deliveryMethodMap: Record<string, string> = {
  baiduDisk: '百度网盘链接',
  baiduDiskGroup: '百度网盘群链接',
  baiduDiskGroupCode: '百度网盘群口令',
  quarkDisk: '夸克网盘链接',
  quarkDiskGroup: '夸克网盘群链接'
};

// 发货信息配置
export const deliveryInfoConfig = {
  baiduDisk: {
    pattern: '^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$',
    example: '示例: https://pan.baidu.com/s/abc123',
    placeholder: '请输入百度网盘分享链接'
  },
  baiduDiskGroup: {
    pattern: '^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$',
    example: '示例: https://pan.baidu.com/s/abc123',
    placeholder: '请输入百度网盘群分享链接'
  },
  baiduDiskGroupCode: {
    pattern: '^[a-zA-Z0-9]{4}$',
    example: '示例: abc1',
    placeholder: '请输入4位提取码'
  },
  quarkDisk: {
    pattern: '^https?://pan\\.quark\\.cn/s/[a-zA-Z0-9]+$',
    example: '示例: https://pan.quark.cn/s/abc123',
    placeholder: '请输入夸克网盘分享链接'
  },
  quarkDiskGroup: {
    pattern: '^https?://pan\\.quark\\.cn/s/[a-zA-Z0-9]+$',
    example: '示例: https://pan.quark.cn/s/abc123',
    placeholder: '请输入夸克网盘群分享链接'
  }
}; 