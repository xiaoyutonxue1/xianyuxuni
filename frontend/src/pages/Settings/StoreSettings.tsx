  <Form.Item
    name="cookie"
    label="店铺Cookie"
  >
    <Input.TextArea rows={4} placeholder="请输入店铺Cookie" />
  </Form.Item>

  <Form.Item
    name="watermarkText"
    label="水印文本"
    tooltip="导出商品图片时可选择添加此水印"
  >
    <Input placeholder="请输入水印文本" />
  </Form.Item>

  <Form.Item
    name="status"
    label="状态"
  >
    <Select>
      <Select.Option value="active">正常</Select.Option>
      <Select.Option value="inactive">已停用</Select.Option>
    </Select>
  </Form.Item> 