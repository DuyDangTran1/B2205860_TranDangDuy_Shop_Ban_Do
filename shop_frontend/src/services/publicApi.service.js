import axios from "axios";
import router from "@/router";

// Biến quản lý trạng thái Refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export default (baseURL) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
  });

  //Request Interceptor
  instance.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Tự động xử lý Content-Type
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  });

  //Client riêng biệt để refresh (Không dính interceptor của instance)
  const refreshClient = axios.create({
    baseURL: "/api/user",
    withCredentials: true,
  });

  //Response Interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const token = sessionStorage.getItem("accessToken");

      // Nếu lỗi 403 (Token hết hạn) và có token cũ để refresh
      if (error.response?.status === 403 && !originalRequest._retry && token) {
        // NẾU ĐANG CÓ REQUEST KHÁC ĐANG REFRESH -> ĐỨNG VÀO HÀNG ĐỢI
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        // BẮT ĐẦU REFRESH (CHỈ 1 tài khoản ĐƯỢC VÀO ĐÂY)
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const res = await refreshClient.post("/refresh-token");
          const { accessToken } = res.data;

          sessionStorage.setItem("accessToken", accessToken);

          // GIẢI PHÓNG HÀNG ĐỢI (Cấp token mới cho mấy thằng đang đợi)
          processQueue(null, accessToken);
          isRefreshing = false;

          // Chạy lại request hiện tại
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // REFRESH THẤT BẠI (Hết hạn cả Refresh Token)
          processQueue(refreshError, null);
          isRefreshing = false;

          sessionStorage.clear();
          router.push({ name: "Login" });
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};
