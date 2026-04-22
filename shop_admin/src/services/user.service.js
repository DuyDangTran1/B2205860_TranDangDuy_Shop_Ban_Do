import createAdminApiClient from "./api.service";

class User {
  constructor(baseUrl = "/api/user") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getWaitingList = async () =>
    (await this.privateApi.get("/waiting-list")).data;
  updateStatusAccount = async (id) =>
    (await this.privateApi.patch(`/${id}`)).data;
  getAllUser = async () => (await this.privateApi.get("/")).data;
}

export default new User();
