const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },  
    products: [
        {
            mobName: String,
            mobImg: String,
            price: Number,
        },
    ],
    totalAmount: Number,
    status: {
        type: String,
        enum: ["Pending", "Completed", "Failed"],
        default: "Pending",
    },
    stripeSessionId: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Orders", orderSchema);