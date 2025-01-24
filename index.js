const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const path=require('path');
const port=process.env.PORT || 5000;


// app.use(cors());
app.use(cors({
	origin: process.env.FRONT_URL,
	methods: ['GET', 'POST', 'PUT', 'DELETE'], 
	credentials: true,
  }));
  

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for urlencoded data like form data

const Route = require("./routes/Route");
app.use("/v1", Route);

app.use("/", (req, res) => {
	return res.send("Welcome to Backend Server of Book My Phone");
});

app.use((req, res, next) => {
	res.status(404).send("Route not found");
  });


app.listen(port, () => {
	console.log("Server Started Successfully on", port);
});

const dbConnect = require("./database/db");
dbConnect();
