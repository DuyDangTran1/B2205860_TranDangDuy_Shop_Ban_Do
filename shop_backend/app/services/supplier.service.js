const { ObjectId, ReturnDocument } = require("mongodb");

class Supplier {
  constructor(client) {
    this.Supplier = client.db().collection("Supplier");
  }

  extractSupplierData(payload) {
    const supplier = {
      supplier_name: payload.supplier_name,
      supplier_phone: payload.supplier_phone,
      supplier_address: payload.supplier_address,
    };

    Object.keys(supplier).forEach(
      (key) => supplier[key] === undefined && delete supplier[key],
    );

    return supplier;
  }

  async create(payload) {
    const supplier = this.extractSupplierData(payload);
    supplier.is_collaborating = true;
    return this.Supplier.insertOne(supplier);
  }

  async update(id, payload) {
    const update = this.extractSupplierData(payload);
    return await this.Supplier.findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      { $set: update },
      { returnDocument: "after" },
    );
  }

  async updateStatusCollaborating(id, status) {
    return await this.Supplier.findOneAndUpdate(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
      { $set: { is_collaborating: status } },
      { returnDocument: "after" },
    );
  }

  async delete(id) {
    return this.Supplier.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }

  async getAllSupplier() {
    return await this.Supplier.find().sort({ _id: -1 }).toArray();
  }

  async findSupplier(id) {
    return await this.Supplier.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }
}

module.exports = Supplier;
