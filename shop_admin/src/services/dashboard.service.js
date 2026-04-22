import createAdminApiClient from "./api.service";

class Dashboard {
  constructor(baseUrl = "/api/dashboard") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getOverview = async () => {
    return (await this.privateApi.get(`/`)).data;
  };
}

export default new Dashboard();
