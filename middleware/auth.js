const jwt = require("jsonwebtoken");
require("dotenv").config();

//verifies token passed in header
function authentication(req, res, next) {
	console.log(req.headers);
	const token = req.headers["authorization"]?.replace("Bearer", "")?.trim();
	console.log(token);
	if (!token) {
		return res.status(404).json({
			success: false,
			message: "Token Missing",
		});
	}

	try {
		const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
		console.log("YESSS-> ", decode);
		req.user = decode;
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Invalid Token",
		});
	}
	next();
}

function isSeller(req, res, next) {
	if (req.user.role !== "Seller") {
		return res.status(401).json({
			success: false,
			message: "Unauthorized Access",
		});
	}
	next();
}

function isAdmin(req, res, next) {
	if (req.user.role !== "Admin") {
		return res.status(401).json({
			success: false,
			message: "Unauthorized Access",
		});
	}
	next();
}

function isCustomer(req, res, next) {
	if (req.user.role !== "Customer") {
		return res.status(401).json({
			success: false,
			message: "Unauthorized Access",
		});
	}
	next();
}
function isNotCustomer(req, res, next) {
	if (req.user.role == "Customer") {
		return res.status(401).json({
			success: false,
			message: "Unauthorized Access",
		});
	}
	next();
}

module.exports = {
	authentication,
	isSeller,
	isAdmin,
	isCustomer,
	isNotCustomer,
};
