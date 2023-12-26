const mongoose = require("mongoose");
require("dotenv").config();

const dbConnect = () => {
	mongoose
		.connect(process.env.DB_URL)
		.then(() => {
			console.log("DB connection Successfull");
		})
		.catch((e) => {
			console.log("Connection Failed", e);
			process.exit(1);
		});
};

module.exports = dbConnect;
