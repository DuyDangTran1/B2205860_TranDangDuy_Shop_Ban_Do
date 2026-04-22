import createAdminApiClient from "./api.service";

class Statistical {
  constructor(baseUrl = "/api/statistical") {
    this.Api = createAdminApiClient(baseUrl);
  }

  getDashboardStats = async (queryData) => {
    return (await this.Api.get("/", { params: queryData })).data;
  };
}

export default new Statistical();
