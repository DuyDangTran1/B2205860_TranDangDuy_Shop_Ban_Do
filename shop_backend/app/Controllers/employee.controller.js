const MongoDB = require("../utils/mongodb.util");
const EmployeeService = require("../services/employee.service");
const SessionService = require("../services/session.service");
const ApiError = require("../api-error");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/index");
const crypto = require("crypto");
exports.createEmployee = async (req, res, next) => {
  console.log(req.body);
  if (
    !req.body.name ||
    !req.body.email ||
    !req.body.password ||
    !req.body.phone ||
    !req.body.role
  ) {
    return next(new ApiError(400, "Thiếu thông tin"));
  }
  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const error = {};
    if (await employeeService.findEmployee({ email: req.body.email })) {
      error.email = "Email đã tồn tại";
    }

    if (await employeeService.findEmployee({ phone: req.body.phone })) {
      error.phone = "Số điện thoại đã tồn tại";
    }

    if (Object.keys(error).length !== 0) return next(new ApiError(404, error));

    const employee = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: await bcrypt.hash(req.body.password, 10),
      role: req.body.role,
    };

    await employeeService.createEmployee(employee);
    return res.status(201).json({ message: "Tạo tài khoản thành công" });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.loginEmployee = async (req, res, next) => {
  if (!req.body.email || !req.body.password)
    return next(new ApiError(400, "Thiếu thông tin đăng nhập"));

  const account = {
    email: req.body.email.trim(),
    password: req.body.password,
  };

  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const employee = await employeeService.findEmployee({
      email: account.email,
    });

    if (!employee)
      return next(new ApiError(404, "Email hoặc mật khẩu không đúng"));
    if (!(await bcrypt.compare(account.password, employee.password)))
      return next(new ApiError(404, "Email hoặc mật khẩu không đúng"));

    if (employee && employee.block == true)
      return next(new ApiError(403, "Tài khoản đã bị khóa"));

    const accessToken = jwt.sign(
      { id: employee._id, email: account.email, role: employee.role },
      config.key.secretKey,
      { expiresIn: "1h" },
    );

    const refreshToken = crypto.randomBytes(24).toString("hex");

    const session = new SessionService(MongoDB.client);
    await session.create({
      email: account.email,
      refreshToken: refreshToken,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "Lax",
    });

    return res.json({
      accessToken: accessToken,
      name: employee.name,
      role: employee.role,
    });
  } catch (error) {
    console.log(error);
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình đăng nhập"),
    );
  }
};

exports.updateEmployee = async (req, res, next) => {};

exports.getListEmployee = async (req, res, next) => {
  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const list = await employeeService.getListEmployee();
    return res.json({ list: list });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.updateStatusAccount = async (req, res, next) => {
  const employee_id = req.params.id;
  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const employee = await employeeService.findById(employee_id);
    if (!employee) return next(new ApiError(404, "Không tìm thấy nhân viên"));

    await employeeService.statusAccount(employee_id, !employee.block);
    return res.json({
      message: "Cập nhật trạng thái thành công",
      block: !employee.block,
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};
