const WareHouseService = require("../services/warehouse.service");
const ProductVariantService = require("../services/products_variant.service");
const ProductService = require("../services/products.service");
const OrderService = require("../services/order.service");
const MongDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
exports.createBill = async (req, res, next) => {
  if (!req.body.type) return next(new ApiError(400, "Thiếu loại phiếu tạo"));

  const type = req.body.type;
  try {
    if (type === "Phiếu nhập kho") {
      if (
        !req.body.items ||
        req.body.items.length === 0 ||
        !req.body.supplier_id
      ) {
        return next(new ApiError(400, "Thiếu thông tin để có thể tạo phiếu"));
      }

      // items: [{ variant_id1, color_name2, size_name3, quantity4, price5, old_quantity (cho adjust) }]
      // check kiểm tra các biến thể có tồn tại trong hệ thống không
      const productVariantService = new ProductVariantService(MongDB.client);
      const productService = new ProductService(MongDB.client);
      const checkedItems = [];
      let total_price = 0;
      for (const item of req.body.items) {
        // 1. Kiểm tra xem variant có tồn tại không
        const variant = await productVariantService.findVariantById(
          item.variant_id,
        );

        if (!variant) {
          return next(
            new ApiError(404, `Biến thể ID ${item.variant_id} không tồn tại!`),
          );
        }

        const product = await productService.findProductById(
          variant.product_id,
        );

        const product_name = product
          ? product.product_name
          : "Sản phẩm không xác định";
        checkedItems.push({
          variant_id: variant._id,
          product_name: product_name,
          color_name: variant.color_name,
          size_name: variant.size_name,
          quantity: Number(item.quantity),
          price: Number(item.price || 0),
          old_quantity: variant.quantity,
        });

        total_price += Number(item.price) * Number(item.quantity);
        await productVariantService.adjustQuantity(variant._id, item.quantity);
      }

      // Gán lại items đã kiểm tra vào payload
      const payload = {
        ...req.body,
        items: checkedItems,
        reason: req.body.reason || "Nhập hàng mới",
      };

      payload.employee_id = req.user._id;
      payload.total_price = total_price;
      payload.supplier_id = req.body.supplier_id;
      const wareHouseService = new WareHouseService(MongDB.client);
      await wareHouseService.createBill(payload);

      return res.send("Tạo phiếu thành công!");
    } else if (type === "Phiếu xuất hàng") {
      if (!req.body.employee_id || !req.body.order_id)
        return next(
          new ApiError(400, "Lỗi truyền thiếu dữ liệu của phiếu cần tạo"),
        );

      const orderService = new OrderService(MongoDB.client);
      const order = await orderService.findOrder(req.body.order_id);
      if (!order) return next(new ApiError(404, "Đơn hàng không tồn tại"));
      const payload = {
        employee_id: req.user._id,
        order_id: req.body.order_id,
        items: order.items,
      };
      for (const item of order.items) {
        await productVariantService.adjustQuantity(
          item.variant_id,
          -item.quantity,
        );
      }
      const wareHouseService = new WareHouseService(MongDB.client);
      await wareHouseService.createBill(payload);

      return res.send("Tạo phiếu thành công!");
    } else {
      //Phiếu điều chỉnh
      if (!req.body.items || req.body.items.length === 0)
        return next(new ApiError(400, "Lỗi thiếu dữ liệu của phiếu cần tạo"));

      const productVariantService = new ProductVariantService(MongDB.client);
      const productService = new ProductService(MongDB.client);
      const checkedItems = [];

      for (const item of req.body.items) {
        const variant = await productVariantService.findVariantById(
          item.variant_id,
        );
        if (!variant)
          return next(
            new ApiError(
              404,
              `Không tìm thấy biến thể có id là ${item.variant_id}`,
            ),
          );

        const newQuantity = variant.quantity + Number(item.quantity);
        if (newQuantity < 0) {
          return next(
            new ApiError(
              400,
              `Sản phẩm ${product_name} không đủ tồn kho để trừ (Hiện có: ${variant.quantity})`,
            ),
          );
        }
        const product = await productService.findProductById(
          variant.product_id,
        );

        checkedItems.push({
          variant_id: variant._id,
          product_name: product
            ? product.product_name
            : "Sản phẩm không xác định",
          color_name: variant.color_name,
          size_name: variant.size_name,
          quantity: Number(item.quantity),
          old_quantity: variant.quantity,
        });

        await productVariantService.adjustQuantity(variant._id, item.quantity);
      }

      const payload = {
        type: "Phiếu điều chỉnh",
        employee_id: req.user._id,
        reason: req.body.reason || "Điều chỉnh kho định kỳ",
        items: checkedItems,
        created: new Date(),
      };

      const wareHouseService = new WareHouseService(MongDB.client);
      await wareHouseService.createBill(payload);
      return res.send("Tạo phiếu điều chỉnh thành công!");
    }
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
exports.getAllBill = async (req, res, next) => {
  try {
    const wareHouseService = new WareHouseService(MongDB.client);
    const bills = await wareHouseService.getAll();
    return res.json({ bills: bills });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
