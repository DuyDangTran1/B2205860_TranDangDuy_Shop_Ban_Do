import createAdminApiClient from "./api.service";

class Activity {
  constructor(baseUrl = "/api/activity") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  findAll = async () => {
    return (await this.privateApi.get(`/`)).data;
  };
}

export default new Activity();
