var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

// ================
//  RESTful ROUTES
// ================


// INDEX ROUTE- SHOW ALL CAMPGROUNDS
router.get("/",function(req,res){
// 	Get all campground from database
	Campground.find({},function(err,allCampgrounds){
		if(err){
			console.log(err);
		}else{
			res.render("campgrounds/index",{ campgrounds:allCampgrounds,page:"campgrounds"});
		}
	})
})

// CREATE ROUTE-ADD NEW CAMPGROUND TO DATABASE
router.post("/",middleware.isLoggedIn,function(req,res){
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
router.get("/new",middleware.isLoggedIn,function(req,res){
			res.render("campgrounds/new");
});

// SHOW ROUTE-shows more info about one campground
router.get("/:id",function(req,res){
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
router.get("/:id/edit",middleware.checkCampgroundOwnership,function(req,res){
		Campground.findById(req.params.id,function(err,foundCampground){
			res.render("campgrounds/edit" , {campground:foundCampground});
	})
	
	
})

// UPDATE CAMPGROUND
router.put("/:id",middleware.checkCampgroundOwnership,function(req,res){
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
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err){
		if(err){
			res.redirect("/campgrounds");
		}else{
			res.redirect("/campgrounds");
		}
	})
})




module.exports = router;