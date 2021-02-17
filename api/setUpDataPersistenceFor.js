const uuidv4 = require("uuid").v4;
const { pick, capitalize } = require("lodash");

module.exports = (app, db) => {
	app.set("db", db);

	const persistenceMethods = {
		getModel(recordTypeName) {
			return this.get("db")[capitalize(recordTypeName)];
		},
		async saveRecord(recordTypeName, data) {
			return await this.getModel(recordTypeName).create(data);
		},
		async updateRecord(record, data) {
			Object.keys(data).forEach((fieldName) => {
				record[fieldName] = data[fieldName];
			});

			return await record.save();
		},
		async deleteRecord(record) {
			return await record.destroy();
		},
		async getAllRecords(recordTypeName) {
			return await this.getModel(recordTypeName).findAll();
		},
		async getSavedRecord(recordTypeName, id) {
			return await this.getModel(recordTypeName).findByPk(id);
		},
	};

	Object.assign(app, persistenceMethods);
};
