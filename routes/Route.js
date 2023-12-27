const express = require("express");
const router = express.Router();
const Mobile = require("../models/Mobiles");
import "../data";

//get all mobiles
router.get("/all", async (req, res) => {
	{
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
	}
});

//post a mobile entry
router.post("/add", async (req, res) => {
	try {
		console.log(req.body);
		const mobile = new Mobile(req.body);

		if (mobile.brand) {
			mobile.brand = mobile.brand.toLowerCase().charAt(0).toUpperCase();
		}
		if (!mobile.key) {
			const key =
				mobile.mobName.replace(" ", "-").toLowerCase() +
				"-" +
				Math.floor(100000 + Math.random() * 900000); // random 6 digt number
			mobile.key = key;
		}

		if (mobile.storage) {
			//just for enhancing the viewing data
			mobile.storage = mobile.storage + " storage, microSDXC";
		}
		if (!mobile.mobImg) {
			const image = data[Math.floor(Math.random() * data.length)].mobImg;
			mobile.mobImg = image;
			//randomly take from my data.js file
		}

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
