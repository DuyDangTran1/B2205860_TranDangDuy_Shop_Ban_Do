const MongoDB = require("../utils/mongodb.util");
const EmployeeService = require("../services/employee.service");
const SessionService = require("../services/session.service");
const ActivityService = require("../services/activity.service");
const ApiError = require("../api-error");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/index");
const crypto = require("crypto");
const multer_mw = require("../middelwares/multer.middelware");
exports.createEmployee = async (req, res, next) => {
  // console.log(req.body);
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
    const activityService = new ActivityService(MongoDB.client);
    if (await employeeService.findEmployee({ email: req.body.email })) {
      return next(new ApiError(404, "Email đã tồn tại"));
    }

    if (await employeeService.findEmployee({ phone: req.body.phone })) {
      return next(new ApiError(404, "Số điện thoại đã tồn tại"));
    }

    const employee = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: await bcrypt.hash(req.body.password, 10),
      role: req.body.role,
    };

    await employeeService.createEmployee(employee);
    await activityService.createLog(
      "Nhân viên",
      `${req.user.role} ${req.user.name} đã tạo tài khoản cho nhân viên mới: ${req.body.name}`,
    );
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

    console.log(employee);
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
      image_url: employee.url_image,
    });
  } catch (error) {
    console.log(error);
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình đăng nhập"),
    );
  }
};

exports.updateEmployee = async (req, res, next) => {
  const id = req.user._id;

  const { password, email, role, ...updateData } = req.body;

  try {
    const employeeService = new EmployeeService(MongoDB.client);

    const oldEmployee = await employeeService.findById(id);
    if (!oldEmployee)
      return next(new ApiError(404, "Không tìm thấy nhân viên"));

    if (req.file) {
      if (oldEmployee.url_image) {
        multer_mw.removeFile(oldEmployee.url_image);
      }
      updateData.url_image = `uploads/avatars/${req.file.filename}`;
    }

    const result = await employeeService.updateStaff(id, updateData);

    return res.json({
      message: "Cập nhật thông tin cá nhân thành công",
      user: result,
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server khi cập nhật"));
  }
};
exports.getInforEmployee = async (req, res, next) => {
  const id = req.user._id;
  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const employee = await employeeService.findById(id);
    delete employee.password;
    delete employee._id;
    return res.json({ infor: employee });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.changePassword = async (req, res, next) => {
  const id = req.user._id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ApiError(400, "Vui lòng nhập mật khẩu cũ và mới"));
  }

  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const employee = await employeeService.findById(id);
    // console.log(employee);
    const isMatch = await bcrypt.compare(oldPassword, employee.password);
    if (!isMatch) {
      return next(new ApiError(401, "Mật khẩu cũ không chính xác"));
    }

    //Mã hóa mật khẩu mới và lưu
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await employeeService.changePassword(id, hashedPassword);

    return res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server khi đổi mật khẩu"));
  }
};

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
    const activityService = new ActivityService(MongoDB.client);
    const employee = await employeeService.findById(employee_id);
    if (!employee) return next(new ApiError(404, "Không tìm thấy nhân viên"));

    await employeeService.statusAccount(employee_id, !employee.block);
    const action = !employee.block ? "khóa" : "mở khóa";
    await activityService.createLog(
      "Hệ thống",
      `${req.user.role} ${req.user.name} đã ${action} tài khoản của ${employee.name}`,
    );
    return res.json({
      message: "Cập nhật trạng thái thành công",
      block: !employee.block,
    });
  } catch (error) {
    console.log(error);
    return next(new ApiError(500, "Lỗi server"));
  }
};

exports.refreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return next(new ApiError(401, "Không tìm thấy Refresh Token"));
  }
  try {
    const sessionService = new SessionService(MongoDB.client);
    const employeeService = new EmployeeService(MongoDB.client);
    const session = await sessionService.findRefreshToken(refreshToken);

    // console.log(refreshToken);
    // console.log(req.cookies);
    if (!session) {
      return next(
        new ApiError(403, "Phiên đăng nhập không tồn tại hoặc đã hết hạn"),
      );
    }

    const employee = await employeeService.findEmployee({
      email: session.email,
    });

    if (!employee) return next(new ApiError(404, "Tài khoản không tồn tại"));

    if (employee && employee.block == true)
      return next(new ApiError(403, "Tài khoản đã bị khóa"));
    const accessToken = jwt.sign(
      { id: employee._id, email: employee.email, role: employee.role },
      config.key.secretKey,
      { expiresIn: "1h" },
    );

    const newRefreshToken = crypto.randomBytes(24).toString("hex");

    await sessionService.create({
      email: employee.email,
      refreshToken: newRefreshToken,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "Lax",
    });

    return res.json({
      success: true,
      accessToken: accessToken,
    });
  } catch (error) {
    return next(new ApiError(403, "Refresh Token không hợp lệ hoặc hết hạn"));
  }
};

exports.logOut = async (req, res, next) => {
  const id = req.user._id;
  try {
    const employeeService = new EmployeeService(MongoDB.client);
    const sessionService = new SessionService(MongoDB.client);
    const employee = await employeeService.findById(id);
    await sessionService.delete(employee.email);
    return res.json({ message: "Xóa phiên đăng nhập thành công" });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
