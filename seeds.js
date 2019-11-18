var mongoose =  require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment")
var data = [
	{
		name:"Stoney Creek",
		price:"12.99",
		image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKTF7IdQ_DXtz-NbJRJuebNfNhx7nhCBkqJi6y_5ENgNQeLB_f&s",
		description:"There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
		author:{
            id : "588c2e092403d111454fff76",
            username: "Jack"
        }
	},
	{
		name:"Mountain Goat's Rest",
		price:"20.00",
		image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9wOVtld5L8I8QW2_tK16V6jyomt5v1vkTEuMGv4qbScEuquRE&s",
		description:"Where GOAT'S come to rest.There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
		 author:{
            id : "588c2e092403d111454fff71",
            username: "Jill"
        }
	},
	{
		name:"Moosehead",
		price:"9.50", 
		image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0tW1uRVK-DwnwL8Cayittvzu6IxtzA2nMdDOyKG2Y-f3laSiU&s",
		description:"There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
		author:{
            id : "588c2e092403d111454fff77",
            username: "Jane"
        }
	}
]
function seedDB(){
// 	REMOVE ALL CAMPGROUNDS
	Campground.remove({},function(err,){
		if(err){
			console.log(err);
		}else{
			console.log("removed campgrounds!");
		}
		// 	ADD A FEW CAMPGROUNDS
		data.forEach(function(seed){
			Campground.create(seed,function(err,campground){
				if (err){
					console.log(err);
				}else{
					console.log("Added a campground");
// 					CREATE A FEW COMMENTS
					Comment.create({
						text:"This place is great, but I wish there was internet",
						 author:{
                                    id : "588c2e092403d111454fff76",
                                    username: "Homer"
                                }
					},function(err,comment){
						if(err){
							console.log(err);
						}else{
							campground.comments.push(comment);
							campground.save();
							console.log("created a new comment");
						}
					})
					
				}
			});
		});
	});

}

module.exports = seedDB;