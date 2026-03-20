import createPublicApiClient from "./publicApi.service";

class Category {
  constructor(baseUrl = "/api/category") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  getCategoryTree = async (slug) =>
    (await this.PublicApi(`/tree/${slug}`)).data;
}

export default new Category();
