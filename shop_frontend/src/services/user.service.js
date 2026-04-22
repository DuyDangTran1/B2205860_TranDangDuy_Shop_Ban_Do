import createPublicApiClient from "./publicApi.service";

class User {
  constructor(baseUrl = "/api/user") {
    this.publicApi = createPublicApiClient(baseUrl);
  }

  register = async (data) =>
    (await this.publicApi.post("/register", data)).data;
  login = async (data) => (await this.publicApi.post("/login", data)).data;
  async loginGoogle(data) {
    return (await this.publicApi.post("/google-login", data)).data;
  }

  changePassword = async (data) => {};

  changeInformationUser = async (data) => {
    return (await this.publicApi.patch("/updateInformationUser", data)).data;
  };

  me = async () => (await this.publicApi.get("/me")).data;

  existEmail = async (email) =>
    (await this.publicApi.get("/isExist", { params: { email } })).data;

  logOut = async () => (await this.publicApi.get("/log_out")).data;
}

export default new User();
