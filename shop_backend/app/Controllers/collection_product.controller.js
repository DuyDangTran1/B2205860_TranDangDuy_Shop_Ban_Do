const ApiError = require("../api-error");
const CollectionProduct = require("../services/collection_product.service");
const CollectionService = require("../services/collection.service");
const CategoryService = require("../services/categories.service");
const ProductService = require("../services/products.service");
const MongoDB = require("../utils/mongodb.util");

exports.create = async (req, res, next) => {
  const { collection_id, product_ids } = req.body;

  if (
    !collection_id ||
    !Array.isArray(product_ids) ||
    product_ids.length === 0
  ) {
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  }

  const productService = new ProductService(MongoDB.client);
  const colProdService = new CollectionProduct(MongoDB.client);
  const colService = new CollectionService(MongoDB.client);
  const catService = new CategoryService(MongoDB.client);

  try {
    const collection = await colService.findCollection(collection_id);
    if (!collection) return next(new ApiError(404, "Collection không tồn tại"));

    await Promise.all(
      product_ids.map(async (id) => {
        const product = await productService.findProductById(id);

        if (!product) {
          const error = new Error(`Sản phẩm id ${id} không tồn tại`);
          error.statusCode = 404;
          throw error;
        }

        const category = await catService.findCategoryByID(product.category_id);
        const catName = category ? category.category_name : "Thời trang";
        const outfits = category ? category.suggested_outfits : "";

        return Promise.all([
          productService.syncCollectionTag(
            id,
            collection.collection_name,
            catName,
            outfits,
            "add",
          ),
          colProdService.createCollectionProduct({
            collection_id,
            product_id: id,
          }),
        ]);
      }),
    );

    return res.send("Thêm sản phẩm vào bộ sưu tập thành công!");
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return next(new ApiError(statusCode, err.message || "Lỗi server"));
  }
};

exports.delete = async (req, res, next) => {
  const product_id = req.params.product_id;
  const collection_id = req.params.collection_id;

  if (!product_id || !collection_id)
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const collection_product = new CollectionProduct(MongoDB.client);
    const collectionService = new CollectionService(MongoDB.client);
    const productService = new ProductService(MongoDB.client);
    const collection = await collectionService.findCollection(collection_id);
    if (!collection) return next(new ApiError(404, "Bộ sưu tập không tồn tại"));

    if (
      !(await collection_product.deleteCollectionProduct(
        product_id,
        collection_id,
      ))
    )
      return next(new ApiError(404, "Không tìm thấy dữ liệu xóa"));

    await productService.syncCollectionTag(
      product_id,
      collection.collection_name,
      "remove",
    );
    return res.send("Xóa dữ liệu thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa dữ liệu"),
    );
  }
};

exports.getAllProductCollection = async (req, res, next) => {
  try {
    const id = req.params.collection_id;
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const colProdService = new CollectionProduct(MongoDB.client);

    const result = await colProdService.getAllCollectionProduct(
      id,
      page,
      limit,
    );
    return res.json({
      collection_products: result.products,
      count_page: result.count_page,
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.getAllProductCollectionAdmin = async (req, res, next) => {
  try {
    const id = req.params.collection_id;
    const collectionProductService = new CollectionProduct(MongoDB.client);
    const collection_products =
      await collectionProductService.getAllCollectionProductAdmin(id);
    return res.json({ collection_products: collection_products });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
