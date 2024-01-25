const express = require("express");
const router = express.Router();
const Mobile = require("../models/Mobiles");
const User = require("../models/User");
const Imgdata = require("./data.js");

//Login
router.post("/login", async (req, res) => {
	try {
		console.log(req.body);
		res.status(200).json({
			success: true,
			message: "Login Successfully",
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: e.message,
		});
	}
});

//get all mobiles
router.get("/all", async (req, res) => {
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
router.post("/add", async (req, res) => {
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

		// for (let i = 0; i < filterArray.length; i++) {
		// 	brandArray?.push(filterArray[i]?.brand);
		// 	ramArray?.push(filterArray[i]?.ram);
		// }

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
