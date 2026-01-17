const MongDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const ProductVariant = require("../services/products_variant.service");
const multer_mw = require("../middelwares/multer.middelware");

exports.create = async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, "Thiếu ảnh minh họa"));

  if (!req.body.product_id || !req.body.color_id || !req.body.size_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  if (req.body.quantity < 0)
    return next(new ApiError(400, "Số lượng truyền vào không được âm"));

  const variant = {
    product_id: req.body.product_id,
    color_id: req.body.color_id,
    size_id: req.body.size_id,
    quantity: Number(req.body.quantity) || 0,
    image_url: `uploads/products/${req.file.filename}`,
  };

  try {
    const product_variant = new ProductVariant(MongDB.client);
    await product_variant.create(variant);

    return res.send("Thêm dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình thêm sản phẩm")
    );
  }
};
exports.update = async (req, res, next) => {
  const { product_id, size_id, color_id } = req.query;
  if (!product_id || !size_id || !color_id)
    return next(new ApiError(400, "Lỗi truyền thông tin dữ liệu"));

  try {
    const product_variant = new ProductVariant(MongDB.client);
    const variant = await product_variant.findVariant(
      product_id,
      color_id,
      size_id
    );
    if (!variant)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    const old_url = variant.image_url;
    const update = {
      product_id: product_id,
      color_id: color_id,
      size_id: size_id,
      quantity: req.body.quantity ? req.body.quantity : variant.quantity,
    };
    if (!req.file) {
      update.image_url = old_url;
    } else {
      multer_mw.removeFile(old_url);
      update.image_url = `uploads/products/${req.file.filename}`;
    }

    await product_variant.update(update);
    return res.send("Cập nhật thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật"));
  }
};

exports.delete = async (req, res, next) => {
  const { product_id, size_id, color_id } = req.query;
  if (!product_id || !size_id || !color_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const product_variant = new ProductVariant(MongDB.client);
    const variant = await product_variant.findVariant(
      product_id,
      size_id,
      color_id
    );
    if (!variant)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    multer_mw.removeFile(variant.image_url);

    await product_variant.delete(product_id, size_id, color_id);
    return res.send("Xóa dữ liệu thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa"));
  }
};
