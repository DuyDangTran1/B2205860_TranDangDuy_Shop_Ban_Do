import axios from "axios";

export default (baseUrl, accessToken) => {
  const commonConfig = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    withCredentials: true,
  };

  return axios.create({
    baseURL: baseUrl,
    ...commonConfig,
  });
};
