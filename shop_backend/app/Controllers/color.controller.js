const MongoDB = require("../utils/mongodb.util");
const ColorService = require("../services/color.service");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
  const color = {
    color_name: req.body.color_name,
    hex_code: req.body.hex_code,
  };

  if (!color.color_name || !color.hex_code)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const color_service = new ColorService(MongoDB.client);
    await color_service.createColor(color);
    return res.send("Thêm dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình thêm dữ liệu")
    );
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  const color = {
    color_name: req.body.color_name,
    hex_code: req.body.hex_code,
  };

  if (!id || !color.color_name || !color.hex_code)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const color_service = new ColorService(MongoDB.client);
    if (!(await color_service.updateColor(id, color)))
      return next(new ApiError(404, "không tìm thấy dữ liệu cần cập nhật"));

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
    const color_service = new ColorService(MongoDB.client);
    if (!(await color_service.deleteColor(id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    return res.send("Xóa thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi trong quá trình xóa dữ liệu"));
  }
};

exports.getAllColor = async (req, res, next) => {
  try {
    const color_service = new ColorService(MongoDB.client);
    const colors = await color_service.getAll();

    return res.json({ colors: colors });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình lấy dữ liệu")
    );
  }
};
