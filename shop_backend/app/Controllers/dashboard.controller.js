const ApiError = require("../api-error");
const MongoDB = require("../utils/mongodb.util");
const EmployeeService = require("../services/employee.service");
const UserService = require("../services/user.service");
const OrderService = require("../services/order.service");
const ProductService = require("../services/products.service");

exports.getOverview = async (req, res, next) => {
  try {
    const productService = new ProductService(MongoDB.client);
    const employeeService = new EmployeeService(MongoDB.client);
    const orderService = new OrderService(MongoDB.client);
    const userService = new UserService(MongoDB.client);

    const [countProduct, countEmployee, countOrder, countUser] =
      await Promise.all([
        productService.countProduct(),
        employeeService.countEmployee(),
        orderService.countNewOrder(),
        userService.countUser(),
      ]);

    return res.json({
      products: countProduct,
      employees: countEmployee,
      orders: countOrder,
      users: countUser,
    });
  } catch (error) {
    return next(new ApiError(500, "Lỗi lấy dữ liệu tổng quan"));
  }
};
