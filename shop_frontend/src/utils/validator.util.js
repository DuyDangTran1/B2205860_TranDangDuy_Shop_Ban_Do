const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/;

export const validateEmail = (email) => {
  if (!email) return "Không được bỏ trống mật khẩu";

  if (!emailRegex.test(email)) return "Email không đúng định dạng";

  return "";
};

export const validatePhone = (phone) => {
  if (!phone) return "Không được bỏ trống mật khẩu";

  if (!phoneRegex.test(phone)) return "Số điện thoại không đúng";

  return "";
};

export const validatePassword = (password) => {
  if (!password) return "Vui lòng nhập mật khẩu";
  if (password.length < 8) return "Mật khẩu phải từ 8 ký tự trở lên";
  return "";
};

export const validateConfirmPass = (password, confirm_password) => {
  if (!confirm_password) return "Vui lòng xác nhận lại mật khẩu";

  if (confirm_password !== password) return "Mật khẩu xác nhận lại không đúng";

  return "";
};
