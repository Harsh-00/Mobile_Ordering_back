const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for urlencoded data like form data

const Route = require("./routes/Route");
app.use("/mobiles", Route);

app.use("/", (req, res) => {
	return res.send("Hello World");
});
app.listen(process.env.PORT, () => {
	console.log("Server Started Successfully on", process.env.PORT);
});

const dbConnect = require("./database/db");
dbConnect();
