import createAdminApiClient from "./api.service";

class User {
  constructor(baseUrl = "/api/user") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getWaitingList = async () =>
    (await this.privateApi.get("/waiting-list")).data;
}

export default new User();
