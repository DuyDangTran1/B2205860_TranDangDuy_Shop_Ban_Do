const { ObjectId } = require("mongodb");

class WareHouse {
  constructor(client) {
    this.WareHouse = client.db().collection("WareHouse");
  }

  extractData(payload) {
    const bill = {
      employee_id: ObjectId.isValid(payload.employee_id)
        ? new ObjectId(payload.employee_id)
        : undefined,
      source_id: ObjectId.isValid(payload.source_id)
        ? new ObjectId(payload.source_id)
        : undefined,
      type: payload.type,
      order_id: payload.order_id,
      reason: payload.reason,
      supplier_id: ObjectId.isValid(payload.supplier_id)
        ? new ObjectId(payload.supplier_id)
        : undefined,
      total_price: Number(payload.total_price || 0),
      // items: [{ variant_id, color_name, size_name, quantity, old_quantity (cho adjust) }]
      items: payload.items || [],
      created: new Date(),
    };

    Object.keys(bill).forEach(
      (key) => bill[key] === undefined && delete bill[key],
    );

    return bill;
  }

  async createBill(payload) {
    const newBill = this.extractData(payload);
    const result = await this.WareHouse.insertOne(newBill);

    return result;
  }

  async getAll() {
    return await this.WareHouse.aggregate([
      { $sort: { created: -1 } },
      {
        $lookup: {
          from: "Employee",
          localField: "employee_id",
          foreignField: "_id",
          as: "employee_info",
        },
      },
      {
        $unwind: {
          path: "$employee_info",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          employee_id: 1,
          type: 1,
          reason: 1,
          items: 1,
          created: 1,
          employee_name: "$employee_info.name",
          total_price: {
            $cond: {
              if: { $eq: ["$type", "Phiếu nhập kho"] },
              then: "$total_price",
              else: "$$REMOVE",
            },
          },
        },
      },
    ]).toArray();
  }

  // Lấy chi tiết một phiếu
  async getBillById(id) {
    return await this.WareHouse.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  // Thống kê tổng quan Nhập/Xuất
  async getWarehouseStats(startDate, endDate) {
    return await this.WareHouse.aggregate([
      {
        $match: {
          created: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      {
        $group: {
          _id: "$type",
          totalValue: { $sum: "$total_price" },
          totalQuantity: {
            $sum: {
              $reduce: {
                input: "$items",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.quantity"] },
              },
            },
          },
        },
      },
    ]).toArray();
  }

  //Chi tiết các mặt hàng đã nhập
  async getDetailImportProducts(startDate, endDate) {
    return await this.WareHouse.aggregate([
      {
        $match: {
          type: "Phiếu nhập kho",
          created: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_name",
          variant_name: { $first: "$items.variant_name" },
          totalQty: { $sum: "$items.quantity" },
          totalAmount: {
            $sum: {
              $multiply: ["$items.quantity", { $ifNull: ["$items.price", 0] }],
            },
          },
        },
      },
    ]).toArray();
  }

  async getDetailExportProducts(startDate, endDate) {
    return await this.WareHouse.aggregate([
      {
        $match: {
          type: "Phiếu xuất kho", // Lọc đúng loại phiếu xuất
          created: { $gte: new Date(startDate), $lte: new Date(endDate) },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_name",
          variant_name: { $first: "$items.variant_name" },
          reason: { $first: "$reason" },
          totalQty: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQty: -1 } },
    ]).toArray();
  }
}

module.exports = WareHouse;
