import createPublicApiClient from "./publicApi.service";

class Voucher {
  constructor(baseUrl = "/api/voucher") {
    this.PublicApi = createPublicApiClient(baseUrl);
  }

  getVoucherUser = async () => (await this.PublicApi.get("/")).data;

  checkVoucher = async (query) =>
    (await this.PublicApi.get(`/check?${query}`)).data;
}

export default new Voucher();
