import createPublicApiClient from "./publicApi.service";

class User {
  constructor(baseUrl = "/api/user") {
    this.publicApi = createPublicApiClient(baseUrl);
  }

  register = async (data) =>
    (await this.publicApi.post("/register", data)).data;
  login = async (data) => (await this.publicApi.post("/login", data)).data;
  loginWithAccountGoogle = async (data) => {};

  changePassword = async (data) => {};

  changeInformationUser = async (data) => {};

  me = async (accessToken) => {
    return (
      await this.publicApi.get("/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    ).data;
  };

  existEmail = async (email) => {
    return (
      await this.publicApi.get("/isExist", {
        params: { email },
      })
    ).data;
  };
}

export default new User();
