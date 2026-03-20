const ApiError = require("../api-error");
const UserService = require("../services/user.service");
const EmployeeService = require("../services/employee.service");
const MongoDB = require("../utils/mongodb.util");
const config = require("../config/index");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
exports.Authentication = async (req, res, next) => {
  console.log(req.headers);
  try {
    if (
      !req.headers ||
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer ")
    )
      return next(new ApiError(401, "người dùng không hợp lệ"));

    const parts = req.headers.authorization.split(" ");
    if (parts.length != 2)
      return next(new ApiError(401, "Token không đúng định dạng"));
    const accessToken = parts[1].trim();
    const decode = jwt.verify(accessToken, config.key.secretKey);
    let user;
    // console.log(decode);
    if (decode.role == "user") {
      const user_service = new UserService(MongoDB.client);
      user = await user_service.find({
        _id: ObjectId.isValid(decode.id) ? new ObjectId(decode.id) : null,
      });
      // console.log(user);
    } else {
      const employeeService = new EmployeeService(MongoDB.client);
      user = await employeeService.findById(decode.id);
    }
    if (!user) return next(new ApiError(404, "Người dùng không tồn tại"));
    delete user.password;
    req.user = user;
    next();
  } catch (error) {
    return next(new ApiError(403, "Token không hợp lệ hoặc đã hết hiệu lực"));
  }
};

exports.isStaff = async (req, res, next) => {
  if (req.user.role == "user")
    return next(new ApiError(401, "Không thể sử dụng tài nguyên"));

  if (req.user.block)
    return next(new ApiError(403, "Tài khoản nhân viên đã bị khóa"));
  next();
};
