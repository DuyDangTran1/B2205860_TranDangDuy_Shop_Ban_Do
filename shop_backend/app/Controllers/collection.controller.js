const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const multer_mw = require("../middelwares/multer.middelware");
const CollectionService = require("../services/collection.service");
const CollectionProductService = require("../services/collection_product.service");
const CategoryService = require("../services/categories.service");
const ProductService = require("../services/products.service");
exports.create = async (req, res, next) => {
  if (!req.body.collection_name || !req.file)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  const collection = {
    collection_name: req.body.collection_name,
    description: req.body.description,
    image_url: `uploads/collections/${req.file.filename}`,
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
    description: req.body.description,
  };

  if (!update.collection_name)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  try {
    const collection_service = new CollectionService(MongoDB.client);
    const collection = await collection_service.findCollection(id);
    // console.log(collection);
    if (!collection)
      return next(new ApiError(404, "Không tìm thấy bộ sưu tập cần cập nhật"));
    const old_url = collection.image_url;
    console.log(old_url);
    if (req.file) {
      multer_mw.removeFile(old_url);
      update.image_url = `uploads/collections/${req.file.filename}`;
    } else {
      update.image_url = old_url;
    }
    await collection_service.updateCollection(id, update);
    return res.send("Cập nhật dữ liệu thành công");
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật"));
  }
};

exports.delete = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const colService = new CollectionService(MongoDB.client);
    const colProdService = new CollectionProductService(MongoDB.client);
    const productService = new ProductService(MongoDB.client);
    const catService = new CategoryService(MongoDB.client);
    const collection = await colService.findCollection(id);
    if (!collection)
      return next(new ApiError(404, "Không tìm thấy bộ sưu tập cần xóa"));

    //Lấy danh sách sản phẩm đang nằm trong bộ sưu tập này
    const productsInCol = await colProdService.getAllCollectionProduct(id);

    //Gỡ Tag của tất cả sản phẩm cùng lúc
    if (productsInCol.length > 0) {
      await Promise.all(
        productsInCol.map(async (p) => {
          // Tìm sản phẩm để lấy category_id
          const product = await productService.findProductById(p.product_id);
          // Lấy tên thể loại và outfit để tạo lại Embedding
          const category = await catService.findCategoryByID(
            product.category_id,
          );

          return productService.syncCollectionTag(
            p.product_id,
            collection.collection_name,
            category ? category.category_name : "Thời trang",
            category ? category.suggested_outfits : "",
            "remove",
          );
        }),
      );
    }

    multer_mw.removeFile(collection.image_url);

    await colProdService.deleteAllCollectionProduct(id);
    await colService.deleteCollection(id);

    return res.send("Xóa bộ sưu tập và đồng bộ dữ liệu sản phẩm thành công");
  } catch (error) {
    console.log(error);
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
exports.getCollection = async (req, res, next) => {
  const collection_id = req.params.id;
  if (!collection_id) return next(new ApiError(400, "Thiếu id bộ sưu tập"));
  try {
    const collection_service = new CollectionService(MongoDB.client);
    const collection = await collection_service.findCollection(collection_id);
    if (!collection)
      return next(new ApiError(404, "Không tìm thấy bộ sưu tập"));

    return res.json({ collection: collection });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const collection_service = new CollectionService(MongoDB.client);
    const collections = await collection_service.getAllCollection();
    const featured = collections.slice(0, 4);
    return res.json({ collections: featured });
  } catch (error) {
    return next(new ApiError(500, "Lỗi lấy bộ sưu tập nổi bật"));
  }
};
