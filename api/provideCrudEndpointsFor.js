const {
	requireLoggedInUser,
	requireLoggedInAdmin,
	requireExistingRecord,
	confirmValidDataSentFor,
	allowAnonymousUser,
} = require( './middleware' );

module.exports = function( recordType, recordTypeDefinition ) {
	const listAndCreatePath = `/${ recordType }`;
	const updateAndDeletePath = `/${ recordType }/:${ recordType }`;

	const defaultsForAnyRecordType = {
		toJSON( record ) {
			return record;
		},
		endpointsIncluded: [ 'create', 'list', 'update', 'delete', ],
	};

	recordTypeDefinition = {
		...defaultsForAnyRecordType,
		...recordTypeDefinition,
	};

	if ( recordTypeDefinition.endpointsIncluded.includes( 'create' ) ) {
		this.post(
			listAndCreatePath,
			'admin' === recordTypeDefinition.createRequirement ? requireLoggedInAdmin
				: 'none' === recordTypeDefinition.createRequirement ? allowAnonymousUser
				: requireLoggedInUser,
			confirmValidDataSentFor( recordType, recordTypeDefinition.validate ),
			( req, res, next ) => {
				req.app.saveRecord(
					recordType,
					req,
					recordTypeDefinition
				)
				.then( savedRecord => {
					res.send( recordTypeDefinition.toJSON( savedRecord ) );
				} )
				.catch( next );
			}
		);
	}

	if ( recordTypeDefinition.endpointsIncluded.includes( 'list' ) ) {
		this.get(
			listAndCreatePath,
			'admin' === recordTypeDefinition.listRequirement
				? requireLoggedInAdmin
				: requireLoggedInUser,
			( req, res, next ) => {
				( 'getAll' in recordTypeDefinition
					? recordTypeDefinition.getAll( req.app )
					: req.app.getAllRecords( recordType )
				)
				.then( records => res.send( records.map( recordTypeDefinition.toJSON ) ) )
				.catch( next );
			}
		);
	}

	if ( recordTypeDefinition.endpointsIncluded.includes( 'update' ) ) {
		this.put(
			updateAndDeletePath,
			requireLoggedInAdmin,
			confirmValidDataSentFor(
				recordType,
				recordTypeDefinition.validateUpdate || recordTypeDefinition.validate
			),
			requireExistingRecord( recordType ),
			( req, res, next ) => {
				req.app.updateRecord(
					recordType,
					req.body,
					recordTypeDefinition.userUpdatableFields || recordTypeDefinition.userSettableFields,
					req[ recordType ]
				)
				.then( updatedRecord => {
					res.send( recordTypeDefinition.toJSON( {
						...req[ recordType ],
						...updatedRecord,
					} ) );
				} )
				.catch( next );
			}
		);
	}

	if ( recordTypeDefinition.endpointsIncluded.includes( 'delete' ) ) {
		this.delete(
			updateAndDeletePath,
			requireLoggedInAdmin,
			requireExistingRecord( recordType ),
			( req, res, next ) => {
				req.app.deleteRecord( recordType, req[ recordType ] )
				.then( () => {
					res.sendStatus( 204 );
				} )
				.catch( next );
			}
		);
	}
};
