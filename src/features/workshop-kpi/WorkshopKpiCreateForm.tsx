import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Space, Spin, Table, Tag, message } from 'antd';
import { Plus, Send, Trash2 } from 'lucide-react';
import workshopKpiService from '../../services/workshopKpiService';
import { BSC_COLORS } from '../../constants/bsc';
import { KPI_COLORS } from '../../constants/uiTokens';
import { getCurrentYear, getYearRange } from '../../constants/year';
import type {
  ApiBscCategory,
  ApiKpi,
  ApiPenaltyLogic,
  ApiWorkshop,
  UpsertKpiBulkItemRequest,
  UUID,
} from '../../types/api';

type KpiDraftRow = {
  tempId: string;
  source: 'existing' | 'new';
  id?: string;
  originalWeight?: number;
  bscCategoryId: string;
  name: string;
  targetValue: string;
  targetUnit: string;
  weight: number;
  penaltyLogicId: string;
};

type WorkshopKpiCreateFormProps = {
  workshops: ApiWorkshop[];
  bscCategories: ApiBscCategory[];
  years?: number[];
  penaltyLogics: ApiPenaltyLogic[];
  initialYear?: string;
  initialWorkshopId?: UUID | null;
  onUpsertKpis: (
    payloads: UpsertKpiBulkItemRequest[],
    workshopId: UUID,
    year: string,
  ) => Promise<void>;
};

const createDraftRow = (defaultBscId: string, defaultPenaltyId = ''): KpiDraftRow => ({
  tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  source: 'new',
  bscCategoryId: defaultBscId,
  name: '',
  targetValue: '',
  targetUnit: '',
  weight: 5,
  penaltyLogicId: defaultPenaltyId,
});

const mapExistingKpiToRow = (kpi: ApiKpi): KpiDraftRow => ({
  tempId: `existing-${kpi.id}`,
  source: 'existing',
  id: kpi.id,
  bscCategoryId: kpi.bscCategoryId,
  name: kpi.name || '',
  targetValue: String(kpi.targetValue ?? ''),
  targetUnit: kpi.targetUnit || '',
  weight: Number(kpi.weight || 0),
  originalWeight: Number(kpi.weight || 0),
  penaltyLogicId: kpi.penaltyLogicId || '',
});

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { message?: string | string[] } } }).response?.data
      ?.message
  ) {
    const messageValue = (error as { response?: { data?: { message?: string | string[] } } })
      .response?.data?.message;
    return Array.isArray(messageValue) ? messageValue.join(', ') : String(messageValue);
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const WorkshopKpiCreateForm = ({
  workshops,
  bscCategories,
  years,
  penaltyLogics,
  initialYear,
  initialWorkshopId,
  onUpsertKpis,
}: WorkshopKpiCreateFormProps) => {
  const defaultBscId = bscCategories[0]?.id ?? '';
  const defaultPenaltyId = penaltyLogics[0]?.id ?? '';
  const currentYear = getCurrentYear();
  const yearList = years?.length ? years : getYearRange(currentYear);

  const [formYear, setFormYear] = useState(initialYear ?? String(yearList[0]));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<UUID | null>(
    initialWorkshopId ?? workshops[0]?.id ?? null,
  );
  const [rows, setRows] = useState<KpiDraftRow[]>([
    createDraftRow(defaultBscId, defaultPenaltyId),
  ]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedWorkshopId && workshops.length) {
      setSelectedWorkshopId(workshops[0].id);
    }
  }, [selectedWorkshopId, workshops]);

  useEffect(() => {
    if (!formYear || !selectedWorkshopId) {
      setRows([createDraftRow(defaultBscId, defaultPenaltyId)]);
      return;
    }

    let mounted = true;
    setLoadingExisting(true);

    workshopKpiService
      .list({ year: Number(formYear), phanXuongId: selectedWorkshopId })
      .then((kpis) => {
        if (!mounted) return;
        const existingRows = (kpis || []).map(mapExistingKpiToRow);
        setRows([...existingRows, createDraftRow(defaultBscId, defaultPenaltyId)]);
      })
      .catch((error) => {
        if (!mounted) return;
        message.error(extractErrorMessage(error, 'Không thể tải KPI hiện có'));
        setRows([createDraftRow(defaultBscId, defaultPenaltyId)]);
      })
      .finally(() => {
        if (mounted) setLoadingExisting(false);
      });

    return () => {
      mounted = false;
    };
  }, [defaultBscId, defaultPenaltyId, formYear, selectedWorkshopId]);

  const updateRow = (
    tempId: string,
    field: keyof Pick<KpiDraftRow, 'bscCategoryId' | 'name' | 'targetValue' | 'targetUnit' | 'weight' | 'penaltyLogicId'>,
    value: string | number,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.tempId !== tempId) return row;
        if (row.source === 'existing' && field !== 'weight') return row;
        return { ...row, [field]: value };
      }),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createDraftRow(defaultBscId, defaultPenaltyId)]);
  };

  const removeRow = (tempId: string) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.tempId !== tempId);
      const hasDraft = next.some((row) => row.source === 'new');
      if (!hasDraft) next.push(createDraftRow(defaultBscId, defaultPenaltyId));
      return next;
    });
  };

  const existingRows = rows.filter((row) => row.source === 'existing');
  const newRows = rows.filter((row) => row.source === 'new');
  const validNewRows = newRows.filter(
    (row) => row.name.trim() && row.targetValue.toString().trim(),
  );
  const changedExistingRows = existingRows.filter(
    (row) => Math.abs(Number(row.weight || 0) - Number(row.originalWeight || 0)) > 0.0001,
  );
  const hasChanges = changedExistingRows.length > 0 || validNewRows.length > 0;

  const totalWeight = [...existingRows, ...validNewRows].reduce(
    (sum, row) => sum + Number(row.weight || 0),
    0,
  );
  const existingCount = existingRows.length;

  const bscMap = useMemo(
    () =>
      Object.fromEntries(
        bscCategories.map((category) => [category.id, category.name]),
      ),
    [bscCategories],
  );

  const penaltyMap = useMemo(
    () =>
      Object.fromEntries(
        penaltyLogics.map((penalty) => [penalty.id, penalty.name]),
      ),
    [penaltyLogics],
  );

  const bscOptions = bscCategories.map((category) => ({
    value: category.id,
    label: (
      <span
        style={{
          display: 'inline-flex',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          ...(BSC_COLORS[category.name] || {}),
        }}
      >
        {category.name}
      </span>
    ),
  }));

  const penaltyOptions = penaltyLogics.map((logic) => ({
    value: logic.id,
    label: <span style={{ fontSize: 12 }}>{logic.name}</span>,
  }));

  const yearOptions = yearList.map((year) => ({
    value: String(year),
    label: String(year),
  }));

  const workshopOptions = workshops.map((workshop) => ({
    value: workshop.id,
    label: workshop.name,
  }));

  const handleSubmitAll = async () => {
    if (!selectedWorkshopId) {
      message.error('Vui lòng chọn phân xưởng');
      return;
    }

    if (!hasChanges) {
      message.error('Chưa có thay đổi để lưu');
      return;
    }

    if (Math.round(totalWeight * 100) / 100 !== 100) {
      message.error('Tổng trọng số tất cả KPI (đã có + thêm mới) phải bằng 100%');
      return;
    }

    const payloads: UpsertKpiBulkItemRequest[] = [
      ...changedExistingRows.map((row) => ({
        id: row.id,
        weight: Number(row.weight),
      })),
      ...validNewRows.map((row) => ({
        bscCategoryId: row.bscCategoryId,
        name: row.name.trim(),
        targetValue: Number(row.targetValue),
        targetUnit: row.targetUnit.trim(),
        weight: Number(row.weight),
        penaltyLogicId: row.penaltyLogicId || undefined,
      })),
    ];

    setSubmitting(true);
    try {
      await onUpsertKpis(payloads, selectedWorkshopId, formYear);
    } catch (error) {
      // Error message is handled by parent container.
      void error;
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Viễn cảnh BSC',
      dataIndex: 'bscCategoryId',
      width: 180,
      render: (value: string, row: KpiDraftRow) => {
        if (row.source === 'existing') {
          const bscName = bscMap[value] || 'Khác';
          return (
            <span
              style={{
                display: 'inline-flex',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                ...(BSC_COLORS[bscName] || {}),
              }}
            >
              {bscName}
            </span>
          );
        }

        return (
          <Select
            value={value}
            onChange={(nextValue) => updateRow(row.tempId, 'bscCategoryId', nextValue)}
            options={bscOptions}
            size="small"
            style={{ width: '100%' }}
            variant="borderless"
          />
        );
      },
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      render: (value: string, row: KpiDraftRow) =>
        row.source === 'existing' ? (
          <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{value}</span>
        ) : (
          <Input
            size="small"
            value={value}
            onChange={(event) => updateRow(row.tempId, 'name', event.target.value)}
            placeholder="Nhập tên KPI..."
            variant="borderless"
          />
        ),
    },
    {
      title: 'Giá trị',
      dataIndex: 'targetValue',
      width: 110,
      render: (value: string, row: KpiDraftRow) =>
        row.source === 'existing' ? (
          <span style={{ color: KPI_COLORS.foreground }}>{value}</span>
        ) : (
          <Input
            size="small"
            value={value}
            onChange={(event) => updateRow(row.tempId, 'targetValue', event.target.value)}
            placeholder="VD: 500"
            variant="borderless"
          />
        ),
    },
    {
      title: 'Đơn vị',
      dataIndex: 'targetUnit',
      width: 120,
      render: (value: string, row: KpiDraftRow) =>
        row.source === 'existing' ? (
          <span style={{ color: KPI_COLORS.muted }}>{value || '—'}</span>
        ) : (
          <Input
            size="small"
            value={value}
            onChange={(event) => updateRow(row.tempId, 'targetUnit', event.target.value)}
            placeholder="VD: tấn, %, giờ"
            variant="borderless"
          />
        ),
    },
    {
      title: 'Trọng số (%)',
      dataIndex: 'weight',
      width: 100,
      align: 'center',
      render: (value: number, row: KpiDraftRow) => (
        <Input
          size="small"
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(event) =>
            updateRow(
              row.tempId,
              'weight',
              Math.max(0, Math.min(100, Number(event.target.value) || 0)),
            )
          }
          style={{
            textAlign: 'center',
            fontWeight: row.source === 'existing' ? 700 : 500,
            color:
              row.source === 'existing' &&
              Math.abs(Number(row.weight || 0) - Number(row.originalWeight || 0)) > 0.0001
                ? KPI_COLORS.primary
                : undefined,
          }}
          variant="borderless"
        />
      ),
    },
    {
      title: 'Logic trừ điểm',
      dataIndex: 'penaltyLogicId',
      width: 190,
      render: (value: string, row: KpiDraftRow) =>
        row.source === 'existing' ? (
          <span style={{ color: KPI_COLORS.muted }}>{penaltyMap[value] || '—'}</span>
        ) : (
          <Select
            value={value}
            onChange={(nextValue) => updateRow(row.tempId, 'penaltyLogicId', nextValue)}
            options={penaltyOptions}
            size="small"
            style={{ width: '100%' }}
            placeholder="Chọn..."
            variant="borderless"
          />
        ),
    },
    {
      title: '',
      key: 'action',
      width: 56,
      align: 'center',
      render: (_: unknown, row: KpiDraftRow) =>
        row.source === 'new' && newRows.length > 1 ? (
          <Button
            type="text"
            size="small"
            icon={<Trash2 size={14} />}
            onClick={() => removeRow(row.tempId)}
            style={{ color: KPI_COLORS.danger }}
          />
        ) : null,
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: KPI_COLORS.muted,
            }}
          >
            Năm
          </label>
          <Select
            value={formYear}
            onChange={setFormYear}
            options={yearOptions}
            style={{ width: 110 }}
            size="small"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 260 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: KPI_COLORS.muted,
            }}
          >
            Phân xưởng
          </label>
          <Select
            value={selectedWorkshopId}
            onChange={setSelectedWorkshopId}
            options={workshopOptions}
            placeholder="Chọn 1 phân xưởng"
            style={{ width: '100%' }}
            size="small"
          />
        </div>
      </div>

      <div
        style={{
          background: KPI_COLORS.card,
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: `1px solid ${KPI_COLORS.border}`,
          overflow: 'hidden',
        }}
      >
        {loadingExisting ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="tempId"
            pagination={false}
            size="small"
            footer={() => (
              <Button
                type="text"
                size="small"
                icon={<Plus size={14} />}
                onClick={addRow}
                style={{
                  width: '100%',
                  color: KPI_COLORS.muted,
                  fontSize: 12,
                }}
              >
                Thêm dòng KPI
              </Button>
            )}
          />
        )}
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Space size="small" wrap>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: Math.abs(totalWeight - 100) < 0.0001 ? KPI_COLORS.success : KPI_COLORS.warning,
            }}
          >
            Tổng trọng số: {Math.round(totalWeight * 100) / 100}%
          </span>
          <Tag color="blue" style={{ marginInlineEnd: 0 }}>
            KPI hiện có: {existingCount}
          </Tag>
          <Tag color="gold" style={{ marginInlineEnd: 0 }}>
            Đã sửa trọng số cũ: {changedExistingRows.length}
          </Tag>
        </Space>

        <Button
          type="primary"
          icon={<Send size={16} />}
          onClick={handleSubmitAll}
          loading={submitting}
          disabled={loadingExisting || !hasChanges}
        >
          Lưu KPI
        </Button>
      </div>
    </div>
  );
};

export default WorkshopKpiCreateForm;
