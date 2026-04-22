import createPublicApiClient from "./publicApi.service";

class CollectionProduct {
  constructor(baseUrl = "/api/collection_product") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }
  getProducts = async (collectionId, page = 1) =>
    (await this.PublicApi.get(`/${collectionId}?page=${page}`)).data;
}

export default new CollectionProduct();
