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
			filterWhitelistedAttributesFor(recordTypeName),
			async (req, res, next) => {
				try {
					const savedRecord = await req.app.saveRecord(
						recordTypeName,
						{
							...req.whitelistedBody,
							...("createRecordExtras" in
							recordTypeDefinition
								? recordTypeDefinition.createRecordExtras(
										req
								  )
								: {}),
						}
					);

					res.send(savedRecord);
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
					const model = this.getModel(
						recordTypeName
					);
					const records = await ("getAll" in model
						? model.getAll()
						: req.app.getAllRecords(
								recordTypeName
						  ));

					res.send(records);
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
			filterWhitelistedAttributesFor(recordTypeName),
			requireExistingRecord(recordTypeName),
			async (req, res, next) => {
				try {
					const updatedRecord = await req.app.updateRecord(
						req.requestedRecord,
						req.whitelistedBody
					);

					res.send(updatedRecord);
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
