const {
	requireLoggedInUser,
	requireLoggedInAdmin,
	requireExistingRecord,
	confirmValidDataSentFor,
	allowAnonymousUser,
} = require("./middleware");

module.exports = function (recordType, recordTypeDefinition) {
	const listAndCreatePath = `/${recordType}`;
	const updateAndDeletePath = `/${recordType}/:${recordType}`;

	const defaultsForAnyRecordType = {
		toJSON(record) {
			return record;
		},
		endpointsIncluded: ["create", "list", "update", "delete"],
	};

	recordTypeDefinition = {
		...defaultsForAnyRecordType,
		...recordTypeDefinition,
	};

	if (recordTypeDefinition.endpointsIncluded.includes("create")) {
		this.post(
			listAndCreatePath,
			"admin" === recordTypeDefinition.createRequirement
				? requireLoggedInAdmin
				: "none" ===
				  recordTypeDefinition.createRequirement
				? allowAnonymousUser
				: requireLoggedInUser,
			confirmValidDataSentFor(
				recordType,
				recordTypeDefinition.validate
			),
			async (req, res, next) => {
				try {
					const savedRecord = await req.app.saveRecord(
						recordType,
						req,
						recordTypeDefinition
					);

					res.send(
						recordTypeDefinition.toJSON(
							savedRecord
						)
					);
				} catch (error) {
					next(error);
				}
			}
		);
	}

	if (recordTypeDefinition.endpointsIncluded.includes("list")) {
		this.get(
			listAndCreatePath,
			"admin" === recordTypeDefinition.listRequirement
				? requireLoggedInAdmin
				: requireLoggedInUser,
			async (req, res, next) => {
				try {
					const records = await ("getAll" in
					recordTypeDefinition
						? recordTypeDefinition.getAll(
								req.app
						  )
						: req.app.getAllRecords(
								recordType
						  ));

					res.send(
						records.map(
							recordTypeDefinition.toJSON
						)
					);
				} catch (error) {
					next(error);
				}
			}
		);
	}

	if (recordTypeDefinition.endpointsIncluded.includes("update")) {
		this.put(
			updateAndDeletePath,
			requireLoggedInAdmin,
			confirmValidDataSentFor(
				recordType,
				recordTypeDefinition.validateUpdate ||
					recordTypeDefinition.validate
			),
			requireExistingRecord(recordType),
			async (req, res, next) => {
				try {
					const updatedRecord = await req.app.updateRecord(
						recordType,
						req.body,
						recordTypeDefinition.userUpdatableFields ||
							recordTypeDefinition.userSettableFields,
						req.requestedRecord
					);

					res.send(
						recordTypeDefinition.toJSON({
							...req.requestedRecord,
							...updatedRecord,
						})
					);
				} catch (error) {
					next(error);
				}
			}
		);
	}

	if (recordTypeDefinition.endpointsIncluded.includes("delete")) {
		this.delete(
			updateAndDeletePath,
			requireLoggedInAdmin,
			requireExistingRecord(recordType),
			async (req, res, next) => {
				if (
					"validateDeletion" in
						recordTypeDefinition &&
					!recordTypeDefinition.validateDeletion(
						req
					)
				) {
					return res.sendStatus(400);
				}

				try {
					await req.app.deleteRecord(
						recordType,
						req.requestedRecord
					);

					res.sendStatus(204);
				} catch (error) {
					next(error);
				}
			}
		);
	}
};
