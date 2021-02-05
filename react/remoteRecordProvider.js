import React from "react";
import { createContext, useContext, useState } from "react";
import axios from "axios";

const createProviderCreator = ({ useAuthHeaders, baseUrl }) => (
	recordType,
	extras = {}
) => {
	const Context = createContext();

	const Provider = ({ children }) => {
		const [records, setRecords] = useState(null);
		const capitalizedRecordType =
			recordType[0].toUpperCase() + recordType.substring(1);
		const authHeaders = useAuthHeaders();

		const value = {
			records,
			setRecords,
			axios,
			authHeaders,
			getUrl(id) {
				return id
					? `${baseUrl}/${recordType}/${id}`
					: `${baseUrl}/${recordType}`;
			},
			[`${recordType}s`]: records,
			[`fetch${capitalizedRecordType}s`]: function () {
				return axios
					.get(value.getUrl(), {
						headers: authHeaders,
					})
					.then(({ data }) => setRecords(data));
			},
			[`delete${capitalizedRecordType}`]: function (id) {
				return axios
					.delete(value.getUrl(id), {
						headers: authHeaders,
					})
					.then(() => {
						if (records) {
							setRecords(
								records.filter(
									(
										record
									) =>
										id !==
										record.id
								)
							);
						}
					});
			},
			[`create${capitalizedRecordType}`]: function (record) {
				return axios
					.post(value.getUrl(), record, {
						headers: authHeaders,
					})
					.then(({ data }) => {
						if (records) {
							setRecords(
								[data].concat(
									records
								)
							);
						}
					});
			},
			[`update${capitalizedRecordType}`]: function (
				id,
				record
			) {
				return axios
					.put(value.getUrl(id), record, {
						headers: authHeaders,
					})
					.then(() => {
						if (records) {
							const recordLocation = records.findIndex(
								(record) =>
									id ===
									record.id
							);

							const newRecords = records.filter(
								(record) =>
									id !==
									record.id
							);

							newRecords.splice(
								recordLocation,
								0,
								{
									...records[recordLocation],
									...record,
									id,
								}
							);

							setRecords(newRecords);
						}
					});
			},
		};

		for (const extraName in extras) {
			value[extraName] = function () {
				return extras[extraName].apply(
					value,
					arguments
				);
			};
		}

		return React.createElement(
			Context.Provider,
			{ value },
			children
		);
	};

	return [() => useContext(Context), Provider];
};

export default createProviderCreator;
