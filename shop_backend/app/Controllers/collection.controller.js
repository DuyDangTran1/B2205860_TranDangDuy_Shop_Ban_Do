const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const CollectionService = require("../services/collection.service");

exports.create = async (req, res, next) => {
  if (!req.body.collection_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  const collection = {
    collection_name: req.body.collection_name,
  };
  try {
    const collection_service = new CollectionService(MongoDB.client);
    await collection_service.createCollection(collection);
    return res.send("Thêm dữ liệu thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình tạo mới"));
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const update = {
    collection_name: req.body.collection_name,
  };

  if (!update.collection_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  try {
    const collection_service = new CollectionService(MongoDB.client);
    if (!(await collection_service.updateCollection(id, update)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    return res.send("Cập nhật dữ liệu thành công");
  } catch (error) {
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật"));
  }
};

exports.delete = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const collection_service = new CollectionService(MongoDB.client);
    if (!(await collection_service.deleteCollection(id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    return res.send("Xóa dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa dữ liệu"),
    );
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const collection_service = new CollectionService(MongoDB.client);
    const collections = await collection_service.getAllCollection();
    return res.json({ collections: collections });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình lấy dữ liệu"),
    );
  }
};
