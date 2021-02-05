const uuidv4 = require("uuid").v4;
const { pick } = require("lodash");

module.exports = (app, knex) => {
	app.set("knex", knex);

	const persistenceMethods = {
		async saveRecord(recordType, req, recordTypeParticulars) {
			const userSettableData = pick(
				req.body,
				recordTypeParticulars.userSettableFields
			);

			let recordExtras = {};
			if (recordTypeParticulars.createRecordExtras) {
				recordExtras = await recordTypeParticulars.createRecordExtras(
					req
				);
			}

			const dataToInsert = {
				...userSettableData,
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
			const userSettableData = pick(data, userSettableFields);

			const dataToUpdate = {
				...userSettableData,
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
