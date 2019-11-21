var express = require("express"),
	app = express(),
	bodyParser = require("body-parser"),
	mongoose = require("mongoose"),
	flash = require("connect-flash"),
	passport = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	middleware = require("./middleware"),
	Campground = require("./models/campground"),
	Comment = require("./models/comment"),
	User = require("./models/user"),
	seedDB = require("./seeds")

//requiring routes
var commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index")
    
// DATABASE SET-UP
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// We create an environment variable to connect to mongodb atlas if we are using heroku else we use the local mongodb database
var databaseUrl = process.env.DATABASEURL || "mongodb://localhost/yelp_camp"; 
mongoose.connect(databaseUrl);



app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// // Seed the database
// seedDB();

// require moment
app.locals.moment = require("moment");

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Spicy P",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
	res.locals.currentUser=req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
})

// USING OUR ROUTES THAT WE REQUIRED
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(process.env.PORT || 3000,function(){
	console.log("SERVER IS RUNNING...");
})