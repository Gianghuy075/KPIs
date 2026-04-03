import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Row, Col, Alert, Space } from 'antd';
import { PERSPECTIVES } from '../../../utils/kpiUtils';
import { calculateTotalWeight, validateTotalWeight } from '../services/kpiService';

const { Option } = Select;

const AddKPIModal = ({ open, onClose, onSubmit, editingKPI, loading, allKPIs = [] }) => {
  const [form] = Form.useForm();
  const [weightValidation, setWeightValidation] = useState(null);

  useEffect(() => {
    if (open) {
      if (editingKPI) {
        form.setFieldsValue(editingKPI);
      } else {
        form.resetFields();
      }
      updateWeightValidation();
    }
  }, [open, editingKPI, form, allKPIs]);

  const updateWeightValidation = () => {
    // Calculate total weight excluding the KPI being edited
    const kpisForValidation = editingKPI 
      ? allKPIs.filter(k => k.id !== editingKPI.id)
      : allKPIs;
    
    const currentWeight = form.getFieldValue('weight') || 0;
    const totalWeight = calculateTotalWeight(kpisForValidation) + currentWeight;
    
    const validation = validateTotalWeight([
      ...kpisForValidation,
      { weight: currentWeight }
    ]);
    
    setWeightValidation({
      ...validation,
      totalWeight: parseFloat(totalWeight.toFixed(1)),
    });
  };

  const handleWeightChange = () => {
    updateWeightValidation();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Calculate weights for validation
      const kpisForValidation = editingKPI 
        ? allKPIs.filter(k => k.id !== editingKPI.id)
        : allKPIs;
      
      const kpisToValidate = [
        ...kpisForValidation,
        { weight: values.weight }
      ];
      
      const validation = validateTotalWeight(kpisToValidate);
      
      if (!validation.isValid) {
        Modal.error({
          title: 'Lỗi Trọng số',
          content: validation.message,
        });
        return;
      }
      
      await onSubmit(values);
      form.resetFields();
    } catch {
      // validation error handled by form
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={editingKPI ? 'Chỉnh sửa KPI' : 'Thêm KPI mới'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={editingKPI ? 'Cập nhật' : 'Thêm mới'}
      cancelText="Hủy"
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        {weightValidation && (
          <Alert
            message={editingKPI ? 'Cập nhật Trọng số' : 'Kiểm tra Trọng số'}
            description={
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>Tổng trọng số hiện tại: <strong>{weightValidation.totalWeight}%</strong></div>
                {!weightValidation.isValid && (
                  <div style={{ color: '#ff4d4f' }}>
                    ⚠️ {weightValidation.message}
                  </div>
                )}
                {weightValidation.isValid && (
                  <div style={{ color: '#52c41a' }}>
                    ✓ Tổng trọng số hợp lệ (100%)
                  </div>
                )}
              </Space>
            }
            type={weightValidation.isValid ? 'success' : 'warning'}
            style={{ marginBottom: 16 }}
          />
        )}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="perspective"
              label="Góc độ BSC"
              rules={[{ required: true, message: 'Vui lòng chọn góc độ BSC' }]}
            >
              <Select placeholder="Chọn góc độ">
                {Object.values(PERSPECTIVES).map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Tên KPI"
              rules={[
                { required: true, message: 'Vui lòng nhập tên KPI' },
                { min: 3, message: 'Tên KPI phải có ít nhất 3 ký tự' },
              ]}
            >
              <Input placeholder="Nhập tên KPI" maxLength={200} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="weight"
              label="Trọng số (%)"
              rules={[
                { required: true, message: 'Vui lòng nhập trọng số' },
                { type: 'number', min: 0, max: 100, message: 'Trọng số từ 0 đến 100' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="0 - 100"
                min={0}
                max={100}
                precision={1}
                addonAfter="%"
                onChange={handleWeightChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unit"
              label="Đơn vị"
              rules={[{ required: true, message: 'Vui lòng nhập đơn vị' }]}
            >
              <Input placeholder="VD: %, VND, người..." maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="target"
              label="Mục tiêu"
              rules={[
                { required: true, message: 'Vui lòng nhập mục tiêu' },
                { type: 'number', min: 0, message: 'Mục tiêu phải >= 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập giá trị mục tiêu"
                min={0}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/,/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="actual"
              label="Thực tế"
              rules={[
                { required: true, message: 'Vui lòng nhập giá trị thực tế' },
                { type: 'number', min: 0, message: 'Giá trị thực tế phải >= 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Nhập giá trị thực tế"
                min={0}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => v.replace(/,/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="lowerIsBetter"
              label="Giá trị thấp hơn là tốt hơn"
              valuePropName="checked"
              tooltip="Chọn nếu KPI này là chỉ số cần giảm (VD: chi phí, thời gian xử lý)"
            >
              <Switch checkedChildren="Có" unCheckedChildren="Không" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddKPIModal;
