const Listing = require("../models/listing")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req,res) => {
    const allListings = await Listing.find({});
    res.render("./listings/index.ejs", {allListings});
}

module.exports.renderNewForm = (req,res) => {
    console.log(req.user);
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req,res) => {
    // if(!req.body.listing) {
    //     throw new ExpressError(400, "Send valid data for listing");
    // }
    let {id} = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
                model: "User",
            },
        })
        .populate("owner");
    if(!listing){
        req.flash("error", "Listing you requested for does not exist !!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", {listing});
}

module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
    .send()
    //console.log(response.body.features[0].geometry);

    let url = req.file.path;
    let filename = req.file.filename;
    // const defaultImage = {
    //     url: "https://plus.unsplash.com/premium_photo-1687995672988-be514f56428e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    //     filename: "default_image"
    // };

    // const imageInput = req.body.listing.image;

    // // Create new listing and handle image logic
    // const newListing = new Listing({
    //     ...req.body.listing,
    //     image: imageInput && imageInput.trim() !== "" 
    //         ? { url: imageInput, filename: "custom_upload" }
    //         : defaultImage
    // });
    // console.log(req.user)
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    // newListing.geometry = response.body.features[0].geometry;

    // let savedListing = await newListing.save();
    // console.log(savedListing);
    //await newListing.save();
    if (response.body.features.length) {
        newListing.geometry = {
            type: 'Point',
            coordinates: response.body.features[0].geometry.coordinates
        };
        await newListing.save();
    }

    req.flash("success", "New Listing Created !!");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req,res) => {
let {id} = req.params;
const listing = await Listing.findById(id);
if(!listing){
    req.flash("error", "Listing you requested for does not exist !!");
    res.redirect("/listings");
}
let originalImageUrl = listing.image.url;
originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250")
res.render("listings/edit.ejs", {listing, originalImageUrl});
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    // let list = await Listing.findById(id);
    // if( !list.owner._id.equals(res.locals.currUser._id)) {
    //     req.flash("error", "You don't have perrmission to edit !!");
    //     return res.redirect(`/listings/${id}`);
    // }
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    
    if(typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;

    listing.image = {url, filename };
    // // Extract the new data from the request
    // const updatedData = req.body.listing;
    // // Check if a new image URL is provided
    // if (updatedData.image && updatedData.image.trim() !== "") {
    //     // If provided, update the image
    //     listing.image = {
    //         url: updatedData.image,
    //         filename: "custom_upload"
    //     };
    // }
    //    // Update other fields
    // listing.title = updatedData.title;
    // listing.description = updatedData.description;
    // listing.price = updatedData.price;
    // listing.location = updatedData.location;
    // listing.country = updatedData.country;
    await listing.save();
    }
    req.flash("success", "Existing Listing Updated !!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req,res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Existing Listing Deleted !!");
    res.redirect("/listings");
}