const MongoDB = require("../utils/mongodb.util");
const UserService = require("../services/user.service");
const ApiError = require("../api-error");
const SessionService = require("../services/session.service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/index");
const crypto = require("crypto");
exports.register = async (req, res, next) => {
  console.log(req.body);
  if (
    !req.body.email ||
    !req.body.phone ||
    !req.body.password ||
    !req.body.terms_and_condition
  )
    return next(new ApiError(400, "Thiếu thông tin đăng ký"));
  const error = {};
  try {
    const user_service = new UserService(MongoDB.client);

    if (await user_service.find({ email: req.body.email }))
      error.err_email = "Email đã tồn tại";
    if (await user_service.find({ phone: req.body.phone }))
      error.err_phone = "Số điện thoại đã tồn tại";

    if (Object.keys(error).length > 0) return next(new ApiError(409, error));

    const user = {
      email: req.body.email,
      phone: req.body.phone,
      name: req.body.email.split("@")[0],
      password: await bcrypt.hash(req.body.password, 10),
      terms_and_condition: req.body.terms_and_condition,
      count_violate: 0,
      block: false,
      role: "user",
    };

    await user_service.created(user);
    return res.send("Đăng kí tài khoản thành công");
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình tạo tài khoản"),
    );
  }
};

exports.login = async (req, res, next) => {
  if (!req.body.email || !req.body.password)
    return next(new ApiError(400, "Thiếu thông tin đăng nhập"));

  const account = {
    email: req.body.email.trim(),
    password: req.body.password,
  };

  try {
    const user_service = new UserService(MongoDB.client);
    const user = await user_service.find({ email: account.email });

    if (!user) return next(new ApiError(404, "Email hoặc mật khẩu không đúng"));
    if (!(await bcrypt.compare(account.password, user.password)))
      return next(new ApiError(404, "Email hoặc mật khẩu không đúng"));

    const accessToken = jwt.sign(
      { id: user._id, email: account.email, role: user.role },
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
      name: user.name,
    });
  } catch (error) {
    return next(
      new ApiError(500, "Đã có lỗi xảy ra trong quá trình đăng nhập"),
    );
  }
};

exports.loginWithGoogle = async () => {};

exports.getAllUser = async () => {};

exports.updateInformationUser = async () => {};

exports.Me = async (req, res) => {
  const user = req.user;
  res.json({
    user_information: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name || "",
      birthday: user.birthday || "",
      address: user.address || "",
      image_url: user.image_url || "",
    },
  });
};

exports.getWaitingList = async (req, res, next) => {
  try {
    const userService = new UserService(MongoDB.client);
    const waitingUsers = await userService.getWaitingUsers();

    console.log(waitingUsers);
    return res.json({
      success: true,
      data: waitingUsers,
    });
  } catch (error) {
    return next(new ApiError(500, "Lỗi lấy danh sách chờ tư vấn"));
  }
};
