# Hướng dẫn Quản lý Chi nhánh (Phân xưởng)

## Tổng quan

Hệ thống hiện nay đã được cập nhật với cấu trúc quản lý phân cấp mới:

```
Quản lý cấp cao (Senior Manager)
    ↓
    Chi nhánh (Branch)
        ↓
        Phòng ban (Department)
            ↓
            Nhân viên (Employee)
```

## Những thay đổi được thực hiện

### 1. **Dịch vụ Chi nhánh** (`src/services/branchService.js`)
- CRUD operations cho chi nhánh
- API endpoints: `/branches`
- Các phương thức:
  - `getBranches()` - Lấy danh sách tất cả chi nhánh
  - `createBranch(payload)` - Tạo chi nhánh mới
  - `updateBranch(id, payload)` - Cập nhật chi nhánh
  - `deleteBranch(id)` - Xóa chi nhánh
  - `getBranchWithDepartments(id)` - Lấy chi nhánh cùng phòng ban của nó

### 2. **Trang Quản lý Chi nhánh** (`src/pages/admin/BranchManagement.jsx`)
- Hiển thị danh sách chi nhánh dưới dạng bảng
- Cho phép thêm, sửa, xóa chi nhánh
- Các trường thông tin:
  - **Mã chi nhánh** (Code)
  - **Tên chi nhánh** (Name)
  - **Địa chỉ** (Address)
  - **Mô tả** (Description)

### 3. **Cập nhật Quản lý Phòng ban** (`src/pages/admin/DepartmentManagement.jsx`)
- Thêm trường chọn chi nhánh khi tạo/sửa phòng ban
- Hiển thị cột "Chi nhánh" trong bảng danh sách phòng ban
- Departments hiện liên kết với Branch thông qua `branchId`

### 4. **Cập nhật Quản lý Nhân viên** (`src/pages/admin/UserManagement.jsx`)
- Thêm trường chọn chi nhánh
- Khi chọn chi nhánh, danh sách phòng ban sẽ tự động lọc theo chi nhánh đó
- Hiển thị cột "Chi nhánh" trong bảng danh sách nhân viên

### 5. **Cập nhật Routing** (`src/routes/AppRouter.jsx`)
- Thêm route: `/admin/branches` → `BranchManagement`
- Chỉ có `senior_manager` role mới có quyền truy cập

### 6. **Cập nhật Menu Navigation** (`src/layout/MainLayout.jsx`)
- Thêm "Quản lý Chi nhánh" vào submenu "Quản lý Nhân sự"
- Cập nhật breadcrumb map

### 7. **Cập nhật Roles** (`src/constants/roles.js`)
- Thêm role mới: `BRANCH_MANAGER` (Quản lý chi nhánh)
- Cập nhật roleLabels
- Cấu trúc role hiện tại:
  - `senior_manager` - Quản lý cấp cao
  - `branch_manager` - Quản lý chi nhánh (chuẩn bị cho tương lai)
  - `department_manager` - Quản lý phòng ban
  - `employee` - Nhân viên

## Phân quyền

### Quản lý cấp cao (Senior Manager)
- ✅ Quản lý chi nhánh (CRUD)
- ✅ Quản lý phòng ban
- ✅ Quản lý nhân viên
- ✅ Quản lý KPI
- ✅ Quản lý thông báo

## Quy trình sử dụng

### 1. Tạo Chi nhánh
1. Vào **Quản lý Nhân sự** → **Quản lý Chi nhánh**
2. Click **"Thêm chi nhánh"**
3. Nhập thông tin:
   - Mã chi nhánh (ví dụ: BR001, BR002)
   - Tên chi nhánh (ví dụ: Phân xưởng A, Phân xưởng B)
   - Địa chỉ (tùy chọn)
   - Mô tả (tùy chọn)
4. Click **OK** để lưu

### 2. Tạo Phòng ban
1. Vào **Quản lý Nhân sự** → **Quản lý Phòng ban**
2. Click **"Thêm phòng ban"**
3. Nhập thông tin:
   - **Chi nhánh** (bắt buộc) - chọn chi nhánh mà phòng ban thuộc về
   - **Tên phòng ban** (bắt buộc)
   - **Mô tả** (tùy chọn)
4. Click **OK** để lưu

### 3. Gán nhân viên
1. Vào **Quản lý Nhân sự** → **Quản lý Nhân viên**
2. Click **"Thêm nhân viên"** hoặc sửa nhân viên hiện tại
3. Chọn:
   - **Chi nhánh** (bắt buộc)
   - **Phòng ban** (bắt buộc - sẽ lọc theo chi nhánh đã chọn)
   - **Quản lý bởi** - chọn trưởng phòng
4. Nhập các thông tin khác
5. Click **OK** để lưu

## Mô hình dữ liệu (Data Model)

### Branch (Chi nhánh)
```javascript
{
  _id: String,
  code: String,        // Mã chi nhánh
  name: String,        // Tên chi nhánh
  address: String,     // Địa chỉ
  description: String, // Mô tả
  createdAt: Date,
  updatedAt: Date
}
```

### Department (Phòng ban) - Cập nhật
```javascript
{
  _id: String,
  branchId: String,    // [NEW] Liên kết tới chi nhánh
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### User (Nhân viên) - Cập nhật
```javascript
{
  _id: String,
  username: String,
  email: String,
  role: String,
  departmentId: String,
  managedBy: String,
  password: String,
  createdAt: Date,
  updatedAt: Date
}
```

### UserProfile - Cập nhật
```javascript
{
  _id: String,
  user: String,        // ID của user
  fullName: String,
  employeeCode: String,
  phone: String,
  address: String,
  avatar: String,
  dateOfBirth: Date,
  startDate: Date,
  gender: String,      // 'male', 'female', 'other'
  status: String,      // 'active', 'on_leave', 'inactive'
  title: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Backend API Requirements

Các endpoint cần được thêm/cập nhật trên backend:

### Chi nhánh
```
GET    /api/branches              - Danh sách chi nhánh
POST   /api/branches              - Tạo chi nhánh
GET    /api/branches/:id          - Chi tiết chi nhánh
PATCH  /api/branches/:id          - Cập nhật chi nhánh
DELETE /api/branches/:id          - Xóa chi nhánh
GET    /api/branches/:id/departments - Chi nhánh + phòng ban
```

### Phòng ban (Cập nhật)
- Thêm trường `branchId` vào model Department
- Lọc phòng ban theo `branchId` nếu cần

### Nhân viên (Cập nhật)
- Kiểm tra `branchId` khi gán nhân viên vào phòng ban

## Tính năng có thể mở rộng trong tương lai

1. **Quản lý Chi nhánh theo Branch Manager**
   - Thêm menu riêng cho branch_manager role
   - Cho phép branch_manager quản lý phòng ban trong chi nhánh của họ

2. **Dashboard Chi nhánh**
   - Xem tổng thể KPI theo chi nhánh
   - So sánh hiệu suất giữa các chi nhánh

3. **Báo cáo Chi nhánh**
   - Báo cáo nhân viên theo chi nhánh
   - Báo cáo KPI theo chi nhánh

4. **Gán quản lý cho Chi nhánh**
   - Mỗi chi nhánh có một branch manager
   - Quản lý cáp cao có thể view/manage chi nhánh của các manager khác nhau

## Troubleshooting

### Phòng ban không hiển thị khi chọn chi nhánh
- Kiểm tra xem phòng ban đã được gán `branchId` đúng hay chưa
- Refresh trang để tải lại dữ liệu

### Chi nhánh không thể xóa
- Kiểm tra xem có phòng ban nào liên kết với chi nhánh không
- Backend có thể prevent xóa chi nhánh nếu có phòng ban con

## Liên hệ
Nếu có vấn đề hoặc cần hỗ trợ, vui lòng liên hệ với team phát triển.
