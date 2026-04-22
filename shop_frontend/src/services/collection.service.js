import createPublicApiClient from "./publicApi.service";

class Collection {
  constructor(baseUrl = "/api/collection") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  getAll = async () => (await this.PublicApi.get("/")).data;

  getFeatured = async () => (await this.PublicApi.get("/featured")).data;

  getOne = async (id) => (await this.PublicApi.get(`/${id}`)).data;
}

export default new Collection();
