import createPublicApiClient from "./publicApi.service";

class Category {
  constructor(baseUrl = "/api/categories") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  getCategoryTree = async (slug) =>
    (await this.PublicApi.get(`/tree/${slug}`)).data;

  getAllCategory = async () => {
    return (await this.PublicApi.get(`/`)).data;
  };
}

export default new Category();
