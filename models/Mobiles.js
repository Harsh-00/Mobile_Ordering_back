const mongoose = require("mongoose");

const mobileSchema = new mongoose.Schema({
	key: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	brand: {
		type: String,
		required: true,
		trim: true,
	},
	mobName: {
		type: String,
		required: true,
		trim: true,
	},
	mobImg: {
		type: String,
		required: true,
		trim: true,
	},
	display: {
		type: Number,
		trim: true,
		default: 6.7,
	},
	ram: {
		type: Number,
		trim: true,
		default: 8,
	},
	camera: {
		type: Number,
		trim: true,
		default: 12,
	},
	battery: {
		type: Number,
		trim: true,
		default: 4000,
	},
	relasingDate: {
		type: String,
		// required: true,
		default: new Date(Date.now()).toDateString(),
	},
	storage: {
		type: String,
		trim: true,
		default: "128GB/256GB storage, microSDXC",
	},
	price: {
		type: Number,
		trim: true,
		required: true,
	},
	chipset: {
		type: String,
		default: "Apple A15 Bionic",
	},
	batteryType: {
		type: String,
		default: "Li-Ion",
	},
	osType: {
		type: String,
		default: "iOS 15, up to iOS 17.2",
	},
	body: {
		type: String,
		default: "240g, 7.7mm thickness",
	},
	video: {
		type: String,
		default: "2160p",
	},
	displayRes: {
		type: String,
		default: "1284x2778 pixels",
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
