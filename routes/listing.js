const express = require("express");
const router = express.Router();
const Listing = require('../models/listing.js');
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer')
const {storage} = require("../cloudConfiig.js")
const upload = multer({ storage })

router
    .route("/listings")
    .get(wrapAsync(listingController.index))                                                //Index Route
    .post(
        isLoggedIn,
        upload.single('listing[image]'), 
        validateListing,
        wrapAsync(listingController.createListing)
    )                                                                                       //Create Route

//New Route
router.get("/listings/new" ,isLoggedIn, listingController.renderNewForm);

router
    .route("/listings/:id")
    .get(wrapAsync(listingController.showListing))                                          //Show Route
    .put(
        isLoggedIn,
        isOwner, 
        upload.single('listing[image]'),
        validateListing, 
        wrapAsync(listingController.updateListing))                                         //Update Route
    .delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing))                //Delete Route

//Edit Route
router.get("/listings/:id/edit" ,isLoggedIn,isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;