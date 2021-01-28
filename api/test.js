const request = require( 'supertest' );

function describeEndpoint( httpMethod, pathPattern, endpointBehaviorDescription ) {
	describe( `${ httpMethod } ${ pathPattern}`, function() {
		before( function() {
			this.httpMethod = httpMethod;
			this.pathPattern = pathPattern;
		} );

		endpointBehaviorDescription();
	} );
}

function itShouldRequireLoggedInAdmin() {
	itShouldRequireLoggedInUser();

	context( 'When the logged in user is not an admin', function() {
		before( async function() {
			await this.logIn();
			await this.performRequest();
		} );

		itShouldRespondWith( 403 );
	} );
}

function itShouldValidate( recordType, rules ) {
	describe( 'Validation rules', function() {
		for ( const [ fieldName, rulesForField ] of Object.entries( rules ) ) {
			describe( fieldName, function() {
				rulesForField.forEach( ruleName => {
					it( `should be ${ ruleName }`, async function() {
						switch( ruleName ) {
							case 'required':
								const record = this.getValidRecord( recordType );
								delete record[ fieldName ];
								await this.performRequest( record );
								expect( this.res.status ).to.equal( 400 );
							break;
						}
					} );
				} );
			} );
		}
	} );
}

function itShouldSaveRecord( expectedRecord ) {
	describe( 'Saved record', function() {
		for ( const [ fieldName, expectedValue ] of Object.entries( expectedRecord ) ) {
			it( `should include ${ fieldName }`, function() {
				if ( 'function' === typeof expectedValue ) {
					expect( expectedValue.call( this, this.savedRecord[ fieldName ] ) ).to.be.true;
				} else {
					expect( this.savedRecord[ fieldName ] ).to.equal( expectedValue );
				}
			} );
		}
	} );
}

function itShouldRespondWith( statusCode, expectedResponse ) {
	it( `should respond with ${ statusCode }`, function() {
		expect( this.res.status ).to.equal( statusCode );
	} );

	if ( expectedResponse ) {
		describe( 'Response data', function() {
			for ( const [ fieldName, expectedValue ] of Object.entries( expectedResponse ) ) {
				it( `should include ${ fieldName }`, function() {
					if ( 'function' === typeof expectedValue ) {
						expect( expectedValue.call( this, this.savedRecord[ fieldName ] ) ).to.be.true;
					} else {
						expect( this.res.body[ fieldName ] ).to.equal( expectedValue );
					}
				} );
			}
		} );
	}
}

function itShouldRequireLoggedInUser() {
	context( 'When the user is not logged in', function() {
		before( async function() {
			await this.performRequest();
		} );

		itShouldRespondWith( 401 );
	} );
}

const itShouldContainRecordsWith = () => {};
const itShouldRequireExistingRecord = () => {};
const itShouldUpdateExistingRecord = () => {};
const itShouldDeleteExistingRecord = () => {};

function itShouldExcludeDatabaseFields( namesOfFieldsToConfirmAreNotPresent ) {
}

function performRequest( requestBody ) {
	return request( this.app )
	[ this.httpMethod.toLowerCase() ]( this.pathPattern )
	.set( 'Authorization', `Bearer ${ this.token }` )
	.send( requestBody )
	.then( res => this.res = res );
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
	requestMethods: {
		performRequest,
	},
};
