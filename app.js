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



mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

// Connect to mongodb locally
// mongoose.connect("mongodb://localhost/yelp_camp");

// Connect to MongoDB Atlas 
mongoose.connect("mongodb+srv://pfdez:spicyp@cluster0-e8tt0.mongodb.net/test?retryWrites=true&w=majority");

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// // Seed the database
// seedDB();

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

// ================
//  RESTful ROUTES
// ================
// Landing Page
app.get("/",function(req,res){
	res.render("landing");
})
// INDEX ROUTE- SHOW ALL CAMPGROUNDS
app.get("/campgrounds",function(req,res){
// 	Get all campground from database
	Campground.find({},function(err,allCampgrounds){
		if(err){
			console.log(err);
		}else{
			res.render("campgrounds/index",{ campgrounds:allCampgrounds});
		}
	})
})

// CREATE ROUTE-ADD NEW CAMPGROUND TO DATABASE
app.post("/campgrounds",middleware.isLoggedIn,function(req,res){
// 	Get Data from form to add to campgrounds array
	var name = req.body.name;
	var price =req.body.price;
	var img = req.body.image;
	var description = req.body.description;
	var author = {
		id:req.user._id,
		username:req.user.username
	}
	var newCampground = {name:name,price:price,image:img,description:description,author:author};
// 	Create new campground and save to database
	Campground.create(newCampground,function(err,newlyCreated){
		if (err){
			req.flash("error","Something went wrong");
			console.log(err);
		}else{
			// 	redirect back to campgrounds page
			console.log(newlyCreated);
			req.flash("success","You successfully added a new campground!");
			res.redirect("/campgrounds");
		}
	})

});

//NEW ROUTE-SHOW FORM TO CREATE NEW CAMPGROUND
app.get("/campgrounds/new",middleware.isLoggedIn,function(req,res){
			res.render("campgrounds/new");
});

// SHOW ROUTE-shows more info about one campground
app.get("/campgrounds/:id",function(req,res){
	// 	Find the campground with the provided id
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampground){
		if (err){
			console.log(err);
		}else{
			// render show template with that campground
			res.render("campgrounds/show",{campground:foundCampground});
		}
	})

});

// EDIT CAMPGROUND ROUTE
app.get("/campgrounds/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
		Campground.findById(req.params.id,function(err,foundCampground){
			res.render("campgrounds/edit" , {campground:foundCampground});
	})
	
	
})

// UPDATE CAMPGROUND
app.put("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
// 	find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
		if(err){
			res.redirect("/campgrounds");
		}else {
// 			Redirect to the show page
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
})

// DESTROY CAMPGROUND ROUTE
app.delete("/campgrounds/:id",middleware.checkCampgroundOwnership,function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds");
		}
	})
})



// ======================
// COMMENTS ROUTES
// ======================

// 	NEW Comment Route 
// - Show form to add new comment
app.get("/campgrounds/:id/comments/new",middleware.isLoggedIn,function(req,res){
// 	FIND CAMPGROUND BY ID
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
		}else{
			res.render("comments/new",{campground:campground});
		}
	})
	
});

// CREATE Comment Route
// Add new comment to database
app.post("/campgrounds/:id/comments",middleware.isLoggedIn,function(req,res){
// 	lookup campground using ID
	Campground.findById(req.params.id,function(err,campground){
		if(err){
			console.log(err);
			res.redirect("/campgrounds")
		}else{
			// 	create a new comment
			Comment.create(req.body.comment,function(err,comment){
				if (err){
					req.flash("error", "Something went wrong");
					console.log(err);
				}else{
// 					add username and id to comment
					comment.author.id=req.user._id;
					comment.author.username=req.user.username;
// 					save comment
					comment.save();
					// connect new comment to campground
					campground.comments.push(comment);
					campground.save();
					// redirect campground to show page
					req.flash("success","Successfully added comment");
					res.redirect("/campgrounds/" + campground._id)
				}
			})
		}
	})
})

// EDIT Comment Route
// Show form to edit comment
app.get("/campgrounds/:id/comments/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
	Comment.findById(req.params.comment_id,function(err,foundComment){
		if (err){
			res.redirect("back");
		}else{
			res.render("comments/edit", {campground_id:req.params.id,comment:foundComment});
		}
	})
})

// UPDATE Comment Route
app.put("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,foundComment){
		if (err){
			res.redirect("back");
		}else{
			res.redirect("/campgrounds/" + req.params.id);
		}
	})
})

// DESTROY Comment Route
app.delete("/campgrounds/:id/comments/:comment_id",middleware.checkCommentOwnership,function(req,res){
	Comment.findByIdAndRemove(req.params.comment_id,function(err){
		if(err){
			res.redirect("back");
		}else{
			req.flash("success","Comment deleted");
			res.redirect("/campgrounds/"+req.params.id);
		}
	})
})

// =============
// AUTH ROUTES
// =============

// show register form
app.get("/register",function(req,res){
	res.render("register");
})
// handle sign up logic
app.post("/register",function(req,res){
	var newUser= new User({username:req.body.username});
	User.register(newUser,req.body.password,function(err,user){
		if(err){
			req.flash("error",err.message);
			return res.redirect("/register");
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success","Welcome to YelpCamp "+ user.username);
			res.redirect("/campgrounds");
		})
	})
})

// Show up login form 
app.get("/login",function(req,res){
	res.render("login");
})
// handling login logic
app.post("/login",passport.authenticate("local",
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login"
	}), function(req,res){
})

// Logout route
app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged you out!");
	res.redirect("/campgrounds");
})

app.listen(3000,function(){
	console.log("SERVER IS RUNNING...");
})