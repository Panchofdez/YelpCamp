var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

// Multer Configuration
var multer = require('multer');
// Whenever the file gets uploaded we created a custom name for that file
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // filter to accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// Cloudinary Configuration
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'fdez', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


// INDEX ROUTE- SHOW ALL CAMPGROUNDS
router.get("/",function(req,res){
// 	because our search form in the index page was a GET request we get the search info in req.query.search not req.query.body
	if(req.query.search){
// 		We use regex to match the search query with the name of campgrounds in the database
		var regex = new RegExp(escapeRegex(req.query.search), 'gi')
		Campground.find({name:regex},function(err,allCampgrounds){
			if(err){
				console.log(err);
			}else{
				res.render("campgrounds/index",{ campgrounds:allCampgrounds,page:"campgrounds"});
			}
		})
	}else{
// 	Get all campground from database
		Campground.find({},function(err,allCampgrounds){
			if(err){
				console.log(err);
			}else{
				res.render("campgrounds/index",{ campgrounds:allCampgrounds,page:"campgrounds"});
			}
		})
	}
})

// CREATE ROUTE-ADD NEW CAMPGROUND TO DATABASE
router.post("/",middleware.isLoggedIn, upload.single('image'), function(req,res){
// 	Get Data from form to add to campgrounds array
	cloudinary.uploader.upload(req.file.path, function(result) {
	  // add cloudinary url for the image to the campground object under image property
	  req.body.campground.image = result.secure_url;
	  // add author to campground
	  req.body.campground.author = {
		id: req.user._id,
		username: req.user.username
	  }
	  Campground.create(req.body.campground, function(err, campground) {
		if (err) {
		  req.flash('error', err.message);
		  return res.redirect('back');
		}
		res.redirect('/campgrounds/' + campground.id);
	  });
	});
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

// function to format string to regex
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;