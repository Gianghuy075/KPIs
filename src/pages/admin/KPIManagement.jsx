import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Row,
  Col,
  Alert,
  message,
  Tooltip,
  Tag,
  Tabs,
  Statistic,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { PERSPECTIVES } from '../../utils/kpiUtils';
import { kpiService, calculateTotalWeight, validateTotalWeight } from '../../features/kpi-management/services/kpiService';

const { Option } = Select;

const DEPARTMENTS = [
  { id: 1, name: 'Ban Lãnh đạo', manager: 'Nguyễn Văn A' },
  { id: 2, name: 'Kinh doanh', manager: 'Trần Thị B' },
  { id: 3, name: 'Kỹ thuật', manager: 'Lê Văn C' },
  { id: 4, name: 'Nhân sự', manager: 'Phạm Thị D' },
];

const UNITS = ['VND', '%', 'đơn vị', 'giờ', 'khách', 'sáng kiến', 'điểm', 'lỗi', 'KH'];

const KPIManagement = () => {
  const [selectedDept, setSelectedDept] = useState(1);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [form] = Form.useForm();
  const [weightValidation, setWeightValidation] = useState(null);

  // Load KPIs when department changes
  useEffect(() => {
    loadDepartmentKPIs();
  }, [selectedDept]);

  const loadDepartmentKPIs = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getDepartmentKPIs(selectedDept);
      setKpis(data || []);
      setWeightValidation(validateTotalWeight(data || []));
    } catch (error) {
      message.error('Không thể tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  const updateWeightValidation = () => {
    const kpisForValidation = editingKPI 
      ? kpis.filter(k => k.id !== editingKPI.id)
      : kpis;
    
    const currentWeight = form.getFieldValue('weight') || 0;
    const validation = validateTotalWeight([
      ...kpisForValidation,
      { weight: currentWeight }
    ]);
    
    setWeightValidation(validation);
  };

  const handleAddKPI = () => {
    setEditingKPI(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEditKPI = (kpi) => {
    setEditingKPI(kpi);
    form.setFieldsValue(kpi);
    setModalOpen(true);
  };

  const handleDeleteKPI = (kpiId) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa KPI này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await kpiService.deleteDepartmentKPI(selectedDept, kpiId);
          message.success('Xóa KPI thành công');
          await loadDepartmentKPIs();
        } catch (error) {
          message.error('Không thể xóa KPI');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      // Validate total weight
      const kpisForValidation = editingKPI 
        ? kpis.filter(k => k.id !== editingKPI.id)
        : kpis;
      
      const validation = validateTotalWeight([
        ...kpisForValidation,
        values
      ]);

      if (!validation.isValid) {
        message.error(validation.message);
        return;
      }

      if (editingKPI) {
        await kpiService.updateDepartmentKPI(selectedDept, editingKPI.id, values);
        message.success('Cập nhật KPI thành công');
      } else {
        await kpiService.addDepartmentKPI(selectedDept, values);
        message.success('Thêm KPI thành công');
      }

      setModalOpen(false);
      form.resetFields();
      await loadDepartmentKPIs();
    } catch (error) {
      message.error(error.message || 'Không thể lưu KPI');
    }
  };

  const handleWeightChange = () => {
    updateWeightValidation();
  };

  const getDepartmentName = (deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    return dept ? dept.name : 'N/A';
  };

  const getDepartmentManager = (deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    return dept ? dept.manager : 'N/A';
  };

  const getPerspectiveColor = (perspective) => {
    const colors = {
      [PERSPECTIVES.FINANCIAL]: 'blue',
      [PERSPECTIVES.CUSTOMER]: 'green',
      [PERSPECTIVES.INTERNAL]: 'orange',
      [PERSPECTIVES.LEARNING]: 'purple',
    };
    return colors[perspective] || 'default';
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Góc độ BSC',
      dataIndex: 'perspective',
      key: 'perspective',
      width: 140,
      render: (perspective) => (
        <Tag color={getPerspectiveColor(perspective)}>{perspective}</Tag>
      ),
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name) => (
        <Tooltip title={name}>
          <span>{name}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Trọng số (%)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'center',
      render: (weight) => <Tag color="blue">{weight}%</Tag>,
    },
    {
      title: 'Mục tiêu',
      dataIndex: 'target',
      key: 'target',
      width: 120,
      align: 'right',
      render: (value, record) => {
        if (!value) return '-';
        const formatted = new Intl.NumberFormat('vi-VN').format(value);
        return `${formatted} ${record.unit || ''}`;
      },
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      align: 'center',
    },
    {
      title: 'Chỉ tiêu thấp tốt',
      dataIndex: 'lowerIsBetter',
      key: 'lowerIsBetter',
      width: 120,
      align: 'center',
      render: (lowerIsBetter) => (
        lowerIsBetter ? 
        <CheckCircleOutlined style={{ color: 'green', fontSize: 16 }} /> : 
        <ClockCircleOutlined style={{ color: 'blue', fontSize: 16 }} />
      ),
    },
    {
      title: 'Ghi chú',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description) => (
        description ? 
        <Tooltip title={description}>
          <span className="text-gray-500">{description.substring(0, 30)}...</span>
        </Tooltip> : 
        '-'
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditKPI(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteKPI(record.id)}
          />
        </Space>
      ),
    },
  ];

  const currentDept = DEPARTMENTS.find(d => d.id === selectedDept);
  const totalWeight = calculateTotalWeight(kpis);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  return (
    <div className="p-4 space-y-6">
      <Card>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Quản lý KPI cho dari Phòng ban</h1>
            <p className="text-gray-600">Xây dựng và quản lý chỉ tiêu KPI cụ thể cho mỗi phòng ban</p>
          </div>

          {/* Department Selection */}
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Form layout="vertical">
                <Form.Item label="Chọn Phòng ban" required>
                  <Select
                    value={selectedDept}
                    onChange={setSelectedDept}
                    placeholder="Chọn phòng ban"
                  >
                    {DEPARTMENTS.map(dept => (
                      <Option key={dept.id} value={dept.id}>
                        {dept.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Form>
            </Col>
            <Col xs={24} sm={12} lg={18}>
              {currentDept && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Row gutter={16}>
                    <Col xs={12} sm={8}>
                      <Statistic
                        title="Phòng ban"
                        value={currentDept.name}
                        valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={12} sm={8}>
                      <Statistic
                        title="Quản lý"
                        value={currentDept.manager}
                        valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                      />
                    </Col>
                    <Col xs={12} sm={8}>
                      <Statistic
                        title="Số KPI"
                        value={kpis.length}
                        valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                      />
                    </Col>
                  </Row>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </Card>

      {/* Weight Validation Alert */}
      {weightValidation && (
        <Alert
          type={isWeightValid ? 'success' : 'error'}
          icon={isWeightValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          message={
            <span>
              <strong>Tổng trọng số:</strong> {totalWeight.toFixed(1)}%{' '}
              {isWeightValid ? '✓' : '(phải bằng 100%)'}
            </span>
          }
          showIcon
          closable
        />
      )}

      {/* KPI Table */}
      <Card
        title={`Danh sách KPI - ${getDepartmentName(selectedDept)}`}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddKPI}
            loading={loading}
          >
            Thêm KPI
          </Button>
        }
      >
        {kpis.length === 0 ? (
          <Empty
            description="Không có KPI nào"
            style={{ marginTop: 48 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={kpis}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, total: kpis.length }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        )}
      </Card>

      {/* Add/Edit KPI Modal */}
      <Modal
        title={editingKPI ? 'Chỉnh sửa KPI' : 'Thêm KPI Mới'}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingKPI(null);
        }}
        width={700}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={() => {
            setTimeout(updateWeightValidation, 0);
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="perspective"
                label="Góc độ BSC"
                rules={[{ required: true, message: 'Vui lòng chọn góc độ' }]}
              >
                <Select placeholder="Chọn góc độ">
                  {Object.values(PERSPECTIVES).map(perspective => (
                    <Option key={perspective} value={perspective}>
                      {perspective}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="weight"
                label="Trọng số (%)"
                rules={[
                  { required: true, message: 'Vui lòng nhập trọng số' },
                  { type: 'number', min: 0, max: 100, message: 'Trọng số từ 0-100' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập trọng số"
                  min={0}
                  max={100}
                  precision={1}
                  onChange={handleWeightChange}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="name"
            label="Tên KPI"
            rules={[{ required: true, message: 'Vui lòng nhập tên KPI' }]}
          >
            <Input placeholder="Nhập tên chỉ tiêu KPI" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="target"
                label="Mục tiêu"
                rules={[{
                  required: true,
                  type: 'number',
                  message: 'Vui lòng nhập mục tiêu'
                }]}
              >
                <InputNumber
                  placeholder="Nhập mục tiêu"
                  style={{ width: '100%' }}
                  formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
                  parser={(value) => parseInt(value.replace(/\./g, ''), 10) || 0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
              >
                <Select placeholder="Chọn đơn vị đo">
                  {UNITS.map(unit => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Ghi chú / Mô tả"
            rules={[{ max: 500, message: 'Ghi chú không quá 500 ký tự' }]}
          >
            <Input.TextArea
              placeholder="Nhập ghi chú hoặc mô tả về KPI này"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="lowerIsBetter"
            valuePropName="checked"
            label="Chỉ tiêu thấp tốt"
            tooltip="Tích chọn nếu giá trị càng thấp càng tốt (ví dụ: chi phí)"
          >
            <Switch />
          </Form.Item>

          {weightValidation && !isWeightValid && (
            <Alert
              type="error"
              message={`Cảnh báo: ${weightValidation.message}`}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default KPIManagement;
