// config/permissions.js
const PERMISSIONS = {
  // Nhóm Sản phẩm
  PRODUCT_VIEW: { code: "PRODUCT_VIEW", name: "Xem danh sách sản phẩm" },
  PRODUCT_CREATE: { code: "PRODUCT_CREATE", name: "Thêm sản phẩm mới" },
  PRODUCT_UPDATE: { code: "PRODUCT_UPDATE", name: "Cập nhật sản phẩm" },
  PRODUCT_DELETE: { code: "PRODUCT_DELETE", name: "Xóa sản phẩm" },
  PRODUCT_SET_DISCOUNT: {
    code: "PRODUCT_SET_DISCOUNT",
    name: "Thiết lập giảm giá",
  },
  PRODUCT_VIEW_DETAIL: {
    code: "PRODUCT_VIEW_DETAIL",
    name: "Xem chi tiết sản phẩm",
  },

  // Nhóm Biến thể
  VARIANT_CREATE: { code: "VARIANT_CREATE", name: "Thêm biến thể sản phẩm" },
  VARIANT_UPDATE: { code: "VARIANT_UPDATE", name: "Cập nhật biến thể" },
  VARIANT_DELETE: { code: "VARIANT_DELETE", name: "Xóa biến thể" },

  // Nhóm Thể loại
  CATEGORY_VIEW: { code: "CATEGORY_VIEW", name: "Xem danh mục thể loại" },
  CATEGORY_CREATE: { code: "CATEGORY_CREATE", name: "Thêm thể loại" },
  CATEGORY_UPDATE: { code: "CATEGORY_UPDATE", name: "Cập nhật thể loại" },
  CATEGORY_DELETE: { code: "CATEGORY_DELETE", name: "Xóa thể loại" },

  // Nhóm Nhà cung cấp
  SUPPLIER_VIEW: { code: "SUPPLIER_VIEW", name: "Xem nhà cung cấp" },
  SUPPLIER_CREATE: { code: "SUPPLIER_CREATE", name: "Thêm nhà cung cấp" },
  SUPPLIER_UPDATE: {
    code: "SUPPLIER_UPDATE",
    name: "Sửa thông tin nhà cung cấp",
  },
  SUPPLIER_COLLABORATE: {
    code: "SUPPLIER_COLLABORATE",
    name: "Quản lý hợp tác",
  },

  // Nhóm Bộ sưu tập
  COLLECTION_VIEW: { code: "COLLECTION_VIEW", name: "Xem bộ sưu tập" },
  COLLECTION_CREATE: { code: "COLLECTION_CREATE", name: "Thêm bộ sưu tập" },
  COLLECTION_UPDATE: { code: "COLLECTION_UPDATE", name: "Sửa bộ sưu tập" },
  COLLECTION_COLLABORATE: {
    code: "COLLECTION_COLLABORATE",
    name: "Quản lý hiển thị bộ sưu tập",
  },

  // Nhóm Mã khuyến mãi
  VOUCHER_VIEW: { code: "VOUCHER_VIEW", name: "Xem danh sách mã giảm giá" },
  VOUCHER_CREATE: { code: "VOUCHER_CREATE", name: "Tạo mã giảm giá" },
  VOUCHER_UPDATE: { code: "VOUCHER_UPDATE", name: "Sửa mã giảm giá" },
  VOUCHER_CHANGE_STATUS: {
    code: "VOUCHER_CHANGE_STATUS",
    name: "Bật/Tắt mã giảm giá",
  },

  // Nhóm Đơn hàng
  ORDER_VIEW: { code: "ORDER_VIEW", name: "Xem danh sách đơn hàng" },
  ORDER_UPDATE_STATUS: {
    code: "ORDER_UPDATE_STATUS",
    name: "Cập nhật trạng thái đơn hàng",
  },
  ORDER_REQUEST_EXCHANGE: {
    code: "ORDER_REQUEST_EXCHANGE",
    name: "Xử lý yêu cầu đổi trả",
  },
  ORDER_CONFIRM_EXCHANGE: {
    code: "ORDER_CONFIRM_EXCHANGE",
    name: "Xác nhận đổi hàng",
  },

  // Nhóm Nhân viên
  EMPLOYEE_VIEW: { code: "EMPLOYEE_VIEW", name: "Xem danh sách nhân viên" },
  EMPLOYEE_CREATE: { code: "EMPLOYEE_CREATE", name: "Tạo tài khoản nhân viên" },
  EMPLOYEE_UPDATE_STATUS: {
    code: "EMPLOYEE_UPDATE_STATUS",
    name: "Khóa/Mở khóa tài khoản",
  },
  EMPLOYEE_GRANT: {
    code: "EMPLOYEE_GRANT",
    name: "Cấp các quyền cho nhân viên",
  },
  // Nhóm Kho
  WAREHOUSE_VIEW: { code: "WAREHOUSE_VIEW", name: "Xem kho hàng" },
  WAREHOUSE_VIEW_DETAIL: {
    code: "WAREHOUSE_VIEW_DETAIL",
    name: "Xem chi tiết nhập/xuất",
  },
  WAREHOUSE_CREATE_BILL: {
    code: "WAREHOUSE_CREATE_BILL",
    name: "Tạo phiếu nhập, xuất, điều chỉnh kho",
  },

  //Nhóm người dùng
  USER_VIEW: {
    code: "USER_VIEW",
    name: "Xem danh sách người dùng",
  },

  USER_UPDATE_STATUS_ACCOUNT: {
    code: "USER_UPDATE_STATUS_ACCOUNT",
    name: "Cập nhật trạng thái tài khoản của người dùng",
  },

  //Nhóm quản lý bài đánh giá
  REVIEW_VIEW: {
    code: "REVIEW_VIEW",
    name: "Xem danh sách đánh giá từ khách hàng",
  },
  REVIEW_TOGGLE_STATUS: {
    code: "REVIEW_TOGGLE_STATUS",
    name: "Ẩn/Hiện bài đánh giá trên website",
  },

  // Nhóm Thống kê và Tư vấn
  STATISTICAL: { code: "STATISTICAL", name: "Xem báo cáo thống kê doanh thu" },
  CONSULT_MANAGER: {
    code: "CONSULT_MANAGER",
    name: "Quản lý tư vấn và Chat khách hàng",
  },
};

const PERMISSIONS_GROUP = {
  // Nhóm quản lý toàn bộ Sản phẩm, Biến thể và Thể loại
  MANAGE_PRODUCT: {
    code: "MANAGE_PRODUCT",
    name: "Quản lý sản phẩm và danh mục",
    list: [
      PERMISSIONS.PRODUCT_VIEW.code,
      PERMISSIONS.PRODUCT_CREATE.code,
      PERMISSIONS.PRODUCT_UPDATE.code,
      PERMISSIONS.PRODUCT_DELETE.code,
      PERMISSIONS.PRODUCT_SET_DISCOUNT.code,
      PERMISSIONS.PRODUCT_VIEW_DETAIL.code,
      PERMISSIONS.VARIANT_CREATE.code,
      PERMISSIONS.VARIANT_UPDATE.code,
      PERMISSIONS.VARIANT_DELETE.code,
      PERMISSIONS.CATEGORY_VIEW.code,
      PERMISSIONS.CATEGORY_CREATE.code,
      PERMISSIONS.CATEGORY_UPDATE.code,
      PERMISSIONS.CATEGORY_DELETE.code,
    ],
  },

  // Nhóm quản lý kho hàng
  MANAGE_WAREHOUSE: {
    code: "MANAGE_WAREHOUSE",
    name: "Quản lý kho hàng",
    list: [
      PERMISSIONS.WAREHOUSE_VIEW.code,
      PERMISSIONS.WAREHOUSE_VIEW_DETAIL.code,
      PERMISSIONS.WAREHOUSE_CREATE_BILL.code,
    ],
  },

  // Nhóm quản lý nhà cung cấp
  MANAGE_SUPPLIER: {
    code: "MANAGE_SUPPLIER",
    name: "Quản lý nhà cung cấp",
    list: [
      PERMISSIONS.SUPPLIER_VIEW.code,
      PERMISSIONS.SUPPLIER_CREATE.code,
      PERMISSIONS.SUPPLIER_UPDATE.code,
      PERMISSIONS.SUPPLIER_COLLABORATE.code,
    ],
  },

  // Nhóm quản lý bộ sưu tập
  MANAGE_COLLECTION: {
    code: "MANAGE_COLLECTION",
    name: "Quản lý bộ sưu tập",
    list: [
      PERMISSIONS.COLLECTION_VIEW.code,
      PERMISSIONS.COLLECTION_CREATE.code,
      PERMISSIONS.COLLECTION_UPDATE.code,
      PERMISSIONS.COLLECTION_COLLABORATE.code,
    ],
  },

  // Nhóm quản lý chương trình Khuyến mãi
  MANAGE_VOUCHER: {
    code: "MANAGE_VOUCHER",
    name: "Quản lý mã giảm giá",
    list: [
      PERMISSIONS.VOUCHER_VIEW.code,
      PERMISSIONS.VOUCHER_CREATE.code,
      PERMISSIONS.VOUCHER_UPDATE.code,
      PERMISSIONS.VOUCHER_CHANGE_STATUS.code,
    ],
  },

  // Nhóm xử lý đơn hàng
  MANAGE_ORDER: {
    code: "MANAGE_ORDER",
    name: "Quản lý đơn hàng và đổi trả",
    list: [
      PERMISSIONS.ORDER_VIEW.code,
      PERMISSIONS.ORDER_UPDATE_STATUS.code,
      PERMISSIONS.ORDER_REQUEST_EXCHANGE.code,
      PERMISSIONS.ORDER_CONFIRM_EXCHANGE.code,
    ],
  },

  // Nhóm quản trị nhân viên
  MANAGE_EMPLOYEE: {
    code: "MANAGE_EMPLOYEE",
    name: "Quản lý tài khoản nhân viên",
    list: [
      PERMISSIONS.EMPLOYEE_VIEW.code,
      PERMISSIONS.EMPLOYEE_CREATE.code,
      PERMISSIONS.EMPLOYEE_UPDATE_STATUS.code,
      PERMISSIONS.EMPLOYEE_GRANT.code,
    ],
  },

  // Nhóm quản lý Khách hàng và Đánh giá
  MANAGE_USER_AND_REVIEW: {
    code: "MANAGE_USER_AND_REVIEW",
    name: "Quản lý người dùng và đánh giá",
    list: [
      PERMISSIONS.USER_VIEW.code,
      PERMISSIONS.USER_UPDATE_STATUS_ACCOUNT.code,
      PERMISSIONS.REVIEW_VIEW.code,
      PERMISSIONS.REVIEW_TOGGLE_STATUS.code,
    ],
  },

  // Nhóm Chăm sóc khách hàng và Báo cáo tổng quan
  MANAGE_CONSULT_AND_REPORT: {
    code: "MANAGE_CONSULT_AND_REPORT",
    name: "Thống kê doanh thu và hỗ trợ khách hàng",
    list: [PERMISSIONS.STATISTICAL.code, PERMISSIONS.CONSULT_MANAGER.code],
  },
};
module.exports = { PERMISSIONS, PERMISSIONS_GROUP };
