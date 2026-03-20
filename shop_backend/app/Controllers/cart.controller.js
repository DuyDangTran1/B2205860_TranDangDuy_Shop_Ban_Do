const MongoDB = require("../utils/mongodb.util");
const CartService = require("../services/cart.service");
const VariantSerVice = require("../services/products_variant.service");
const ApiError = require("../api-error");
exports.create = async (req, res, next) => {
  if (
    !req.body.variant_id ||
    !req.body.quantity ||
    isNaN(req.body.quantity) ||
    req.body.quantity < 1
  )
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const cart = {
    user_id: req.user._id,
    variant_id: req.body.variant_id,
    quantity: Number(req.body.quantity),
  };

  try {
    const variant_service = new VariantSerVice(MongoDB.client);
    const variant = await variant_service.findVariantById(cart.variant_id);
    if (!variant) return next(new ApiError(404, "Biến thể không tồn tại"));

    const cart_service = new CartService(MongoDB.client);
    await cart_service.create(cart, variant.quantity);

    return res.send("Thêm sản phẩm vào giỏ hàng thành công");
  } catch (error) {
    return next(
      new ApiError(
        500,
        "Đã có lỗi xảy ra trong quá trình tạo sản phẩm vào giỏ hàng",
      ),
    );
  }
};

exports.update = async (req, res, next) => {
  if (!req.body.variant_id || !req.body.quantity || isNaN(req.body.quantity))
    return next(new ApiError(400, "Lỗi truyền dữ liệu"));

  const cart = {
    user_id: req.user._id,
    variant_id: req.body.variant_id,
    quantity: Number(req.body.quantity),
  };
  // console.log(cart);
  try {
    const variant_service = new VariantSerVice(MongoDB.client);
    const variant = await variant_service.findVariantById(cart.variant_id);
    if (!variant) return next(new ApiError(404, "Biến thể không tồn tại"));

    const cart_service = new CartService(MongoDB.client);

    // console.log(cart);

    if (!(await cart_service.update(cart, variant.quantity)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần cập nhật"));

    return res.send("Cập nhật số lượng trong giỏ hàng thành công");
  } catch (error) {
    // console.log(error);
    return next(new ApiError(500, "Lỗi Server"));
  }
};

exports.delete = async (req, res, next) => {
  if (!req.query.variant_id)
    return next(new ApiError(400, "lỗi truyền dữ liệu"));
  try {
    const cart_service = new CartService(MongoDB.client);
    if (!(await cart_service.delete(req.user._id, req.query.variant_id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));

    return res.send("Xóa dữ liệu thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.deleteAll = async (req, res, next) => {
  try {
    const cart_service = new CartService(MongoDB.client);
    if (!(await cart_service.deleteAll(req.user._id)))
      return next(new ApiError(404, "Không tìm thấy dữ liệu cần xóa"));
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.getCartByUser = async (req, res, next) => {
  try {
    // console.log(req.user._id);
    const cart_service = new CartService(MongoDB.client);
    const cart = await cart_service.getAll(req.user._id);
    return res.json({ cart: cart });
  } catch (error) {
    return next(new ApiError(500, "lỗi server"));
  }
};
