const MongoDB = require("../utils/mongodb.util");
const SupplierService = require("../services/supplier.service");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
  if (
    !req.body.supplier_name ||
    !req.body.supplier_phone ||
    !req.body.supplier_address
  )
    return next(new ApiError(400, "Lỗi thiếu thông tin"));
  const supplier = {
    supplier_name: req.body.supplier_name,
    supplier_phone: req.body.supplier_phone,
    supplier_address: req.body.supplier_address,
  };
  try {
    const supplier_service = new SupplierService(MongoDB.client);
    await supplier_service.create(supplier);
    return res.send("Thêm dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình tạo dự liệu"),
    );
  }
};

exports.update = async (req, res, next) => {
  if (
    !req.params.id ||
    !req.body.supplier_name ||
    !req.body.supplier_phone ||
    !req.body.supplier_address
  )
    return next(new ApiError(400, "Lỗi thiếu thông tin"));

  const id = req.params.id;
  const update = {
    supplier_name: req.body.supplier_name,
    supplier_phone: req.body.supplier_phone,
    supplier_address: req.body.supplier_address,
  };

  try {
    const supplier_service = new SupplierService(MongoDB.client);
    if (!(await supplier_service.update(id, update)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));
    return res.send("Cập nhật dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật dữ liệu"),
    );
  }
};

exports.delete = async (req, res, next) => {
  if (!req.params.id) return next(new ApiError(400, "Lỗi thiếu thông tin"));

  const id = req.params.id;

  try {
    const supplier_service = new SupplierService(MongoDB.client);
    if (!(await supplier_service.delete(id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    return res.send("Xóa thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa dữ liệu"),
    );
  }
};

exports.getAllSupplier = async (req, res, next) => {
  try {
    const supplier_service = new SupplierService(MongoDB.client);
    const suppliers = await supplier_service.getAllSupplier();
    return res.json({ suppliers: suppliers });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.updateCollaborateStatus = async (req, res, next) => {
  const id = req.params.id;
  if (!id)
    return next(new ApiError(400, "Lỗi truyền thiếu id ncc cần cập nhật"));

  try {
    const supplier_service = new SupplierService(MongoDB.client);
    const supplier = await supplier_service.findSupplier(id);
    if (!supplier)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    await supplier_service.updateStatusCollaborating(
      id,
      !supplier.is_collaborating,
    );

    return res.send("Cập nhật trạng thái thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
