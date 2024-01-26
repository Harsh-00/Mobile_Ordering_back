const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	role: {
		type: String,
		required: true,
		enum: ["Admin", "Seller", "Customer"],
		trim: true,
	},
	firstName: {
		type: String,
		required: true,
		trim: true,
	},
	lastName: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		required: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
		trim: true,
	},
	mobileNo: {
		type: Number,
		trim: true,
	},
});

const User = mongoose.model("User", userSchema);
module.exports = User;
