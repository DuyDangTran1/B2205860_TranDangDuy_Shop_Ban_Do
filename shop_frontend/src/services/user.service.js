import createPublicApiClient from "./publicApi.service";
import createPrivateApiClient from "./privateApi.service";

class User {
  constructor(baseUrl = "/api/user") {
    const accessToken = localStorage.getItem("accessToken");
    this.publicApi = createPublicApiClient(baseUrl);
    this.privateApi = createPrivateApiClient(baseUrl, accessToken);
  }

  register = async (data) =>
    (await this.publicApi.post("/user/register", data)).data;
  login = async (data) => await this.publicApi.post("/user/login", data).data;
  loginWithAccountGoogle = async (data) =>
    await this.api.post("/user/loginGoogle", data).data;

  changePassword = async (data) => {};

  changeInformationUser = async (data) => {};

  existEmail = async (email) => {
    return (
      await this.publicApi.get("/isExist", {
        params: { email },
      })
    ).data;
  };
}
