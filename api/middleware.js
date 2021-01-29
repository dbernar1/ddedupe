const requireLoggedInUser = ( req, res, next ) => {
                if ( req.user ) { 
                        next();
                } else {
                        res.sendStatus( 401 );
                }   
        };  

const requireLoggedInAdmin = ( req, res, next ) => {
	requireLoggedInUser( req, res, () => {
		if ( req.user.admin ) { 
			next();
		} else {
			res.sendStatus( 403 );
		}   
	} );
}; 

const requireExistingRecord = ( recordType ) => ( req, res, next ) => {
	req.app.getSavedRecord( recordType, req.params[ recordType ] )
	.then( record => {
		if ( record ) {
			req[ recordType ] = record;
			next();
		} else {
			res.sendStatus( 404 );
		}
	} );
};

const confirmValidDataSentFor = ( recordType, validateRecord ) => ( req, res, next ) => {
        if ( validateRecord( req.body ) ) { 
                next();
        } else {
                res.sendStatus( 400 );
        }   
};

module.exports = {
	requireLoggedInUser,
	requireLoggedInAdmin,
	requireExistingRecord,
	confirmValidDataSentFor,
};
