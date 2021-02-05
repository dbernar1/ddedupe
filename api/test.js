const request = require("supertest");
const uuidv4 = require("uuid").v4;
const moment = require("moment");

function describeEndpoint(
	httpMethod,
	pathPattern,
	endpointBehaviorDescription
) {
	describe(`${httpMethod} ${pathPattern}`, function () {
		before(function () {
			this.httpMethod = httpMethod;
			this.pathPattern = pathPattern;
		});

		endpointBehaviorDescription();
	});
}

function itShouldRequireLoggedInAdmin() {
	itShouldRequireLoggedInUser();

	context("When the logged in user is not an admin", function () {
		before(async function () {
			await this.logIn();
			await this.performRequest();
		});

		itShouldRespondWith(403);
	});
}

function itShouldValidate(recordType, rules) {
	describe("Validation rules", function () {
		for (const [fieldName, rulesForField] of Object.entries(
			rules
		)) {
			describe(fieldName, function () {
				rulesForField.forEach((ruleName) => {
					it(`should be ${ruleName}`, async function () {
						let record;

						if (
							ruleName.includes(
								"reference existing"
							)
						) {
							ruleName =
								"reference existing";
						}

						switch (ruleName) {
							case "required":
								record = await this.getValidRecord(
									recordType
								);
								delete record[
									fieldName
								];
								await this.performRequest(
									record
								);
								expect(
									this.res
										.status
								).to.equal(400);
								break;
							case "reference existing":
								record = await this.getValidRecord(
									recordType
								);
								record[
									fieldName
								] = uuidv4();
								await this.performRequest(
									record
								);
								expect(
									this.res
										.status
								).to.equal(400);
								break;
							case "format:date":
								record = await this.getValidRecord(
									recordType
								);
								record[
									fieldName
								] =
									"Not-a-date";
								await this.performRequest(
									record
								);
								expect(
									this.res
										.status
								).to.equal(400);
								break;
							case "format:email":
								record = await this.getValidRecord(
									recordType
								);
								record[
									fieldName
								] =
									"not-an-email-address";
								await this.performRequest(
									record
								);
								expect(
									this.res
										.status
								).to.equal(400);
								break;
							case "unique":
								record = await this.getValidRecord(
									recordType
								);
								await this.performRequest(
									record
								);
								const secondRecord = await this.getValidRecord(
									recordType
								);
								await this.performRequest(
									{
										...secondRecord,
										[fieldName]:
											record[
												fieldName
											],
									}
								);

								expect(
									this.res
										.status
								).to.equal(400);
								break;
							case "meets-password-requirements":
								await Promise.all(
									[
										"testTest", // missing a digit
										"testtest1", // missing an upper-case letter
										"TESTTEST1", // missing a lower-case letter
										"Test1", // too short
									].map(
										async (
											invalidPassword
										) => {
											record = await this.getValidRecord(
												recordType
											);
											record[
												fieldName
											] = invalidPassword;
											await this.performRequest(
												record
											);
											expect(
												this
													.res
													.status
											).to.equal(
												400
											);
										}
									)
								);
								break;
							case "not in the future":
								record = await this.getValidRecord(
									recordType
								);
								record[
									fieldName
								] = moment()
									.add(
										2,
										"days"
									)
									.format(
										"YYYY-MM-DD"
									);
								await this.performRequest(
									record
								);
								expect(
									this.res
										.status
								).to.equal(400);
								break;
							default:
								expect(false).to
									.be
									.true;
								break;
						}
					});
				});
			});
		}
	});
}

function itShouldSaveRecord(expectedRecord) {
	describe("Saved record", function () {
		for (const [fieldName, expectedValue] of Object.entries(
			expectedRecord
		)) {
			it(`should include ${fieldName}`, function () {
				if ("function" === typeof expectedValue) {
					expect(
						expectedValue.call(
							this,
							this.savedRecord[
								fieldName
							]
						)
					).to.be.true;
				} else {
					expect(
						this.savedRecord[fieldName]
					).to.equal(expectedValue);
				}
			});
		}
	});
}

function itShouldHaveTheFollowingData(expectedData) {
	for (let [fieldName, expectedValue] of Object.entries(expectedData)) {
		it(`should include ${fieldName}`, function () {
			if ("function" === typeof expectedValue) {
				expectedValue = expectedValue.call(this);
			}

			expect(this.subject[fieldName]).to.equal(expectedValue);
		});
	}
}

function itShouldRespondWith(statusCode, expectedResponse) {
	it(`should respond with ${statusCode}`, function () {
		expect(this.res.status).to.equal(statusCode);
	});

	if (expectedResponse) {
		describe("Response data", function () {
			for (const [fieldName, expectedValue] of Object.entries(
				expectedResponse
			)) {
				it(`should include ${fieldName}`, function () {
					if (
						"function" ===
						typeof expectedValue
					) {
						expect(
							expectedValue.call(
								this,
								this.res.body[
									fieldName
								]
							)
						).to.be.true;
					} else {
						expect(
							this.res.body[fieldName]
						).to.equal(expectedValue);
					}
				});
			}
		});
	}
}

function itShouldRequireLoggedInUser() {
	context("When the user is not logged in", function () {
		before(async function () {
			await this.performRequest();
		});

		itShouldRespondWith(401);
	});
}

function itShouldContainRecords(
	expectedRecords,
	getActualRecords = function () {
		return this.res.body;
	}
) {
	it("should contain the expected records", function () {
		expect(expectedRecords.length).to.equal(
			getActualRecords.call(this).length
		);
	});

	describe("Each returned record", function () {
		for (const fieldName in expectedRecords[0]) {
			it(`should include ${fieldName}`, function () {
				for (
					let i = 0;
					i < expectedRecords.length;
					i++
				) {
					expect(
						getActualRecords.call(this)[i][
							fieldName
						]
					).to.equal(
						"function" ===
							typeof expectedRecords[
								i
							][fieldName]
							? expectedRecords[i][
									fieldName
							  ].call(this)
							: expectedRecords[i][
									fieldName
							  ]
					);
				}
			});
		}
	});
}

function itShouldRequireExistingRecord(recordType) {
	context(`When no ${recordType} id is provided`, function () {
		before(async function () {
			await this.performRequest(
				await this.getValidRecord(recordType),
				[[`:${recordType}`, ""]]
			);
		});

		itShouldRespondWith(404);
	});

	context(
		`When a non-existent ${recordType} id is provided`,
		function () {
			before(async function () {
				await this.performRequest(
					await this.getValidRecord(recordType),
					[[`:${recordType}`, uuidv4()]]
				);
			});

			itShouldRespondWith(404);
		}
	);
}

function itShouldUpdateExistingRecord(recordType, expectedValues) {
	describe("Updated record", function () {
		before(async function () {
			this.savedRecord = await this.getSavedRecord(
				recordType,
				this.res.body.id
			);
		});

		for (const [fieldName, expectedValue] of Object.entries(
			expectedValues
		)) {
			it(`should have the new ${fieldName}`, function () {
				if ("function" === typeof expectedValue) {
					expect(
						expectedValue.call(
							this,
							this.savedRecord[
								fieldName
							]
						)
					).to.be.true;
				} else {
					expect(
						this.savedRecord[fieldName]
					).to.equal(expectedValue);
				}
			});
		}
	});
}

const itShouldDeleteExistingRecord = () => {};

function itShouldExcludeDatabaseFields(namesOfFieldsToConfirmAreNotPresent) {
	describe("Each returned record", function () {
		namesOfFieldsToConfirmAreNotPresent.forEach((fieldName) => {
			it(`should not include ${fieldName}`, function () {
				this.res.body.forEach((returnedRecord) => {
					expect(fieldName in returnedRecord).to
						.be.false;
				});
			});
		});
	});
}

const composePath = (pathPattern, pathParams) => {
	let path = pathPattern;

	pathParams.forEach(
		([placeHolder, value]) =>
			(path = path.replace(placeHolder, value))
	);

	return path;
};
function performRequest(requestBody, pathParams) {
	const path = pathParams
		? composePath(this.pathPattern, pathParams)
		: this.pathPattern;

	return request(this.app)
		[this.httpMethod.toLowerCase()](path)
		.set("Authorization", `Bearer ${this.token}`)
		.send(requestBody)
		.then((res) => (this.res = res));
}

module.exports = {
	describeEndpoint,
	itShouldRequireLoggedInAdmin,
	itShouldValidate,
	itShouldSaveRecord,
	itShouldRespondWith,
	itShouldRequireLoggedInUser,
	itShouldContainRecords,
	itShouldRequireExistingRecord,
	itShouldUpdateExistingRecord,
	itShouldDeleteExistingRecord,
	itShouldExcludeDatabaseFields,
	itShouldHaveTheFollowingData,
	requestMethods: {
		performRequest,
	},
};
