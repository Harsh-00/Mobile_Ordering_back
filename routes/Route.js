const express = require("express");
const router = express.Router();
const Mobile = require("../models/Mobiles");
const User = require("../models/User");
const Imgdata = require("./data.js");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { authentication, isNotCustomer } = require("../middleware/auth.js");

//Register
router.post("/register", async (req, res) => {
	try {
		const userEntry = req.body;
		console.log(userEntry);

		const pass = await bcrypt.hash(userEntry.password, 10);

		userEntry.password = pass;

		const user = new User(userEntry);
		await user.save();
		res.status(200).json({
			success: true,
			message: "User Added Successfully",
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//Login
router.post("/login", async (req, res) => {
	try {
		console.log(req.body);
		const { email, password } = req.body;
		const verifyUser = await User.findOne({ email });

		console.log(verifyUser);

		if (!verifyUser) {
			return res.status(404).json({
				success: false,
				message: "User Does Not Exist",
			});
		}

		const verifyPass = await bcrypt.compare(password, verifyUser.password);

		if (!verifyPass) {
			return res.status(404).json({
				success: false,
				message: "Password Does Not Match",
			});
		}

		const payload = {
			_id: verifyUser._id,
			email: verifyUser.email,
			role: verifyUser.role,
			firstName: verifyUser.firstName,
			lastName: verifyUser.lastName,
			mobileNo: verifyUser.mobileNo,
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
			expiresIn: "10d",
		});

		//just to be sure (not using anywhere)
		res.cookie("token", token, {
			expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
			httpOnly: true,
		})
			.status(200)
			.json({
				success: true,
				token,
				message: "Login Successfully",
			});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//get all mobiles
router.get("/all", authentication, async (req, res) => {
	try {
		const allMob = await Mobile.find({});
		res.status(200).json({
			success: true,
			info: allMob,
			message: "All Mobiles",
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//post a mobile entry
router.post("/add", authentication, isNotCustomer, async (req, res) => {
	try {
		const data = req.body;
		console.log(data);

		if (data.brand) {
			data.brand =
				data.brand.charAt(0).toUpperCase() +
				data.brand.slice(1).toLowerCase();
		}
		if (!data.key) {
			const key =
				data.mobName.replace(" ", "-").toLowerCase() +
				"-" +
				Math.floor(100000 + Math.random() * 900000); // random 6 digt number
			data.key = key;
		}

		if (data.storage) {
			//just for enhancing the viewing data
			data.storage = data.storage + " storage, microSDXC";
		}
		console.log(data);
		if (!data?.mobImg) {
			const image =
				Imgdata[Math.floor(Math.random() * Imgdata.length)].mobImg;
			data.mobImg = image;
			//randomly take from my data.js file
		}

		console.log(data);
		const mobile = new Mobile(data);
		console.log(mobile);
		await mobile.save();

		res.status(200).json({
			success: true,
			message: "Mobile Added Successfully",
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});
//get filtered mobile
router.get("/filter", async (req, res) => {
	try {
		const brandArray = JSON.parse(req.query.filter);
		const ramArray = JSON.parse(req.query.ramFilter);

		console.log(brandArray);
		console.log(ramArray);

		if (brandArray.length !== 0 && ramArray.length !== 0) {
			var filterMob = await Mobile.find({
				$and: [
					{ brand: { $in: brandArray } },
					{ ram: { $in: ramArray } },
				],
			});
		} else if (brandArray.length !== 0) {
			var filterMob = await Mobile.find({ brand: { $in: brandArray } });
		} else if (ramArray.length !== 0) {
			var filterMob = await Mobile.find({ ram: { $in: ramArray } });
		}

		console.log(filterMob);

		if (!filterMob) {
			res.status(404).json({
				success: false,
				message: "No Mobile Foundvgd",
			});
		} else
			res.status(200).json({
				success: true,
				message: filterMob,
			});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//get a mobile entry
router.get("/:key", async (req, res) => {
	try {
		const key = req.params.key;
		console.log(key);
		const mobFind = await Mobile.findOne({ key });

		if (!mobFind) {
			res.status(404).json({
				success: false,
				message: "Mobile Not Found",
			});
		} else
			res.status(200).json({
				success: true,
				message: mobFind,
			});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//update a mobile entry
router.put("/update/:key", async (req, res) => {
	try {
		const key = req.params.key;
		console.log(key);

		const mobFind = await Mobile.findOne({ key });
		console.log(mobFind);

		if (!mobFind) {
			res.status(404).json({
				success: false,
				message: "Mobile Not Found",
			});
		}

		const mobUpdate = await Mobile.findOneAndUpdate({ key }, req.body, {
			new: true,
		});
		console.log(mobUpdate);

		res.status(200).json({
			success: true,
			message: mobUpdate,
		});
	} catch (e) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//delete a mobile entry
router.delete("/delete/:key", async (req, res) => {
	try {
		const key = req.params.key;
		const delMob = await Mobile.findOneAndDelete({ key });
		console.log(delMob);

		if (!delMob) {
			res.status(404).json({
				success: false,
				message: "Mobile Not Found",
			});
		} else
			res.status(200).json({
				success: true,
				message: "Mobile Deleted Successfully",
			});
	} catch (e) {}
});

module.exports = router;
