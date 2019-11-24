var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
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
router.post("/",middleware.isLoggedIn, upload.single('image'), async function(req,res){
// 	Check to see if user uploaded file
	if(req.file){
		// Upload the image file
// 		we use await to wait for this function to finish before executing other code
		await cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
		  if(err) {
			req.flash('error', err.message);
			return res.redirect('back');
		  }
			// add cloudinary url for the image to the campground object under image property
			req.body.campground.image = result.secure_url;
			// add image's public_id to campground object
			req.body.campground.imageId = result.public_id;
		});
	}
	// add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
// 	Get data from form to create a new campground in database
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        res.redirect('/campgrounds/' + campground.id);
    
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
router.put("/:id",middleware.checkCampgroundOwnership, upload.single('image'),function(req,res){
// 	find the correct campground
	 Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
// 			Check to see if new image file was uploaded
            if (req.file) {
				try {
				// 	Deletes old image file
				  await cloudinary.v2.uploader.destroy(campground.imageId);
				  var result = await cloudinary.v2.uploader.upload(req.file.path);
				//  Updates the image file to the new one 
				  campground.imageId = result.public_id;
				  campground.image = result.secure_url;
				} catch(err) {
				  req.flash("error", err.message);
				  return res.redirect("back");
				}
            }else{
// 				If there is an image url update the image to that url
				campground.image=req.body.campground.image;
			}
// 			Update the campground and save it 
            campground.name = req.body.campground.name;
			campground.price=req.body.campground.price;
            campground.description = req.body.campground.description;
			
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
	Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
// 		Delete image file from cloudinary then delete from database
		if(campground.imageId){
			await cloudinary.v2.uploader.destroy(campground.imageId);
		}
// 		Delete all comments associated with the campground by matching the comment id
// 		*The $in operator selects the documents where the value of a field equals any value in the specified array
		Comment.deleteMany( {_id: { $in: campground.comments } }, function (err) {
			if (err) {
				console.log(err);
			}else{
			campground.remove();
			req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
			}
		});
		
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
});

// function to format string to regex
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;