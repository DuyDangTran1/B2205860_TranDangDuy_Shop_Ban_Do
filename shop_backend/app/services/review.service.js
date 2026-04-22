const { ObjectId } = require("mongodb");

class ReviewService {
  constructor(client) {
    this.Review = client.db().collection("Reviews");
  }

  extractReviewData(payload) {
    const review = {
      user_id: ObjectId.isValid(payload.user_id)
        ? new ObjectId(payload.user_id)
        : null,
      product_id: ObjectId.isValid(payload.product_id)
        ? new ObjectId(payload.product_id)
        : null,
      variant_id: ObjectId.isValid(payload.variant_id)
        ? new ObjectId(payload.variant_id)
        : null,
      order_id: ObjectId.isValid(payload.order_id)
        ? new ObjectId(payload.order_id)
        : null,
      rating_score: Number(payload.rating_score),
      comment: payload.comment,
      video: payload.video || null,
      images: payload.images || [],
      is_anonymous:
        payload.is_anonymous === true || payload.is_anonymous === "true",
      is_visible: true,
      created_at: new Date(),
    };
    Object.keys(review).forEach(
      (key) => review[key] === undefined && delete review[key],
    );
    return review;
  }

  async create(payload) {
    const review = this.extractReviewData(payload);
    return await this.Review.insertOne(review);
  }

  async calculateProductStats(productId) {
    const stats = await this.Review.aggregate([
      {
        $match: {
          product_id: new ObjectId(productId),
          is_visible: true,
        },
      },
      {
        $group: {
          _id: "$product_id",
          avgRating: { $avg: "$rating_score" },
          totalReviews: { $sum: 1 },
        },
      },
    ]).toArray();

    if (stats.length > 0) {
      return {
        avgRating: stats[0].avgRating,
        totalReviews: stats[0].totalReviews,
      };
    }
    return { avgRating: 0, totalReviews: 0 };
  }

  async updateVisibility(reviewId, isVisible) {
    return await this.Review.findOneAndUpdate(
      { _id: new ObjectId(reviewId) },
      { $set: { is_visible: isVisible, updated_at: new Date() } },
      { returnDocument: "after" },
    );
  }

  async getVisibleReviewsByProduct(productId) {
    return await this.Review.aggregate([
      {
        $match: {
          product_id: new ObjectId(productId),
          is_visible: true,
        },
      },
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: "User",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info",
        },
      },
      {
        $addFields: {
          // Xử lý Tên hiển thị
          user_name: {
            $cond: {
              if: { $eq: ["$is_anonymous", true] },
              then: "Người dùng ẩn danh",
              else: {
                $ifNull: [
                  { $arrayElemAt: ["$user_info.name", 0] },
                  "Khách hàng",
                ],
              },
            },
          },

          user_avatar: {
            $cond: {
              if: { $eq: ["$is_anonymous", true] },
              then: null,
              else: {
                $ifNull: [{ $arrayElemAt: ["$user_info.image_url", 0] }, null],
              },
            },
          },
        },
      },
      {
        $project: {
          user_info: 0,
        },
      },
    ]).toArray();
  }
  async getAllReviewsForAdmin() {
    return await this.Review.aggregate([
      { $sort: { created_at: -1 } },
      {
        $lookup: {
          from: "User",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info",
        },
      },
      {
        $lookup: {
          from: "Products",
          localField: "product_id",
          foreignField: "_id",
          as: "product_info",
        },
      },
      {
        $addFields: {
          user_name: {
            $ifNull: [
              { $arrayElemAt: ["$user_info.name", 0] },
              "Khách vãng lai",
            ],
          },
          product_name: {
            $ifNull: [
              { $arrayElemAt: ["$product_info.product_name", 0] },
              "Sản phẩm đã xóa",
            ],
          },
        },
      },
      { $project: { user_info: 0, product_info: 0 } },
    ]).toArray();
  }

  async getById(id) {
    return await this.Review.findOne({ _id: new ObjectId(id) });
  }
}

module.exports = ReviewService;
