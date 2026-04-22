import createAdminApiClient from "./api.service";

class CollectionProduct {
  constructor(baseUrl = "/api/collection_product") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllCollectionProduct = async (collection_id) => {
    return (await this.privateApi.get(`/admin/${collection_id}`)).data;
  };

  createCollection = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  deleteCollection = async (collection_id, product_id) => {
    return (await this.privateApi.delete(`/${collection_id}/${product_id}`))
      .data;
  };
}

export default new CollectionProduct();
