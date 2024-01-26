const jwt = require("jsonwebtoken");
require("dotenv").config();

async function authentication(req, res, next) {
	const token = req.header["Authorization"].replace("Bearer", "");
	if (!token) {
		return res.status(404).json({
			success: false,
			message: "Token Missing",
		});
	}

	//verifying token
	jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decode) => {
		if (err) {
			return res.status(401).json({
				success: false,
				message: "Invalid Token",
			});
		}

		console.log(decode);
		req.user = decode;
	});

	next();
}

module.exports = authentication;
