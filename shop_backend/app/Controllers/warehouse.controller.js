const WareHouseService = require("../services/warehouse.service");
const ProductVariantService = require("../services/products_variant.service");
const ProductService = require("../services/products.service");
const OrderService = require("../services/order.service");
const MongDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// ==================== HELPER FUNCTIONS ====================

const createImportBill = async (items, employee_id, supplier_id, reason) => {
  const productVariantService = new ProductVariantService(MongDB.client);
  const productService = new ProductService(MongDB.client);
  const wareHouseService = new WareHouseService(MongDB.client);

  const checkedItems = [];
  let total_price = 0;

  for (const item of items) {
    const variant = await productVariantService.findVariantById(
      item.variant_id,
    );
    if (!variant)
      throw new Error(`Biến thể ID ${item.variant_id} không tồn tại!`);

    const product = await productService.findProductById(variant.product_id);

    checkedItems.push({
      variant_id: variant._id,
      product_name: product ? product.product_name : "Sản phẩm không xác định",
      color_name: variant.color_name,
      size_name: variant.size_name,
      quantity: Number(item.quantity),
      price: Number(item.price || 0),
      old_quantity: variant.quantity,
    });

    total_price += Number(item.price || 0) * Number(item.quantity);
    await productVariantService.adjustQuantity(variant._id, item.quantity);
  }

  await wareHouseService.createBill({
    type: "Phiếu nhập kho",
    employee_id,
    supplier_id,
    reason: reason || "Nhập hàng mới",
    items: checkedItems,
    total_price,
  });
};

const createExportBill = async (items, employee_id, reason, order_id) => {
  const productVariantService = new ProductVariantService(MongDB.client);
  const productService = new ProductService(MongDB.client);
  const wareHouseService = new WareHouseService(MongDB.client);

  const checkedItems = [];

  for (const item of items) {
    const variant = await productVariantService.findVariantById(
      item.variant_id,
    );
    if (!variant)
      throw new Error(`Biến thể ID ${item.variant_id} không tồn tại`);

    if (variant.quantity < Number(item.quantity))
      throw new Error(
        `"${variant.color_name} - ${variant.size_name}" không đủ tồn kho (Hiện có: ${variant.quantity}, cần xuất: ${item.quantity})`,
      );

    const product = await productService.findProductById(variant.product_id);

    checkedItems.push({
      variant_id: variant._id,
      product_name: product ? product.product_name : "Sản phẩm không xác định",
      color_name: variant.color_name,
      size_name: variant.size_name,
      quantity: Number(item.quantity),
      old_quantity: variant.quantity,
    });

    await productVariantService.adjustQuantity(
      variant._id,
      -Number(item.quantity),
    );
  }

  await wareHouseService.createBill({
    type: "Phiếu xuất hàng",
    employee_id,
    order_id,
    reason: reason || "Xuất hàng",
    items: checkedItems,
  });
};

const createAdjustBill = async (items, employee_id, reason) => {
  const productVariantService = new ProductVariantService(MongDB.client);
  const productService = new ProductService(MongDB.client);
  const wareHouseService = new WareHouseService(MongDB.client);

  const checkedItems = [];

  for (const item of items) {
    const variant = await productVariantService.findVariantById(
      item.variant_id,
    );
    if (!variant)
      throw new Error(`Không tìm thấy biến thể có id là ${item.variant_id}`);

    const newQuantity = variant.quantity + Number(item.quantity);
    if (newQuantity < 0)
      throw new Error(
        `Sản phẩm không đủ tồn kho để trừ (Hiện có: ${variant.quantity})`,
      );

    const product = await productService.findProductById(variant.product_id);

    checkedItems.push({
      variant_id: variant._id,
      product_name: product ? product.product_name : "Sản phẩm không xác định",
      color_name: variant.color_name,
      size_name: variant.size_name,
      quantity: Number(item.quantity),
      old_quantity: variant.quantity,
    });

    await productVariantService.adjustQuantity(variant._id, item.quantity);
  }

  await wareHouseService.createBill({
    type: "Phiếu điều chỉnh",
    employee_id,
    reason: reason || "Điều chỉnh kho định kỳ",
    items: checkedItems,
  });
};

exports.createBill = async (req, res, next) => {
  if (!req.body.type) return next(new ApiError(400, "Thiếu loại phiếu tạo"));

  const { type, items, supplier_id, reason } = req.body;

  try {
    if (type === "Phiếu nhập kho") {
      if (!items || items.length === 0 || !supplier_id)
        return next(new ApiError(400, "Thiếu thông tin để có thể tạo phiếu"));
      await createImportBill(items, req.user._id, supplier_id, reason);
    } else if (type === "Phiếu xuất hàng") {
      if (!items || items.length === 0)
        return next(new ApiError(400, "Thiếu danh sách sản phẩm cần xuất"));
      await createExportBill(items, req.user._id, reason, req.body.order_id);
    } else {
      if (!items || items.length === 0)
        return next(new ApiError(400, "Lỗi thiếu dữ liệu của phiếu cần tạo"));
      await createAdjustBill(items, req.user._id, reason);
    }

    return res.send("Tạo phiếu thành công!");
  } catch (error) {
    return next(new ApiError(400, error.message || "Lỗi server"));
  }
};

exports.getAllBill = async (req, res, next) => {
  try {
    const wareHouseService = new WareHouseService(MongDB.client);
    const bills = await wareHouseService.getAll();
    return res.json({ bills });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.exchangeOrder = async (req, res, next) => {
  const { order_id, new_variant_id } = req.body;
  if (!order_id || !new_variant_id)
    return next(new ApiError(400, "Thiếu thông tin đổi hàng"));

  try {
    const orderService = new OrderService(MongDB.client);
    const productVariantService = new ProductVariantService(MongDB.client);
    const productService = new ProductService(MongDB.client);

    const order = await orderService.findOrder(order_id);
    if (!order) return next(new ApiError(404, "Đơn hàng không tồn tại"));
    if (order.order_status !== "Đã giao")
      return next(new ApiError(400, "Chỉ đổi hàng khi đơn đã giao"));

    const newVariant =
      await productVariantService.findVariantById(new_variant_id);
    if (!newVariant)
      return next(new ApiError(404, "Sản phẩm muốn đổi không tồn tại"));

    const oldItem = order.items[0];

    // Nhập hàng cũ về
    await createImportBill(
      [
        {
          variant_id: oldItem.variant_id,
          quantity: oldItem.quantity,
          price: 0,
        },
      ],
      req.user._id,
      null,
      `Nhận hàng đổi trả - Đơn #${order_id}`,
    );

    // Xuất hàng mới ra
    await createExportBill(
      [{ variant_id: new_variant_id, quantity: oldItem.quantity }],
      req.user._id,
      `Xuất hàng đổi trả - Đơn #${order_id}`,
      order_id,
    );

    await orderService.updateStatus(order_id, "Đã đổi hàng", "Đã đổi hàng");
    return res.send("Đổi hàng thành công!");
  } catch (error) {
    return next(new ApiError(400, error.message || "Lỗi server"));
  }
};

exports.returnOrder = async (req, res, next) => {
  const { order_id, refund_info } = req.body;
  if (
    !order_id ||
    !refund_info?.bank ||
    !refund_info?.account ||
    !refund_info?.name
  )
    return next(new ApiError(400, "Thiếu thông tin hoàn trả"));

  try {
    const orderService = new OrderService(MongDB.client);

    const order = await orderService.findOrder(order_id);
    if (!order) return next(new ApiError(404, "Đơn hàng không tồn tại"));
    if (order.order_status !== "Đã giao")
      return next(new ApiError(400, "Chỉ hoàn trả khi đơn đã giao"));

    // Nhập toàn bộ hàng về kho
    await createImportBill(
      order.items.map((i) => ({
        variant_id: i.variant_id,
        quantity: i.quantity,
        price: 0,
      })),
      req.user._id,
      null,
      `Nhận hàng hoàn trả - Đơn #${order_id}`,
    );

    await orderService.updateStatus(
      order_id,
      "Chờ hoàn tiền",
      "Chờ hoàn tiền",
      refund_info,
    );
    return res.send("Đã ghi nhận hoàn trả, chờ chuyển tiền!");
  } catch (error) {
    return next(new ApiError(400, error.message || "Lỗi server"));
  }
};
