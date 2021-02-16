const uuidv4 = require("uuid").v4;
const { pick } = require("lodash");

module.exports = (app, knex) => {
	app.set("knex", knex);

	const persistenceMethods = {
		async saveRecord(recordType, req, recordTypeParticulars) {
			let recordExtras = {};
			if (recordTypeParticulars.createRecordExtras) {
				recordExtras = await recordTypeParticulars.createRecordExtras(
					req
				);
			}

			const dataToInsert = {
				...req.body,
				...recordExtras,
				id: uuidv4(),
			};

			await this.get("knex")(recordType).insert(dataToInsert);

			return dataToInsert;
		},
		async updateRecord(
			recordType,
			data,
			userSettableFields,
			record
		) {
			const dataToUpdate = {
				...data,
			};

			await this.get("knex")(recordType)
				.update(dataToUpdate)
				.where("id", "=", record.id);

			return dataToUpdate;
		},
		deleteRecord(recordType, record) {
			return this.get("knex")(recordType)
				.where("id", record.id)
				.delete();
		},
		getAllRecords(recordType) {
			return this.get("knex").select().from(recordType);
		},
		async getSavedRecord(recordType, id) {
			const records = await this.get("knex")
				.select()
				.from(recordType)
				.where({ id });

			return records[0];
		},
	};

	Object.assign(app, persistenceMethods);
};
