function describeEndpoint( httpMethod, pathPattern, endpointBehaviorDescription ) {
	this.httpMethod = httpMethod;
	this.pathPattern = pathPattern;

	describe( `${ httpMethod } ${ pathPattern}`, endpointBehaviorDescription );
}

const itShouldRequireLoggedInAdmin = () => {};
const itShouldValidate = () => {};
const itShouldSaveRecord = () => {};
const itShouldRespondWith = () => {};
const itShouldRequireLoggedInUser = () => {};
const itShouldContainRecordsWith = () => {};
const itShouldRequireExistingRecord = () => {};
const itShouldUpdateExistingRecord = () => {};
const itShouldDeleteExistingRecord = () => {};

function itShouldExcludeDatabaseFields( namesOfFieldsToConfirmAreNotPresent ) {
}

module.exports = {
	describeEndpoint,
        itShouldRequireLoggedInAdmin,
        itShouldValidate,
        itShouldSaveRecord,
        itShouldRespondWith,
        itShouldRequireLoggedInUser,
        itShouldContainRecordsWith,
        itShouldRequireExistingRecord,
        itShouldUpdateExistingRecord,
        itShouldDeleteExistingRecord,
	itShouldExcludeDatabaseFields,
};
