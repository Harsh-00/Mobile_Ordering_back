const express = require("express");
const router = express.Router();
const Mobile = require("../models/Mobiles");
const User = require("../models/User");
const Imgdata = require("./data.js");
const Order = require("../models/Orders");
const rateLimit = require('express-rate-limit');
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const { successResponse, errorResponse } = require('../utils/responseHandler');

require("dotenv").config();

const {
    authentication,
    isNotCustomer,
    isAdmin,
} = require("../middleware/auth.js");


// Rate limiting 
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many login attempts, please try again later'
});

router.use('/login', authLimiter);
router.use('/register', authLimiter);


//Register
router.post("/register", async (req, res) => {
    try {
        const userEntry = req.body;
        const emailCheck = await User.findOne({ email: userEntry.email });

        if (emailCheck) 
            return errorResponse(res,null,'Email Already Exists', 403);

        const pass = await bcrypt.hash(userEntry.password, 10);
        userEntry.password = pass;

        const user = new User(userEntry);
        await user.save();

        return successResponse(res,null,"User Added Successfully");
    } catch (e) {
        return errorResponse(res, e);
    }
});

//Login
router.post("/login", async (req, res) => {
    try { 
        const { email, password } = req.body;
        const verifyUser = await User.findOne({ email });

        if (!verifyUser) 
            return errorResponse(res,null,"User Does Not Exist",403);
        
        const verifyPass = await bcrypt.compare(password, verifyUser.password);
        if (!verifyPass) 
            return errorResponse(res,null,"Password Does Not Match",401);

        const payload = {
            _id: verifyUser._id,
            email: verifyUser.email,
            role: verifyUser.role,
            firstName: verifyUser.firstName,
            lastName: verifyUser.lastName,
            mobileNo: verifyUser.mobileNo,
            cart: verifyUser.cart,
            wishlist: verifyUser.wishlist,
            compare: verifyUser.compare,
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
        return errorResponse(res, e);
    }
});

//post a mobile entry
router.post("/mobiles/add", authentication,isNotCustomer, async (req, res) => {
    try {
        const { data } = req.body; 

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

        return successResponse(res,null,"Mobile Added Successfully");
    } catch (e) {
        return errorResponse(res, e);
    }
});

//get brands and ram
router.get("/mobiles/filters", async (req, res) => {
    try {
        const brands = await Mobile.distinct("brand");
        const ram = await Mobile.distinct("ram");

        return successResponse(res,{ brands, ram },"Brands and RAM");
    } catch (e) {
        return errorResponse(res, e);
    }
});

//get mobile by id
router.get("/mobiles/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const mob = await Mobile.findOne({key:id});

        if (!mob) 
            return errorResponse(res,null, "Mobile Not Found" , 404);

        return successResponse(res,mob,"Specific Mobile");
    } catch (e) {
        return errorResponse(res, e);
    }
});


//stripe checkout
router.post("/checkout", async (req, res) => {
    const { products, amount,userId } = req.body; 
    let newOrder;

    try {

        newOrder = await Order.create({
            userId, // Associate with the user
            products,
            totalAmount: amount,
            status: 'Pending', // initial status to 'Pending'
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

        // Update the order with the Stripe session ID
        await Order.findByIdAndUpdate(newOrder._id, { 
            stripeSessionId: session.id, 
        }, { new: true });

        return successResponse(res,session.id,"Order Completed");
    } catch (error) { 

        if (newOrder) {
            await Order.findByIdAndUpdate(newOrder?._id, { status: 'Failed' }, { new: true });
        }

        return errorResponse(res, error);
    }
});

router.get('/success',async(req,res)=>{
    try{
        const id=req.query.session_id;
        await Order.findOneAndUpdate({stripeSessionId:id},{status:"Complete",createdAt:Date.now()},{new:true});

        return successResponse(res,null, "Order Completed");
    }
    catch(e)
    {
        return errorResponse(res, e);
    }
})

router.get('/failed',async(req,res)=>{
    try{
        const id=req.query.session_id;
        await Order.findOneAndUpdate({stripeSessionId:id},{status:"Failed",createdAt:Date.now()},{new:true}); 

        return successResponse(res,null, "Order Failed");
    }
    catch(e)
    {
        return errorResponse(res, e);
    }
})

router.get('/orders/user/:id',async(req,res)=>{
    try{
        const id=req.params.id;
        const order=await User.findOne({_id:id}).populate('orders') ;

        //sort by latest order
        order.orders.sort((a,b)=>b.createdAt-a.createdAt);

        return successResponse(res,order.orders,"User Orders");
    }
    catch(e)
    {
        return errorResponse(res, e);
    }
})

router.get('/orders',async(req,res)=>{
    try{
        const orders=await Order.find({}).sort({createdAt:-1});
        return successResponse(res,orders,"All Orders");
    }
    catch(e)
    {
        return errorResponse(res, e);
    }
})

router.get("/filters", async (req, res) => {
    try {

        // Pagination 
        const page = parseInt(req?.query?.page) || 1;
        const limit = parseInt(req?.query?.limit) || 10;
        const skip = (page - 1) * limit;

        const brandArray = req?.query?.brandFilter ? JSON.parse(req.query.brandFilter):[];
        const ramArray = req?.query?.ramFil ? JSON.parse(req.query.ramFil):[];
        const priceArray = req?.query?.priceFilter ? JSON.parse(req.query.priceFilter):[];
        const ratingArray = req?.query?.ratingFilter ? JSON.parse(req.query.ratingFilter):[];

        const sortBy= req?.query?.sortBy ? req?.query?.sortBy : null;
        const sortOrder= req?.query?.sortOrder==='asc' ? 1 : -1;

        const sortOption = {};
        if(sortBy)
            sortOption[sortBy] = sortOrder;
            

        let filter = {};

        if (brandArray.length > 0) 
            filter.brand = { $in: brandArray };
        
        if (ramArray.length > 0) 
            filter.ram = { $in: ramArray };
        

        let priceCriteria = [];
        if (priceArray.length > 0) {
            priceCriteria = priceArray.map((priceRange) => {
                const [min, max] = priceRange.split(",").map((price) => parseInt(price, 10));
                return { price: { $gte: min, $lte: max } };
            });
        }

        let ratingCriteria = [];
        if (ratingArray.length > 0) {
            ratingCriteria = ratingArray.map((rating) => {
                const parsedRating = parseFloat(rating);
                return { rating: { $gte: parsedRating, $lt: parsedRating + 1 }};
            });
        }

        // Combine Price and Rating Criteria
        if (priceCriteria.length > 0 && ratingCriteria.length > 0) 
            filter.$and = [{ $or: priceCriteria }, { $or: ratingCriteria }];
        else if (priceCriteria.length > 0) 
            filter.$or = priceCriteria;
        else if (ratingCriteria.length > 0) 
            filter.$or = ratingCriteria;
        

        const [mobiles, total] = await Promise.all([
            Mobile.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
            Mobile.countDocuments(filter)
        ]);

        if (!mobiles) 
            return errorResponse(res, null, 'No Mobile Found', 404);

        return successResponse(res,mobiles,"Mobiles retrieved successfully",200, {
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
        
    } catch (e) {
        return errorResponse(res, e);
    }
});

//get compare list
router.get("/compare",authentication,async(req,res)=>{
    try {
        const tmp=await User.findOne({_id:req.user._id})?.populate('compare');
        const compList=tmp?.compare;

        if(!tmp)
            return errorResponse(res,null, "User Not Found",404);
    
        return successResponse(res,compList,"Compare List");
    } catch (error) {
        return errorResponse(res, error);
    }
})   

//add mobiles to compare (at most 4 at a time)
router.get("/compare/:key",authentication,async(req,res)=>{
    try {
        const mob=req.params.key;
        const user=await User.findOne({_id:req.user._id});

        if (!user) 
            return errorResponse(res,null, "User Not Found",404);

        const entry=await Mobile.findOne({ key: mob });

        if(user?.compare?.length>=4 && !user?.compare.includes(entry._id))
            return errorResponse(res,null, "Cannot compare more than 4 mobiles",404);

        if(!entry)
            return errorResponse(res,null, "Mobile Not Found",404);

        if(user?.compare.includes(entry._id))
        {
            user.compare.pull(entry._id);
            await user.save();
            return successResponse(res,null,"Removed from compare");
        }

        if(user?.compare?.length>=4)
            return errorResponse(res,null, "Cannot compare more than 4 mobiles",404);

        user.compare.push(entry._id);
        await user.save();

        return successResponse(res,null,"Added to compare");
    } catch (error) {
        return errorResponse(res, error);
    }
})

//get wishlist of a user
router.get("/wishlist", authentication, async (req, res) => {
    const userInfo = await User.findOne({ _id: req.user._id }).populate("wishlist");
    const list = userInfo.wishlist;

    return successResponse(res,list,"Wishlist");
});

//set wishlist of a user (add or remove)
router.get("/wishlist/:key", authentication, async (req, res) => {
    try {
        const key = req.params.key;
        const user = await User.findOne({ _id: req.user._id });

        if (!user) 
            return errorResponse(res,null, "User Not Found",404);

        const entry = await Mobile.findOne({ key });

        if (!entry) 
            return errorResponse(res,null, "Mobile Not Found",404);

        if (user.wishlist.includes(entry._id)) {
            user.wishlist.pull(entry._id);
            await user.save();
            return successResponse(res,null,"Removed from wishlist");
        }

        user.wishlist.push(entry._id);
        await user.save();

        return successResponse(res,null,"Added to wishlist");
    } catch (error) {
        return errorResponse(res, error);
    }
});

//get cart of a user
router.get("/cart", authentication, async (req, res) => {
    const userInfo = await User.findOne({ _id: req.user._id }).populate("cart");
    const list = userInfo.cart;

    return successResponse(res,list,"Cart List");
});

//set cart of a user (add or remove)
router.get("/cart/:key", authentication, async (req, res) => {
    try {
        const key = req.params.key;
        const userEntry = await User.findOne({ _id: req.user._id });

        if (!userEntry) 
            return errorResponse(res,null, "User Not Found",404);

        const entry = await Mobile.findOne({ key });
        if (!entry) 
            return errorResponse(res,null ,"Mobile Not Found",404);

        if (userEntry.cart.includes(entry._id)) {
            userEntry.cart.pull(entry._id);
            await userEntry.save();
            return successResponse(res,null,"Removed from cart");
        }

        userEntry.cart.push(entry._id);
        await userEntry.save();

        return successResponse(res,null,"Added to cart");
    } catch (error) {
        return errorResponse(res, error);
    }
});

//get a mobile entry
router.get("/:key", async (req, res) => {
    try {
        const key = req.params.key; 
        const mobFind = await Mobile.findOne({ key });

        if (!mobFind) 
            return errorResponse(res,null, "Mobile Not Found",404);

        return successResponse(res,mobFind,"Specific Mobile");
    } catch (e) {
        return errorResponse(res, e);
    }
});

//update a mobile entry
router.put("/update/:key", async (req, res) => {
    try {
        const key = req.params.key; 
        const mobFind = await Mobile.findOne({ key }); 

        if (!mobFind) 
            return errorResponse(res,null, "Mobile Not Found",404);

        const mobUpdate = await Mobile.findOneAndUpdate({ key }, req.body, {
            new: true,
        }); 

        return successResponse(res,mobUpdate,"Mobile Updated");
    } catch (e) {
        return errorResponse(res, e);
    }
});

//delete a mobile entry
router.delete("/mobiles/delete/:key",authentication,isAdmin,async (req, res) => {
    try {
        const key = req.params.key;
        const delMob = await Mobile.findOneAndDelete({ key }); 

        if (!delMob) 
            return errorResponse(res,null, "Mobile Not Found",404);

        return successResponse(res,null,"Mobile Deleted Successfully");
    } catch (e) {
        return errorResponse(res, e);
    }
});

module.exports = router;
