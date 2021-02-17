const passport = require("passport");
const AnonymousStrategy = require("passport-anonymous");

module.exports = (appConfig) => {
	const app = require("express")();
	app.use(require("body-parser").json());
	app.use(require("cors")());

	require("./setUpDataPersistenceFor")(app, appConfig.db);

	app.providesCrudEndpointsFor = require("./provideCrudEndpointsFor");

	const authenticationStrategies = appConfig.configureAuthentication(
		app,
		passport
	);

	passport.use(new AnonymousStrategy());

	app.use(passport.initialize());
	app.use(
		passport.authenticate(
			authenticationStrategies.concat(["anonymous"]),
			{ session: false }
		)
	);

	return app;
};
