const ApiError = require("../api-error");
const CollectionProduct = require("../services/collection_product.service");
const MongoDB = require("../utils/mongodb.util");

exports.create = async (req, res, next) => {
  if (!req.body.product_id || !req.body.collection_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const payload = {
    product_id: req.body.product_id,
    collection_id: req.body.collection_id,
  };

  try {
    const collection_product = new CollectionProduct(MongoDB.client);
    await collection_product.createCollectionProduct(payload);
    return res.send("Thêm sản phẩm vào bộ sưu tập thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình tạo mới dữ liệu"),
    );
  }
};

exports.update = async (req, res, next) => {
  if (!req.query.product_id || !req.query.collection_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  if (!req.body.product_id || !req.body.collection_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const product_id = req.query.product_id;
  const collection_id = req.query.collection_id;
  const update = {
    product_id: req.body.product_id,
    collection_id: req.body.collection_id,
  };
  try {
    const collection_product = new CollectionProduct(MongoDB.client);

    if (
      !(await collection_product.updateCollectionProduct(
        product_id,
        collection_id,
        update,
      ))
    )
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    return res.send("Cập nhật dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật dữ liệu"),
    );
  }
};

exports.delete = async (req, res, next) => {
  if (!req.query.product_id || !req.query.collection_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  const product_id = req.query.product_id;
  const collection_id = req.query.collection_id;

  try {
    const collection_product = new CollectionProduct(MongoDB.client);
    if (
      !(await collection_product.deleteCollectionProduct(
        product_id,
        collection_id,
      ))
    )
      return next(new ApiError(404, "Không tìm thấy dữ liệu xóa"));

    return res.send("Xóa dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa dữ liệu"),
    );
  }
};
