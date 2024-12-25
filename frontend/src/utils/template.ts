// 发货方式映射
const deliveryMethodMap: Record<string, string> = {
  baiduDisk: '百度网盘链接',
  baiduGroupLink: '百度网盘群链接',
  baiduGroupCode: '百度网盘群码',
  teambitionLink: '夸克网盘链接',
  teambitionDisk: '夸克网盘群链接'
};

// 替换模板中的占位符
export const replaceTemplate = (template: string, values: Record<string, any>) => {
  return template.replace(/(?:#(\d+))?\{([^}]+)\}/g, (match, length, key) => {
    let value = values[key];
    if (value === undefined) return match;

    // 如果是发货方式，先转换为中文
    if (key === 'deliveryMethod' && typeof value === 'string') {
      value = deliveryMethodMap[value] || value;
    }

    const strValue = String(value);
    return length ? strValue.slice(0, parseInt(length, 10)) : strValue;
  });
};

// 替换模板中的标题
export const replaceTemplateTitle = (template: string, values: Record<string, any>) => {
  return replaceTemplate(template, values);
};

// 替换模板中的内容
export const replaceTemplateContent = (template: string, values: Record<string, any>) => {
  return replaceTemplate(template, values);
}; 