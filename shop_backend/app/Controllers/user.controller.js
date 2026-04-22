const admin = require("../config/firebase-admin");
const MongoDB = require("../utils/mongodb.util");
const UserService = require("../services/user.service");
const ApiError = require("../api-error");
const SessionService = require("../services/session.service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/index");
const crypto = require("crypto");
const multer_mw = require("../middelwares/multer.middelware");
const { type } = require("os");

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
      type_account: "system",
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

    if (user.block) return next(new ApiError("Tài khoản cuản bạn đã bị khóa"));
    const accessToken = jwt.sign(
      { id: user._id, email: account.email, role: user.role },
      config.key.secretKey,
      { expiresIn: "2m" },
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

exports.updateStatusAccount = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return next(new ApiError(400, "Thiếu id tài khoản cần cập nhật"));
    const user_service = new UserService(MongoDB.client);
    const user = await user_service.findById(id);
    if (!user)
      return next(new ApiError(404, "Không tìm thấy tài khoản cần cập nhật"));
    const newStatus = !user.block;
    await user_service.updateStatusAccount(id, newStatus);
    return res.send(
      `Đã ${newStatus ? "khóa" : "mở khóa"} tài khoản thành công`,
    );
  } catch (error) {
    return next(new ApiError(500, "Lỗi Server"));
  }
};

exports.loginGoogle = async (req, res, next) => {
  const { token } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, picture } = decodedToken;

    const user_service = new UserService(MongoDB.client);
    let user = await user_service.find({ email: email });

    if (user) {
      if (user.type_account === "system") {
        return next(
          new ApiError(
            400,
            "Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bình thường.",
          ),
        );
      }

      if (user.block) {
        return next(new ApiError(403, "Tài khoản của bạn đã bị khóa"));
      }
    } else {
      const newUser = {
        name: name,
        email: email,
        type_account: "google",
        image_url: picture,
        phone: "",
        terms_and_condition: true,
      };

      const result = await user_service.created(newUser);
      user = await user_service.findById(result.insertedId);
    }

    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.key.secretKey,
      { expiresIn: "1h" },
    );

    const refreshToken = crypto.randomBytes(24).toString("hex");
    const session = new SessionService(MongoDB.client);
    await session.create({ email: user.email, refreshToken: refreshToken });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "Lax",
    });

    return res.json({ accessToken, name: user.name });
  } catch (error) {
    console.log("Lỗi Login Google:", error);
    return next(new ApiError(401, "Xác thực Google không hợp lệ"));
  }
};
exports.updateInformationUser = async (req, res, next) => {
  const id = req.user._id;
  const updateData = { ...req.body };

  try {
    const user_service = new UserService(MongoDB.client);

    const currentUser = await user_service.findById(id);
    if (!currentUser)
      return next(new ApiError(404, "Không tìm thấy người dùng"));

    //Logic kiểm tra Số điện thoại
    if (updateData.phone && updateData.phone !== "") {
      // Nếu đã có số điện thoại rồi mà định sửa sang số khác -> Chặn
      if (
        currentUser.phone &&
        currentUser.phone !== "" &&
        currentUser.phone !== updateData.phone
      ) {
        return next(
          new ApiError(
            400,
            "Số điện thoại đã được xác thực, không thể thay đổi",
          ),
        );
      }

      // Nếu đây là lần đầu nhập phone, phải check xem số này có ai dùng chưa
      if (!currentUser.phone || currentUser.phone === "") {
        const existingPhone = await user_service.find({
          phone: updateData.phone,
        });
        if (existingPhone && existingPhone._id.toString() !== id.toString()) {
          return next(
            new ApiError(
              409,
              "Số điện thoại này đã được sử dụng bởi tài khoản khác",
            ),
          );
        }
      }
    } else {
      // Nếu gửi phone rỗng lên mà trong DB đã có phone thì xóa khỏi updateData để không bị ghi đè rỗng
      delete updateData.phone;
    }

    //Xử lý Avatar
    if (req.file) {
      if (
        currentUser.image_url &&
        !currentUser.image_url.includes("avatar_default") &&
        !currentUser.image_url.startsWith("http")
      ) {
        multer_mw.removeFile(currentUser.image_url);
      }
      updateData.image_url = `uploads/avatars/${req.file.filename}`;
    }

    const result = await user_service.update(id, updateData);
    return res.json({
      message: "Cập nhật thông tin thành công",
      user: result,
    });
  } catch (error) {
    console.error(error);
    return next(new ApiError(500, "Lỗi cập nhật thông tin"));
  }
};

exports.getAllUser = async (req, res, next) => {
  try {
    const user_service = new UserService(MongoDB.client);
    const users = await user_service.getAll();
    return res.json({ users: users });
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};

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
      rank: user.rank || "Đồng",
    },
  });
};

exports.getWaitingList = async (req, res, next) => {
  try {
    const userService = new UserService(MongoDB.client);
    const waitingUsers = await userService.getWaitingUsers(req.user._id);

    console.log(waitingUsers);
    return res.json({
      success: true,
      data: waitingUsers,
    });
  } catch (error) {
    return next(new ApiError(500, "Lỗi lấy danh sách chờ tư vấn"));
  }
};

exports.refreshToken = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return next(new ApiError(401, "Không tìm thấy Refresh Token"));
  }
  try {
    const sessionService = new SessionService(MongoDB.client);
    const user_service = new UserService(MongoDB.client);
    const session = await sessionService.findRefreshToken(refreshToken);

    console.log(refreshToken);
    console.log(req.cookies);
    if (!session) {
      return next(
        new ApiError(403, "Phiên đăng nhập không tồn tại hoặc đã hết hạn"),
      );
    }

    const user = await user_service.find({ email: session.email });

    if (!user) return next(new ApiError(404, "Tài khoản không tồn tại"));
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.key.secretKey,
      { expiresIn: "1h" },
    );

    const newRefreshToken = crypto.randomBytes(24).toString("hex");

    await sessionService.create({
      email: user.email,
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
    console.log(error);
    return next(new ApiError(403, "Refresh Token không hợp lệ hoặc hết hạn"));
  }
};

exports.logOut = async (req, res, next) => {
  try {
    const sessionService = new SessionService(MongoDB.client);
    await sessionService.delete(req.user.email);
    return res.send("Xóa phiên đăng nhập thành công");
  } catch (error) {
    return next(new ApiError(500, "Lỗi server"));
  }
};
