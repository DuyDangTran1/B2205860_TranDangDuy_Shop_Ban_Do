const ProductService = require("../services/products.service");
const CategoryService = require("../services/categories.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const multer_mw = require("../middelwares/multer.middelware");

exports.create = async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, "Lỗi thiếu ảnh minh họa"));
  const product = {
    product_name: req.body.product_name,
    brand: req.body.brand,
    category_id: req.body.category_id,
    supplier_id: req.body.supplier_id,
    discount: Number(req.body.discount ? req.body.discount : 0),
    base_price: Number(req.body.base_price),
    attribute: {
      material: req.body.attribute?.material,
      style: req.body.attribute?.style,
      thickness: req.body.attribute?.thickness,
      oversize: req.body.attribute?.oversize,
    },
    bot_knowledge: {
      selling_point: req.body.bot_knowledge?.selling_point,
      usage: req.body.bot_knowledge?.usage,
    },
    description: req.body.description,
    tag: Array.isArray(req.body.tag)
      ? req.body.tag
      : req.body.tag
        ? req.body.tag.split(",").map((t) => t.trim())
        : [],
    discount_start: req.body.discount_start
      ? new Date(req.body.discount_start)
      : undefined,
    discount_end: req.body.discount_end
      ? new Date(req.body.discount_end)
      : undefined,
    image_url: `uploads/products/${req.file.filename}`,
    rating: 0,
    count_sell: 0,
    created: new Date(),
  };

  if (
    !product.product_name ||
    !product.base_price ||
    !product.description ||
    !product.tag ||
    !product.category_id ||
    !product.supplier_id
  )
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const product_service = new ProductService(MongoDB.client);
    await product_service.create(product);
    return res.send("Thêm sản phẩm thành công");
  } catch (error) {
    console.log(error);
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình thêm sản phẩm"),
    );
  }
};

//mặc định 1 trang có 8 sản phẩm
exports.findAllByCategory = async (req, res, next) => {
  if (!req.params.category_name)
    return next(new ApiError(400, "Thiếu tên thể loại"));
  const categorySlug = req.params.category_name.trim();
  const { created, base_price, price_min, price_max, brand } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  try {
    const category_service = new CategoryService(MongoDB.client);

    const category = await category_service.findCategoryBySlug(categorySlug);

    if (!category) return next(new ApiError(404, "Thể loại không tồn tại"));

    const product_service = new ProductService(MongoDB.client);

    const { products, count_product, brands } =
      await product_service.findAllByCategory(
        category._id,
        page,
        limit,
        created,
        brand,
        base_price,
        price_min,
        price_max,
      );

    return res.json({
      category_name: category.category_name,
      products: products,
      count_page: Math.ceil(count_product / limit),
      brands: brands,
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi lấy dữ liệu sản phẩm"));
  }
};

exports.getProductById = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const product_service = new ProductService(MongoDB.client);
    const product = await product_service.getProductById(id);
    if (!product) return next(new ApiError(404, "Không tìm thấy dữ liệu"));

    return res.json({ product: product });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình lấy dữ liệu"),
    );
  }
};

exports.update = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const update = {
    product_name: req.body.product_name,
    category_id: req.body.category_id,
    supplier_id: req.body.supplier_id,
    discount: Number(req.body.discount ? req.body.discount : 0),
    base_price: Number(req.body.base_price),
    material: req.body.material,
    description: req.body.description,
    tag: Array.isArray(req.body.tag)
      ? req.body.tag
      : req.body.tag
        ? req.body.tag.split(",").map((t) => t.trim())
        : [],
    discount_start: req.body.discount_start
      ? new Date(req.body.discount_start)
      : undefined,
    discount_end: req.body.discount_end
      ? new Date(req.body.discount_end)
      : undefined,
    created: new Date(),
  };

  if (
    !update.product_name ||
    !update.material ||
    !update.tag ||
    !update.description ||
    !update.base_price ||
    !update.category_id ||
    !update.supplier_id
  )
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));
  try {
    const product_service = new ProductService(MongoDB.client);
    const product = await product_service.findProductById(id);
    if (!product)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));
    const old_url = product.image_url;
    if (req.file) multer_mw.removeFile(old_url);

    update.image_url = req.file
      ? `uploads/products/${req.file.filename}`
      : old_url;

    await product_service.update(id, update);

    return res.send("Cập nhật dữ liệu thành công");
  } catch (error) {
    console.log(error);
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình cập nhật dữ liệu"),
    );
  }
};

exports.delete = async (req, res, next) => {
  const id = req.params.id;
  if (!id) return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  try {
    const product_service = new ProductService(MongoDB.client);
    const product = await product_service.findProductById(id);
    if (!product)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    const url = product.image_url;

    multer_mw.removeFile(url);

    await product_service.delete(id);

    return res.send("Xóa thành công");
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Đã có lỗi xảy ra trong quá trình xóa"));
  }
};

exports.getAllProduct = async (req, res, next) => {
  try {
    const productService = new ProductService(MongoDB.client);
    const products = await productService.getAllProduct();
    return res.json({ products: products });
  } catch (error) {
    return next(new ApiError(500, "Lỗi lấy dữ liệu"));
  }
};
