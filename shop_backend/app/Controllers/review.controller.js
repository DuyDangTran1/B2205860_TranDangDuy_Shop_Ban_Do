const ReviewService = require("../services/review.service");
const OrderService = require("../services/order.service");
const ProductService = require("../services/products.service");
const ProductVariant = require("../services/products_variant.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const { ObjectId } = require("mongodb");
exports.createReview = async (req, res, next) => {
  try {
    const reviewService = new ReviewService(MongoDB.client);
    const orderService = new OrderService(MongoDB.client);
    const productService = new ProductService(MongoDB.client);
    const variantService = new ProductVariant(MongoDB.client);
    const order = await orderService.findOrder(req.body.order_id);
    if (!order || order.order_status !== "Đã giao") {
      return next(
        new ApiError(400, "Bạn cần nhận hàng thành công trước khi đánh giá"),
      );
    }

    const hasProduct = order.items.some(
      (item) => item.variant_id.toString() === req.body.variant_id,
    );
    if (!hasProduct) {
      return next(new ApiError(400, "Sản phẩm không hợp lệ"));
    }

    const variantInfo = await variantService.findVariantById(
      req.body.variant_id,
    );

    if (!variantInfo)
      return next(new ApiError(404, "Không tìm thấy biến thể sản phẩm"));

    // console.log(req.user._id);
    // console.log(new ObjectId(req.body.order_id));
    const existingReview = await reviewService.Review.findOne({
      user_id: req.user._id,
      order_id: new ObjectId(req.body.order_id),
      variant_id: new ObjectId(req.body.variant_id),
    });

    if (existingReview) {
      return next(new ApiError(400, "Bạn đã đánh giá sản phẩm này rồi!"));
    }
    const actualProductId = variantInfo.product_id;
    let imagesArray = [];
    let videoUrl = null;

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const filePath = `uploads/reviews/${file.filename}`;

        if (file.mimetype.startsWith("video/")) {
          videoUrl = filePath;
        } else {
          imagesArray.push(filePath);
        }
      });
    }

    const payload = {
      ...req.body,
      user_id: req.user._id,
      images: imagesArray,
      product_id: actualProductId,
      video: videoUrl,
    };
    // console.log(payload);
    await reviewService.create(payload);

    const stats = await reviewService.calculateProductStats(actualProductId);
    await productService.updateRating(
      actualProductId,
      stats.avgRating,
      stats.totalReviews,
    );

    return res.status(201).json({ message: "Cảm ơn bạn đã đánh giá!" });
  } catch (error) {
    console.error("Review Error:", error);
    return next(new ApiError(500, "Lỗi khi tạo đánh giá"));
  }
};
exports.getProductReviewsPublic = async (req, res, next) => {
  try {
    const reviewService = new ReviewService(MongoDB.client);
    const reviews = await reviewService.getVisibleReviewsByProduct(
      req.params.productId,
    );
    return res.json(reviews);
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi lấy đánh giá"));
  }
};

exports.adminGetAllReviews = async (req, res, next) => {
  try {
    const reviewService = new ReviewService(MongoDB.client);
    const reviews = await reviewService.getAllReviewsForAdmin();
    return res.json(reviews);
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi quản lý đánh giá"));
  }
};

exports.getReviewDetail = async (req, res, next) => {
  try {
    const reviewService = new ReviewService(MongoDB.client);
    const review = await reviewService.getById(req.params.id);
    if (!review) return next(new ApiError(404, "Không tìm thấy bài đánh giá"));
    return res.json(review);
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.updateReviewVisibility = async (req, res, next) => {
  try {
    const reviewService = new ReviewService(MongoDB.client);
    const productService = new ProductService(MongoDB.client);

    const isVisible = req.body.is_visible;
    if (isVisible === undefined) {
      return next(new ApiError(400, "Thiếu trạng thái hiển thị"));
    }

    const result = await reviewService.updateVisibility(
      req.params.id,
      isVisible,
    );
    const updatedReview = result.value || result;

    if (!updatedReview)
      return next(new ApiError(404, "Không tìm thấy đánh giá"));

    const stats = await reviewService.calculateProductStats(
      updatedReview.product_id,
    );
    await productService.updateRating(
      updatedReview.product_id,
      stats.avgRating,
      stats.totalReviews,
    );

    const action = isVisible ? "hiển thị" : "ẩn";
    return res.json({ message: `Đã ${action} bài đánh giá thành công!` });
  } catch (error) {
    return next(new ApiError(500, "Lỗi khi cập nhật trạng thái hiển thị"));
  }
};
