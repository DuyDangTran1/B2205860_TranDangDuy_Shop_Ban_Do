import createAdminApiClient from "./api.service";

class Employee {
  constructor(baseUrl = "/api/employee") {
    this.privateApi = createAdminApiClient(baseUrl);
  }
  getListEmployee = async () => (await this.privateApi.get("/")).data;

  create = async (data) => (await this.privateApi.post("/", data)).data;

  login = async (data) => (await this.privateApi.post("/login", data)).data;

  updateStatusAccount = async (id) =>
    (await this.privateApi.patch(`/updateStatusAccount/${id}`)).data;

  getDetail = async (id) => (await this.privateApi.get(`/infor`)).data;

  update = async (data) => (await this.privateApi.post("/update", data)).data;

  changePassword = async (data) =>
    (await this.privateApi.post("/change-password", data)).data;

  logOut = async () => (await this.privateApi.get("/log_out")).data;
}

export default new Employee();
