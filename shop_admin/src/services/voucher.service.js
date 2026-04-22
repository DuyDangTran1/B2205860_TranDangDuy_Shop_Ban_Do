import createAdminApiClient from "./api.service";

class Voucher {
  constructor(baseUrl = "/api/voucher") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getAllVoucher = async () => {
    return (await this.privateApi.get(`/list_voucher`)).data;
  };

  updateVoucher = async (id, data) => {
    return (await this.privateApi.put(`/${id}`, data)).data;
  };

  createVoucher = async (data) => {
    return (await this.privateApi.post(`/`, data)).data;
  };

  changeStatusVoucher = async (id) => {
    return (await this.privateApi.patch(`/${id}`)).data;
  };
}

export default new Voucher();
