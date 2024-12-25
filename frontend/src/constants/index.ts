// 发货方式选项
export const deliveryMethods = [
  { label: '百度网盘链接', value: 'baiduDisk' },
  { label: '百度网盘群链接', value: 'baiduDiskGroup' },
  { label: '百度网盘群口令', value: 'baiduDiskGroupCode' },
  { label: '夸克网盘链接', value: 'quarkDisk' },
  { label: '夸克网盘群链接', value: 'quarkDiskGroup' }
];

// 发货方式映射
export const deliveryMethodMap: Record<string, string> = {
  baiduDisk: '百度网盘链接',
  baiduDiskGroup: '百度网盘群链接',
  baiduDiskGroupCode: '百度网盘群口令',
  quarkDisk: '夸克网盘链接',
  quarkDiskGroup: '夸克网盘群链接'
}; 