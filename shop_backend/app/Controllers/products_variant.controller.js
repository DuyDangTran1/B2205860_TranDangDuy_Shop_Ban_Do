const MongDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const ProductVariant = require("../services/products_variant.service");
const multer_mw = require("../middelwares/multer.middelware");

exports.create = async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, "Thiếu ảnh minh họa"));

  if (!req.body.product_id || !req.body.color_name || !req.body.size_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const variant = {
    product_id: req.body.product_id,
    color_name: req.body.color_name,
    size_name: req.body.size_name,
    image_url: `uploads/products/${req.file.filename}`,
  };

  try {
    const product_variant = new ProductVariant(MongDB.client);

    if (
      await product_variant.findVariantByInformation(
        variant.product_id,
        variant.color_name,
        variant.size_name,
      )
    )
      return next(new ApiError(404, "Biến thể đã có trong hệ thống"));

    await product_variant.create(variant);

    return res.send("Thêm dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình thêm sản phẩm"),
    );
  }
};
exports.update = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi thiếu id sản phẩm"));
  const { product_id, color_name, size_name } = req.body;
  if (!product_id || !color_name || !size_name)
    return next(new ApiError(400, "Thiếu dữ liệu về sản phẩm"));
  try {
    const product_variant = new ProductVariant(MongDB.client);
    const variant = await product_variant.findVariant(id);
    if (!variant)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    const old_url = variant.image_url;
    const update = {
      product_id: product_id,
      color_name: color_name,
      size_name: size_name,
    };
    if (!req.file) {
      update.image_url = old_url;
    } else {
      multer_mw.removeFile(old_url);
      update.image_url = `uploads/products/${req.file.filename}`;
    }

    await product_variant.update(id, update);
    return res.send("Cập nhật thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật"));
  }
};

exports.delete = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi thiếu dữ liệu về sản phẩm"));

  try {
    const product_variant = new ProductVariant(MongDB.client);
    const variant = await product_variant.findVariant(id);
    if (!variant)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    multer_mw.removeFile(variant.image_url);

    await product_variant.delete(id);
    return res.send("Xóa dữ liệu thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa"));
  }
};
