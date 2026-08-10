const OrderService = require("../services/order.service");
const UserService = require("../services/user.service");
const ProductVariantService = require("../services/products_variant.service");
const ProductService = require("../services/products.service");
const WareHouseService = require("../services/warehouse.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const orderService = new OrderService(MongoDB.client);
    const userService = new UserService(MongoDB.client);
    const warehouseService = new WareHouseService(MongoDB.client);
    const variantService = new ProductVariantService(MongoDB.client);
    let { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      const now = new Date();
      endDate = now.toISOString().substr(0, 10);
      startDate = new Date(now.setDate(now.getDate() - 30))
        .toISOString()
        .substr(0, 10);
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [
      revenueSummary,
      refundSummary,

      totalUsers,
      orderStatusData,
      newUsersData,
      inventorySummary,
      statusOverTime,
      topSellingData,
      revenueByCategory,
    ] = await Promise.all([
      orderService.getRevenueStats(start, end),
      orderService.getRefundStats(start, end),
      userService.getTotalUsers(),
      orderService.getOrderStatusStats(start, end),
      userService.getNewUsersByDate(start, end),
      variantService.getInventoryStats(),
      orderService.getOrderStatusOverTime(start, end),
      orderService.getTopSellingProducts(5),
      orderService.getRevenueByCategory(start, end),
    ]);

    return res.json({
      success: true,
      data: {
        totalRevenue: revenueSummary[0]?.totalRevenue || 0,
        totalOrders: revenueSummary[0]?.orderCount || 0,
        totalRefund: refundSummary[0]?.totalRefund || 0,
        totalUsers,
        orderStatusDistribution: orderStatusData,
        newUsersOverTime: newUsersData,
        inventory: inventorySummary,
        statusOverTime: statusOverTime,
        topProducts: topSellingData,
        revenueByCategory: revenueByCategory,
      },
    });
  } catch (error) {
    console.log("Lỗi Statistical Controller:", error);
    return next(new ApiError(500, "Lỗi khi lấy dữ liệu thống kê"));
  }
};

exports.getInventoryStats = async (req, res, next) => {
  try {
    const keyword = req.query.keyword;
    const productService = new ProductService(MongoDB.client);
    const allProductsInventory =
      await productService.getAllProductInventory(keyword);
    return res.json({
      success: true,
      data: {
        allInventory: allProductsInventory,
      },
    });
  } catch (e) {
    console.log(e);
    return next(new ApiError(500, "Lỗi khi lấy dữ liệu"));
  }
};

exports.getInventoryWarehouseStats = async (req, res, next) => {
  try {
    const { keyword, startDate, endDate } = req.query;
    const variantService = new ProductVariantService(MongoDB.client);
    const allProductsWarehouseInventory =
      await variantService.getAllProductInventoryWarehouse(
        keyword,
        startDate,
        endDate,
      );
    return res.json({
      success: true,
      data: {
        allInventory: allProductsWarehouseInventory,
      },
    });
  } catch (e) {
    console.log(e);
    return next(new ApiError(500, "Lỗi khi lấy dữ liệu xuất nhập tồn"));
  }
};
