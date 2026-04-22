const { ObjectId } = require("mongodb");

class Employee {
  constructor(client) {
    this.Employee = client.db().collection("Employee");
  }
  //hàm lọc dữ liệu nhân viên
  extractEmployeeData(payload) {
    const employee = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      address: payload.address,
      role: payload.role,
      birthday: payload.birthday,
      url_image: payload.url_image,
      updated_at: new Date(),
    };

    Object.keys(employee).forEach(
      (key) => employee[key] === undefined && delete employee[key],
    );

    return employee;
  }
  //Hàm tạo nhân viên
  async createEmployee(payload) {
    const newEmployee = this.extractEmployeeData(payload);
    newEmployee.block = false;
    newEmployee.created_at = new Date();
    return await this.Employee.insertOne(newEmployee);
  }
  //Hàm cập nhật thông tin nhân viên
  async updateStaff(employee_id, payload) {
    const update = this.extractEmployeeData(payload);
    return await this.Employee.findOneAndUpdate(
      {
        _id: ObjectId.isValid(employee_id) ? new ObjectId(employee_id) : null,
      },
      {
        $set: update,
      },
      {
        returnDocument: "after",
      },
    );
  }
  //Hàm chuyển đổi trạng thái hoạt động của nhân viên
  async statusAccount(employee_id, status) {
    return await this.Employee.findOneAndUpdate(
      { _id: ObjectId.isValid(employee_id) ? new ObjectId(employee_id) : null },
      { $set: { block: status } },
      { returnDocument: "after" },
    );
  }

  //Tìm nhân viên
  async findById(id) {
    return await this.Employee.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  //Tìm nhân viên theo 1 trường nào đó
  async findEmployee(filter) {
    return await this.Employee.findOne(filter);
  }

  //Lấy tất cả nhân viên
  async getListEmployee() {
    return await this.Employee.find({ role: "Nhân viên" }).toArray();
  }

  //Hàm cập nhật pass
  async changePassword(id, hashedPassword) {
    return this.Employee.findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      { $set: { password: hashedPassword } },
      { returnDocument: "after" },
    );
  }

  // đếm số nhân viên
  async countEmployee() {
    return this.Employee.countDocuments();
  }
}

module.exports = Employee;
