const {
	requireLoggedInUser,
	requireLoggedInAdmin,
	requireExistingRecord,
	confirmValidDataSentFor,
	allowAnonymousUser,
	filterWhitelistedAttributesFor,
} = require("./middleware");

module.exports = function (recordTypeName, recordTypeDefinition) {
	const listAndCreatePath = `/${recordTypeName}`;
	const updateAndDeletePath = `/${recordTypeName}/:${recordTypeName}`;

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
			filterWhitelistedAttributesFor(
				recordTypeDefinition.userSettableFields
			),
			confirmValidDataSentFor(
				recordTypeName,
				recordTypeDefinition.validate
			),
			async (req, res, next) => {
				try {
					const savedRecord = await req.app.saveRecord(
						recordTypeName,
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
								recordTypeName
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
			filterWhitelistedAttributesFor(
				recordTypeDefinition.userUpdatableFields ||
					recordTypeDefinition.userSettableFields
			),
			confirmValidDataSentFor(
				recordTypeName,
				recordTypeDefinition.validateUpdate ||
					recordTypeDefinition.validate
			),
			requireExistingRecord(recordTypeName),
			async (req, res, next) => {
				try {
					const updatedRecord = await req.app.updateRecord(
						recordTypeName,
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
			requireExistingRecord(recordTypeName),
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
						recordTypeName,
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
