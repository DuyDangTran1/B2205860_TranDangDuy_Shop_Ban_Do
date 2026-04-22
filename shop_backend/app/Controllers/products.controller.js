const ProductService = require("../services/products.service");
const CategoryService = require("../services/categories.service");
const ProductVariantService = require("../services/products_variant.service");
const OrderService = require("../services/order.service");
const ActivityService = require("../services/activity.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const multer_mw = require("../middelwares/multer.middelware");

exports.create = async (req, res, next) => {
  // console.log(req.file.filename);
  // console.log(req.body);
  if (!req.file) return next(new ApiError(400, "Lỗi thiếu ảnh minh họa"));
  let attribute = {};
  let bot_knowledge = {};

  try {
    attribute =
      typeof req.body.attribute === "string"
        ? JSON.parse(req.body.attribute)
        : req.body.attribute;
    bot_knowledge =
      typeof req.body.bot_knowledge === "string"
        ? JSON.parse(req.body.bot_knowledge)
        : req.body.bot_knowledge;
    const product = {
      product_name: req.body.product_name,
      brand: req.body.brand,
      category_id: req.body.category_id,
      supplier_id: req.body.supplier_id,
      discount: Number(req.body.discount ? req.body.discount : 0),
      base_price: Number(req.body.base_price),
      attribute: attribute,
      bot_knowledge: bot_knowledge,
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
      created: new Date(),
    };

    // console.log(product);

    if (
      !product.product_name ||
      !product.base_price ||
      !product.description ||
      !product.tag ||
      product.tag.length === 0 ||
      !product.category_id ||
      !product.supplier_id
    )
      return next(new ApiError(400, "Lỗi truyền dữ liệu"));
    const categoryService = new CategoryService(MongoDB.client);
    const product_service = new ProductService(MongoDB.client);

    const category = await categoryService.findCategoryByID(
      product.category_id,
    );
    if (!category)
      return next(
        new ApiError(
          404,
          `Không tìm thấy thể loại có id là ${product.category_id}`,
        ),
      );

    await product_service.create(
      product,
      category.category_name,
      category.suggested_outfits,
    );
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

  let attribute = {};
  let bot_knowledge = {};

  try {
    attribute =
      typeof req.body.attribute === "string"
        ? JSON.parse(req.body.attribute)
        : req.body.attribute;

    bot_knowledge =
      typeof req.body.bot_knowledge === "string"
        ? JSON.parse(req.body.bot_knowledge)
        : req.body.bot_knowledge;

    const update = {
      product_name: req.body.product_name,
      brand: req.body.brand,
      category_id: req.body.category_id,
      supplier_id: req.body.supplier_id,
      base_price: Number(req.body.base_price),
      description: req.body.description,
      tag: Array.isArray(req.body.tag)
        ? req.body.tag
        : req.body.tag
          ? req.body.tag.split(",").map((t) => t.trim())
          : [],
      attribute: attribute,
      bot_knowledge: bot_knowledge,
    };

    if (
      !update.product_name ||
      !update.base_price ||
      !update.category_id ||
      !update.supplier_id ||
      !update.attribute ||
      Object.keys(update.attribute).length === 0
    ) {
      return next(new ApiError(400, "Lỗi thiếu dữ liệu bắt buộc"));
    }

    const product_service = new ProductService(MongoDB.client);
    const categoryService = new CategoryService(MongoDB.client);
    const product = await product_service.findProductById(id);

    if (!product)
      return next(new ApiError(404, "Không tìm thấy sản phẩm cần cập nhật"));

    const old_url = product.image_url;
    const category = await categoryService.findCategoryByID(update.category_id);
    const catName = category ? category.category_name : "Thời trang";
    const outfits = category ? category.suggested_outfits : "";
    if (req.file) {
      multer_mw.removeFile(old_url);
      update.image_url = `uploads/products/${req.file.filename}`;
    } else {
      update.image_url = old_url;
    }

    await product_service.update(id, update, catName, outfits);

    return res.send("Cập nhật dữ liệu thành công");
  } catch (error) {
    console.log("Update Error:", error);
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
    const activityService = new ActivityService(MongoDB.client);
    const productVariantService = new ProductVariantService(MongoDB.client);
    const product = await product_service.findProductById(id);
    if (!product)
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    await productVariantService.deleteByProductId(product._id);

    const url = product.image_url;

    multer_mw.removeFile(url);
    // console.log(req.user);
    await activityService.createLog(
      "Sản phẩm",
      `${req.user.role} ${req.user.name} đã xóa sản phẩm: ${product.product_name}`,
    );
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

exports.getProductNew = async (req, res, next) => {
  try {
    const product_service = new ProductService(MongoDB.client);
    const products = await product_service.getProductNew();
    return res.json({ products: products });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.setDiscount = async (req, res, next) => {
  const id = req.params.id;
  console.log(req.user);
  const { discount, discount_start, discount_end } = req.body;

  if (discount === undefined || !discount_start || !discount_end) {
    return next(new ApiError(400, "Thiếu dữ liệu giảm giá"));
  }

  if (new Date(discount_start) > new Date(discount_end)) {
    return next(new ApiError(400, "Ngày kết thúc phải sau ngày bắt đầu"));
  }

  try {
    const product_service = new ProductService(MongoDB.client);
    const activityService = new ActivityService(MongoDB.client);
    const updateData = {
      discount: Number(discount),
      discount_start: discount_start,
      discount_end: discount_end,
    };

    const result = await product_service.updateDiscount(id, updateData);

    if (!result) return next(new ApiError(404, "Không tìm thấy sản phẩm"));
    await activityService.createLog(
      "Hệ thống",
      `${req.user.name} đã thiết lập giảm giá ${discount}% cho sản phẩm: ${result.product_name}`,
    );
    return res.send({ message: "Thiết lập giảm giá thành công", data: result });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi khi thiết lập giảm giá"));
  }
};

exports.getOutfitFromLastOrder = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return next(new ApiError(401, "Bạn cần đăng nhập để xem gợi ý"));

    // Khởi tạo các Service
    const orderService = new OrderService(MongoDB.client);
    const variantService = new ProductVariantService(MongoDB.client);
    const productService = new ProductService(MongoDB.client);

    //Gọi OrderService lấy đơn hàng gần nhất
    const lastOrders = await orderService.findOrderLastestByUser(userId);

    //Xử lý Fallback nếu chưa mua hàng
    if (!lastOrders || lastOrders.length === 0) {
      const topProducts = await productService.getProductNew(); // Dùng hàm có sẵn trong service
      return res.json({
        message: "Chào mừng bạn, đây là các sản phẩm mới nhất",
        recommendations: topProducts,
      });
    }

    //Lấy thông tin Variant từ đơn hàng (Chỉ xử lý mảng, không query)
    const variantIds = lastOrders[0].items.map((item) => item.variant_id);

    //Gọi VariantService lấy thông tin chi tiết các variants
    const variants = await variantService.getVariantsByIds(variantIds);

    //Trích xuất danh sách Product IDs
    const productIds = [
      ...new Set(variants.map((v) => v.product_id.toString())),
    ];

    //Gọi ProductService để AI gợi ý đồ phối
    const finalResult =
      await productService.getRecommendationsFromProductList(productIds);

    return res.json({
      message: "Gợi ý phối đồ dựa trên đơn hàng vừa mua",
      recommendations: finalResult,
    });
  } catch (error) {
    console.error("Lỗi gợi ý:", error);
    return next(new ApiError(500, "Đã có lỗi xảy ra khi lấy gợi ý phối đồ"));
  }
};
