import React from "react";
import { createContext, useContext, useState } from "react";
import { Route, Redirect } from "react-router-dom";
import axios from "axios";

const createAuth = ({
	signInPath,
	loginUrl,
	logoutUrl,
	retrieveUserData,
	persistUserData,
	removeUserData,
	getAuthHeaders,
}) => {
	const authContext = createContext();
	const useAuth = () => useContext(authContext);

	const AdminRoute = ({ children, ...rest }) => {
		const auth = useAuth();

		return React.createElement(Route, {
			...rest,
			render({ location }) {
				if (auth.user && auth.user.admin) {
					return children;
				} else if (auth.user) {
					return React.createElement(
						"p",
						null,
						`You must be an admin to access ${location.pathname}`
					);
				} else {
					return React.createElement(Redirect, {
						to: {
							pathname: signInPath,
							state: {
								from: location,
							},
						},
					});
				}
			},
		});
	};

	const PrivateRoute = ({ children, ...rest }) => {
		const auth = useAuth();

		return React.createElement(Route, {
			...rest,
			render({ location }) {
				if (auth.user) {
					return children;
				} else {
					return React.createElement(Redirect, {
						to: {
							pathname: signInPath,
							state: {
								from: location,
							},
						},
					});
				}
			},
		});
	};

	const useProvideAuth = () => {
		const [user, setUser] = useState(retrieveUserData());

		return {
			user,
			async signIn(email, password) {
				const { data } = axios.post(loginUrl, {
					email,
					password,
				});
				setUser(data);
				persistUserData(data);
			},
			getAuthHeaders,
			async signOut() {
				try {
					await axios.post(
						logoutUrl,
						{},
						{
							headers: getAuthHeaders(),
						}
					);
				} catch (error) {
					throw error;
				} finally {
					setUser(null);
					removeUserData();
				}
			},
		};
	};

	const ProvideAuth = ({ children }) => {
		const auth = useProvideAuth();

		return React.createElement(
			authContext.Provider,
			{ value: auth },
			children
		);
	};

	return [useAuth, AdminRoute, PrivateRoute, ProvideAuth];
};

export default createAuth;
