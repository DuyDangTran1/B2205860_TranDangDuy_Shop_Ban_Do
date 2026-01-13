const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const SizeService = require("../services/size.service");

exports.create = async (req, res, next) => {
  if (!req.body.size_name) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const size_service = new SizeService(MongoDB.client);
    const size = {
      size_name: req.body.size_name,
    };
    await size_service.createSize(size);

    return res.send("Thêm kích cỡ mới thành công");
  } catch (error) {
    console.log(error);
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình thêm dữ liệu")
    );
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  const size = {
    size_name: req.body.size_name,
  };
  if (!id || !size.size_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const size_service = new SizeService(MongoDB.client);
    if (!(await size_service.update(id, size)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));
    return res.send("Đã cập nhật thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật dữ liệu")
    );
  }
};

exports.delete = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const size_service = new SizeService(MongoDB.client);
    if (!(await size_service.delete(id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));
    return res.send("Xóa thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa"));
  }
};

exports.getAllSize = async (req, res, next) => {
  try {
    const size_service = new SizeService(MongoDB.client);
    const sizes = await size_service.getAllSize();
    return res.json({ sizes: sizes });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình lấy dữ liệu")
    );
  }
};
