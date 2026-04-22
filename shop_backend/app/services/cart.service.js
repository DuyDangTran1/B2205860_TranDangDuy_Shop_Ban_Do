const { ObjectId, ReturnDocument } = require("mongodb");

class Cart {
  constructor(client) {
    this.CartCollection = client.db().collection("Cart");
  }

  /* 
  cart = {
  user_id: ..,
  variants: [
    {
      variant_id: ...,
      quantity: ...,
    },
  ]

  status: "incomplete"// khởi tạo khi hoàn thành. 
  }
  */

  extractCartData(payload) {
    const cart = {
      user_id: payload.user_id,
      variant_id: ObjectId.isValid(payload.variant_id)
        ? new ObjectId(payload.variant_id)
        : null,
      quantity: parseInt(payload.quantity) || 1,
    };

    if (!cart.user_id) delete cart.user_id;
    if (!cart.variant_id) delete cart.variant_id;

    return cart;
  }

  async create(payload, quantityInWareHouse) {
    const data = this.extractCartData(payload);

    data.quantity = data.quantity <= 0 ? 1 : data.quantity;

    const existingItem = await this.CartCollection.findOne(
      {
        user_id: data.user_id,
        "items.variant_id": data.variant_id,
      },
      {
        projection: {
          items: { $elemMatch: { variant_id: data.variant_id } },
        },
      },
    );

    if (existingItem) {
      const cart_current_quantity = existingItem.items[0].quantity;

      if (cart_current_quantity + data.quantity > quantityInWareHouse)
        data.quantity = quantityInWareHouse - cart_current_quantity;

      return this.CartCollection.findOneAndUpdate(
        {
          user_id: data.user_id,
          "items.variant_id": data.variant_id,
        },
        { $inc: { "items.$.quantity": data.quantity } },
        { returnDocument: "after" },
      );
    } else {
      if (data.quantity > quantityInWareHouse)
        data.quantity = quantityInWareHouse;

      return this.CartCollection.findOneAndUpdate(
        { user_id: data.user_id },
        {
          $push: {
            items: { variant_id: data.variant_id, quantity: data.quantity },
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  }

  async update(payload, quantityInWareHouse) {
    const update = this.extractCartData(payload);
    // console.log(update);
    //Kiểm tra số lượng cập nhật so với kho nếu lớn hơn thì set lại
    if (update.quantity > quantityInWareHouse)
      update.quantity = quantityInWareHouse;

    return this.CartCollection.findOneAndUpdate(
      {
        user_id: update.user_id,
        "items.variant_id": update.variant_id,
      },
      {
        $set: {
          "items.$.quantity": update.quantity,
        },
      },
      { returnDocument: "after" },
    );
  }

  // //Hàm cập nhật trạng thái của giỏ hàng sau khi đã mua hàng
  // async updateStatus(user_id) {
  //   return this.CartCollection.findOneAndUpdate(
  //     {
  //       user_id: user_id,
  //     },
  //     {
  //       $set: {
  //       },
  //     },
  //   );
  // }

  async delete(user_id, variant_id) {
    return this.CartCollection.findOneAndUpdate(
      {
        user_id: user_id,
      },
      {
        $pull: {
          items: {
            variant_id: ObjectId.isValid(variant_id)
              ? new ObjectId(variant_id)
              : null,
          },
        },
      },
    );
  }

  async deleteAll(user_id) {
    return this.CartCollection.findOneAndUpdate(
      { user_id: user_id },
      {
        $set: {
          items: [],
        },
      },
      { returnDocument: "after" },
    );
  }

  async getAll(user_id) {
    const now = new Date();
    return await this.CartCollection.aggregate([
      {
        $match: {
          user_id: ObjectId.isValid(user_id) ? new ObjectId(user_id) : null,
        },
      },
      { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "Product_variant",
          localField: "items.variant_id",
          foreignField: "_id",
          as: "productDetail",
        },
      },
      { $unwind: "$productDetail" },
      {
        $lookup: {
          from: "Products",
          localField: "productDetail.product_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          variant_id: "$items.variant_id",
          quantityInCart: "$items.quantity",
          quantityInStock: "$productDetail.quantity",
          product_name: "$productInfo.product_name",
          product_id: "$productDetail.product_id",
          price: "$productInfo.base_price",
          image: "$productDetail.image_url",
          color_name: "$productDetail.color_name",
          size_name: "$productDetail.size_name",

          discount: {
            $cond: {
              if: {
                $and: [
                  { $gt: ["$productInfo.discount", 0] },
                  { $lte: ["$productInfo.discount_start", now] },
                  { $gte: ["$productInfo.discount_end", now] },
                ],
              },
              then: "$productInfo.discount",
              else: 0,
            },
          },
        },
      },
    ]).toArray();
  }
}

module.exports = Cart;
