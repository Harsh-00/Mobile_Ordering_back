const express = require("express");
const router = express.Router();
const Mobile = require("../models/Mobiles");
const User = require("../models/User");
const Imgdata = require("./data.js");
const Order = require("../models/Orders");

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    authentication,
    isNotCustomer,
    isAdmin,
} = require("../middleware/auth.js");
const data = require("./data.js");

//Register
router.post("/register", async (req, res) => {
    try {
        const userEntry = req.body;
        // console.log(userEntry);

        const emailCheck = await User.findOne({ email: userEntry.email });

        if (emailCheck) {
            return res.status(400).json({
                success: false,
                message: "Email Already Exists",
            });
        }
        const pass = await bcrypt.hash(userEntry.password, 10);

        userEntry.password = pass;

        const user = new User(userEntry);

        await user.save();

        return res.status(200).json({
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
        // console.log(req.body);
        const { email, password } = req.body;
        const verifyUser = await User.findOne({ email });

        if (!verifyUser) {
            return res.status(401).json({
                success: false,
                message: "User Does Not Exist",
            });
        }

        const verifyPass = await bcrypt.compare(password, verifyUser.password);

        if (!verifyPass) {
            return res.status(401).json({
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
            cart: verifyUser.cart,
            wishlist: verifyUser.wishlist,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "10d",
        });
        verifyUser.password = undefined;

        //sending token to frontend by cookies
        res.cookie("token", token, {
            expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        })
            .status(200)
            .json({
                success: true,
                token,
                verifyUser,
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
router.post("/add", authentication,isNotCustomer, async (req, res) => {
    try {
        const { data } = req.body;
        // console.log(data);

        if (data.brand) {
            data.brand =
                data.brand.charAt(0).toUpperCase() +
                data.brand.slice(1).toLowerCase();
        }
        data.key =
            data.mobName.replaceAll(" ", "-").toLowerCase() +
            "-" +
            Math.floor(100000 + Math.random() * 900000); // random 6 digt number

        if (data.storage) {
            //just for enhancing the viewing data
            data.storage = data.storage + " storage, microSDXC";
        }
        if (!data?.mobImg) {
            const image =
                Imgdata[Math.floor(Math.random() * Imgdata.length)].mobImg;
            data.mobImg = image;
            //randomly take from my data.js file
        }
        const mobile = new Mobile(data);
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

//stripe checkout
router.post("/checkout", async (req, res) => {
    const { products, amount,userId } = req.body;
    // console.log(products);
    let newOrder;

    try {

        newOrder = await Order.create({
            userId, // Associate with the user
            products,
            totalAmount: amount,
            status: 'Pending', // Set initial status to 'Pending'
        });

        //link this order with user
        await User.findByIdAndUpdate(userId, { $push: { orders: newOrder._id } });

        const line_items = products.map((product) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.mobName,
                    images: [product.mobImg],
                },
                unit_amount: Math.round(product.price*100),
            },
            quantity: 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: process.env.FRONT_URL + `/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: process.env.FRONT_URL + `/failed?session_id={CHECKOUT_SESSION_ID}`,
        });

        console.log(session);

        // Update the order with the Stripe session ID
        await Order.findByIdAndUpdate(newOrder._id, { 
            stripeSessionId: session.id, 
        }, { new: true });

        

        console.log(session);
        console.log(session.id);
        res.status(200).json({
            success: true,
            message: session,
            id: session.id,
        });
    } catch (error) {
        console.error('Error creating Stripe session:', error);

        if (newOrder) {
            await Order.findByIdAndUpdate(newOrder?._id, { status: 'Failed' }, { new: true });
        }

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

router.get('/success',async(req,res)=>{
    try{
        const id=req.query.session_id;
        
        const check=await Order.findOneAndUpdate({stripeSessionId:id},{status:"Complete",createdAt:Date.now()},{new:true});
         

    }
    catch(e)
    {

    }
})

router.get('/failed',async(req,res)=>{
    try{
        const id=req.query.session_id;
        
        const check=await Order.findOneAndUpdate({stripeSessionId:id},{status:"Failed",createdAt:Date.now()},{new:true}); 

    }
    catch(e)
    {

    }
})

router.get('/orders/user/:id',async(req,res)=>{
    try{
        const id=req.params.id;
        const order=await User.findOne({_id:id}).populate('orders') ;

        //sort by latest order
        order.orders.sort((a,b)=>b.createdAt-a.createdAt);

        res.status(200).json({
            success:true,
            message:order.orders
        })  
    }
    catch(e)
    {
        res.status(500).json({
            success:false,
            message:e.message
        })

    }
})

router.get('/orders',async(req,res)=>{
    try{
        const orders=await Order.find({}).sort({createdAt:-1});
        res.status(200).json({
            success:true,
            message:orders
        })
    }
    catch(e)
    {
        res.status(500).json({
            success:false,
            message:e.message
        })
    }
})

//get filtered mobile
router.get("/filter", async (req, res) => {
    try {
        const brandArray = JSON.parse(req.query.filter);
        const ramArray = JSON.parse(req.query.ramFilter);

        console.log(brandArray);
        // console.log(ramArray);

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

        // console.log(filterMob);

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

router.get("/filters", async (req, res) => {
    try {
        const brandArray = JSON.parse(req.query.brandFilter);
        const ramArray = JSON.parse(req.query.ramFil);
        const priceArray = JSON.parse(req.query.priceFilter);
        const ratingArray = JSON.parse(req.query.ratingFilter);

        console.log("me");
        console.log(brandArray);
        console.log(ramArray);
        console.log(priceArray);
        console.log(ratingArray);

        let filterr = {};

        if (brandArray.length !== 0) {
            filterr.brand = { $in: brandArray };
        }

        if (ramArray.length !== 0) {
            filterr.ram = { $in: ramArray };
        }

        let priceCriteria = [];
        if (priceArray.length !== 0) {
            priceCriteria = priceArray.map((priceRange) => {
                const [min, max] = priceRange
                    .split(",")
                    .map((price) => parseInt(price, 10));
                return { price: { $gte: min, $lte: max } };
            });
        }

        let ratingCriteria = [];
        if (ratingArray.length !== 0) {
            ratingCriteria = ratingArray.map((rating) => {
                const parsedRating = parseFloat(rating);
                return {
                    rating: { $gte: parsedRating, $lt: parsedRating + 1 },
                };
            });
        }

        // Combine Price and Rating Criteria
        if (priceCriteria.length !== 0 && ratingCriteria.length !== 0) {
            filterr.$and = [{ $or: priceCriteria }, { $or: ratingCriteria }];
        } else if (priceCriteria.length !== 0) {
            filterr.$or = priceCriteria;
        } else if (ratingCriteria.length !== 0) {
            filterr.$or = ratingCriteria;
        }

        const filterMob = await Mobile.find(filterr);

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
//get wishlist of a user
router.get("/wishlist", authentication, async (req, res) => {
    const userInfo = await User.findOne({ _id: req.user._id }).populate(
        "wishlist"
    );

    const list = userInfo.wishlist;

    res.status(200).json({
        success: true,
        message: "Wishlist",
        list,
    });
});

//set wishlist of a user (add or remove)
router.get("/wishlist/:key", authentication, async (req, res) => {
    try {
        const key = req.params.key;
        const user = await User.findOne({ _id: req.user._id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found",
            });
        }

        const entry = await Mobile.findOne({ key });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Mobile Not Found",
            });
        }

        if (user.wishlist.includes(entry._id)) {
            user.wishlist.pull(entry._id);
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Removed from wishlist",
            });
        }

        user.wishlist.push(entry._id);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Added to wishlist",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

//get cart of a user
router.get("/cart", authentication, async (req, res) => {
    const userInfo = await User.findOne({ _id: req.user._id }).populate("cart");

    const list = userInfo.cart;

    res.status(200).json({
        success: true,
        message: "Cart",
        list,
    });
});

//set cart of a user (add or remove)
router.get("/cart/:key", authentication, async (req, res) => {
    try {
        const key = req.params.key;
        const userEntry = await User.findOne({ _id: req.user._id });

        if (!userEntry) {
            return res.status(404).json({
                success: false,
                message: "User Not Found",
            });
        }

        const entry = await Mobile.findOne({ key });
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Mobile Not Found",
            });
        }

        if (userEntry.cart.includes(entry._id)) {
            userEntry.cart.pull(entry._id);
            await userEntry.save();

            return res.status(200).json({
                success: true,
                message: "Removed from cart",
            });
        }

        userEntry.cart.push(entry._id);
        await userEntry.save();

        res.status(200).json({
            success: true,
            message: "Added to cart",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

//get a mobile entry
router.get("/:key", async (req, res) => {
    try {
        const key = req.params.key;
        // console.log(key);
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
        // console.log(key);

        const mobFind = await Mobile.findOne({ key });
        // console.log(mobFind);

        if (!mobFind) {
            res.status(404).json({
                success: false,
                message: "Mobile Not Found",
            });
        }

        const mobUpdate = await Mobile.findOneAndUpdate({ key }, req.body, {
            new: true,
        });
        // console.log(mobUpdate);

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
router.delete(
    "/delete/:key",
    authentication,
    isAdmin,
    async (req, res) => {
        try {
            const key = req.params.key;
            const delMob = await Mobile.findOneAndDelete({ key });
            // console.log(delMob);

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
    }
);

module.exports = router;
