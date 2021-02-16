const { pick } = require("lodash");

const filterWhitelistedAttributesFor = (allowedFields) => (req, res, next) => {
	req.body = pick(req.body, allowedFields);
	next();
};

const requireLoggedInUser = (req, res, next) => {
	if (req.user) {
		next();
	} else {
		res.sendStatus(401);
	}
};

const allowAnonymousUser = (req, res, next) => next();

const requireLoggedInAdmin = (req, res, next) => {
	requireLoggedInUser(req, res, () => {
		if (req.user.admin) {
			next();
		} else {
			res.sendStatus(403);
		}
	});
};

const requireExistingRecord = (recordType) => async (req, res, next) => {
	const record = await req.app.getSavedRecord(
		recordType,
		req.params[recordType]
	);

	if (record) {
		req.requestedRecord = record;
		next();
	} else {
		res.sendStatus(404);
	}
};

const confirmValidDataSentFor = (recordType, validateRecord) => async (
	req,
	res,
	next
) => {
	if (await validateRecord(req.body, req.app, req.params[recordType])) {
		next();
	} else {
		res.sendStatus(400);
	}
};

module.exports = {
	requireLoggedInUser,
	requireLoggedInAdmin,
	requireExistingRecord,
	confirmValidDataSentFor,
	allowAnonymousUser,
	filterWhitelistedAttributesFor,
};
