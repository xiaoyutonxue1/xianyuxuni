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

// 发货方式配置
export const deliveryMethods = [
  { 
    label: '百度网盘链接', 
    value: 'baiduDisk',
    placeholder: '请输入百度网盘链接，格式：链接+提取码，例如：https://pan.baidu.com/s/xxx 提取码:1234',
    pattern: '^https://pan\\.baidu\\.com/s/[\\w-]+ 提取码:[\\w]{4}$',
    example: 'https://pan.baidu.com/s/1xxxxxxxx 提取码:abcd'
  },
  { 
    label: '百度网盘群链接', 
    value: 'baiduDiskGroup',
    placeholder: '请输入百度网盘群链接，例如：https://pan.baidu.com/mbox/homepage?short=xxxxxx',
    pattern: '^https://pan\\.baidu\\.com/mbox/homepage\\?short=[\\w-]+$',
    example: 'https://pan.baidu.com/mbox/homepage?short=xxxxxx'
  },
  { 
    label: '百度网盘群口令', 
    value: 'baiduDiskGroupCode',
    placeholder: '请输入百度网盘群口令，例如：#百度网盘共享群#口令：xxxxxx',
    pattern: '^#百度网盘共享群#口令：[\\w-]+$',
    example: '#百度网盘共享群#口令：123456'
  },
  { 
    label: '夸克网盘链接', 
    value: 'quarkDisk',
    placeholder: '请输入夸克网盘链接，格式：链接+提取码，例如：https://pan.quark.cn/s/xxxxxx 提取码:1234',
    pattern: '^https://pan\\.quark\\.cn/s/[\\w-]+ 提取码:[\\w]{4}$',
    example: 'https://pan.quark.cn/s/xxxxxxxx 提取码:abcd'
  },
  { 
    label: '夸克网盘群链接', 
    value: 'quarkDiskGroup',
    placeholder: '请输入夸克网盘群链接，例如：https://pan.quark.cn/group/xxxxxx',
    pattern: '^https://pan\\.quark\\.cn/group/[\\w-]+$',
    example: 'https://pan.quark.cn/group/xxxxxx'
  },
]; 