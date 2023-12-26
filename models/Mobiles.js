const mongoose = require("mongoose");

const mobileSchema = new mongoose.Schema({
	key: {
		type: String,
		required: true,
		unique: true,
		trime: true,
	},
	brand: {
		type: String,
		required: true,
		trime: true,
	},
	mobName: {
		type: String,
		required: true,
		trime: true,
	},
	mobImg: {
		type: String,
		required: true,
		trime: true,
	},
	display: {
		type: Number,
		trime: true,
	},
	ram: {
		type: Number,
		trime: true,
	},
	camera: {
		type: Number,
		trime: true,
	},
	battery: {
		type: Number,
		trime: true,
	},
	relasingDate: {
		type: String,
		required: true,
		default: Date.now(),
	},
	storage: {
		type: String,
		trime: true,
	},
	price: {
		type: Number,
		trime: true,
	},
	chipset: {
		type: String,
	},
	batteryType: {
		type: String,
	},
	osType: {
		type: String,
	},
	body: {
		type: String,
	},
	video: {
		type: String,
	},
	displayRes: {
		type: String,
	},
});

//      brand: "Apple",
// 		key: "apple_iphone_13_pro_max-11089",
// 		device_name: "Apple iPhone 13 Pro Max",
// 		device_image:
// 			"https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro-max.jpg",
// 		display_size: '6.7"',
// 		display_res: "1284x2778 pixels",
// 		camera: "12MP",
// 		video: "2160p",
// 		ram: "6GB RAM",
// 		chipset: "Apple A15 Bionic",
// 		battery: "4352mAh",
// 		batteryType: "Li-Ion",
// 		release_date: "Released 2021, September 24",
// 		body: "240g, 7.7mm thickness",
// 		os_type: "iOS 15, up to iOS 17.2",
// 		storage: "128GB/256GB/1TB storage, no card slot",

module.exports = mongoose.model("Mobiles", mobileSchema);
