# Thay đổi - Quản lý Chi nhánh (Phân xưởng)

## 📦 Files được tạo mới

### `src/services/branchService.js`
- Dịch vụ API cho chi nhánh
- CRUD operations: get, create, update, delete

### `src/pages/admin/BranchManagement.jsx`
- Trang quản lý chi nhánh
- Hiển thị danh sách, thêm, sửa, xóa chi nhánh
- Form nhập: Mã, Tên, Địa chỉ, Mô tả

### `BRANCH_MANAGEMENT_GUIDE.md`
- Hướng dẫn sử dụng chi tiết
- Mô hình dữ liệu
- API requirements
- Troubleshooting

## 📝 Files được cập nhật

### `src/pages/admin/DepartmentManagement.jsx`
**Thay đổi:**
- Import branchService
- Thêm state cho `branches`
- Load branches trong `loadData()`
- Thêm cột "Chi nhánh" trong bảng
- Thêm form field chọn chi nhánh (bắt buộc)
- Cập nhật handleEdit để set branchId

**Dòng code:**
- Thêm import branchService
- Thêm branches state
- Cập nhật loadData để load branches
- Thêm branchId column
- Thêm branchId form field
- Cập nhật Select component cho departments

### `src/pages/admin/UserManagement.jsx`
**Thay đổi:**
- Import branchService
- Thêm state cho `branches`
- Load branches trong `loadData()`
- Thêm cột "Chi nhánh" trong bảng
- Thêm form field chọn chi nhánh
- Lọc phòng ban theo chi nhánh đã chọn
- Cập nhật handleEdit để set branchId

**Dòng code:**
- Thêm import branchService
- Thêm branches state
- Cập nhật loadData
- Thêm branch column
- Thêm branchId form field
- Lọc departments theo branchId
- Cập nhật handleEdit

### `src/routes/AppRouter.jsx`
**Thay đổi:**
- Import BranchManagement component
- Thêm route: `/admin/branches` → BranchManagement

**Dòng code:**
- Thêm import BranchManagement
- Thêm Route cho /admin/branches

### `src/layout/MainLayout.jsx`
**Thay đổi:**
- Cập nhật breadcrumbMap với `/admin/branches`
- Thêm "Quản lý Chi nhánh" vào hr-management submenu
- Sắp xếp lại menu items

**Dòng code:**
- Thêm breadcrumb entry
- Thêm menu item cho branches ở vị trí đầu tiên

### `src/constants/roles.js`
**Thay đổi:**
- Thêm BRANCH_MANAGER role
- Cập nhật roleLabels
- Cập nhật legacyRoleMap

**Dòng code:**
```javascript
BRANCH_MANAGER: 'branch_manager',
roleLabels[ROLES.BRANCH_MANAGER]: 'Quản lý chi nhánh',
branch_manager: ROLES.BRANCH_MANAGER,
```

## 🎯 Tính năng chính

✅ **Quản lý Chi nhánh**
- Xem danh sách chi nhánh
- Thêm chi nhánh mới
- Chỉnh sửa thông tin chi nhánh
- Xóa chi nhánh

✅ **Liên kết với Phòng ban**
- Phòng ban bắt buộc phải thuộc chi nhánh
- Hiển thị chi nhánh trong bảng phòng ban

✅ **Liên kết với Nhân viên**
- Khi gán nhân viên, phải chọn chi nhánh trước
- Danh sách phòng ban tự động lọc theo chi nhánh
- Hiển thị chi nhánh trong bảng nhân viên

✅ **Menu Navigation**
- Thêm "Quản lý Chi nhánh" vào menu chính
- Breadcrumb tự động cập nhật

✅ **Role Management**
- Thêm role BRANCH_MANAGER (chuẩn bị cho tương lai)
- Hiện tại chỉ SENIOR_MANAGER quản lý chi nhánh

## 📊 Cấu trúc Dữ liệu

```
Quản lý cấp cao
    └─ Chi nhánh (Branch)
        ├─ Mã: BR001
        ├─ Tên: Phân xưởng A
        ├─ Địa chỉ: ...
        └─ Phòng ban (Department)
            ├─ Phòng IT
            ├─ Phòng Kế toán
            └─ Phòng nhân sự
                └─ Nhân viên (Employee)
                    ├─ Nguyễn Văn A
                    ├─ Trần Thị B
                    └─ ...
```

## 🚀 Tiếp theo

Backend cần implement:
1. Model/Schema cho Branch
2. API endpoints cho `/branches`
3. Cập nhật Department schema thêm `branchId`
4. Middleware authorization cho branch_manager role
5. Validation khi xóa branch (check dependencies)

## 📌 Ghi chú

- Tất cả component đều dùng Ant Design components
- Sử dụng async/await cho API calls
- Error handling với message notifications
- Loading states khi fetch dữ liệu
- Form validation cho các trường bắt buộc
- Xác nhận trước khi xóa (Modal confirm)
