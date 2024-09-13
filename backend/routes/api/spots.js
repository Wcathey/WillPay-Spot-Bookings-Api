const express = require('express');
const { sequelize, Spot, SpotImage, User, Review, ReviewImage, Booking } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');
const { handleValidationErrors, validateSpot, validateReview, validateSpotImage } = require('../../utils/validation');
const { addPreviewImage, getReviewAvg } = require('../../utils/helperFunctions');


const router = express.Router();

//Get all spots, req auth: false
router.get('/', async (req, res) => {

    const allSpots = await Spot.findAll();
    const addImage = await addPreviewImage(allSpots, SpotImage);
    const addReviewAvg = await getReviewAvg(addImage, Review);
    res.json(addReviewAvg)

});
//get all spots of current user
router.get('/current', requireAuth,  async (req, res, next) => {

    const {user} = req
    let ownedSpots = await Spot.findAll({
        where: {
            ownerId: user.id
        },
    });
    const addImage = await addPreviewImage(ownedSpots, SpotImage);
    const addReviewAvg = await getReviewAvg(addImage, Review)
    res.json(addReviewAvg)



    });
//Get details of Spot from an id, req auth: false
router.get('/:spotId', async (req, res) => {

        const specificSpot = await Spot.findByPk(req.params.spotId);
        if(!specificSpot) {
            res.status(404);
            res.json({message: "Spot couldnt be found"})
            }
        else {
        const reviewCount = await Review.count({
            where: {
                spotId: req.params.spotId
            }
        })
        const reviewSum = await Review.sum('stars', {
            where: {
                spotId: req.params.spotId
            }
        })
        const jsonSpot = specificSpot.toJSON();
        jsonSpot["numReviews"] = reviewCount;
        jsonSpot['avgStarRating'] = (reviewSum / reviewCount) || 0;
        const SpotImages = await SpotImage.findAll({
            where: {
                spotId: req.params.spotId
            }
        });
        const Owner = await User.findAll({
            attributes: ["id", "firstName", "lastName"],
            where: {
                id: jsonSpot.ownerId
            }
        });

        res.json({...jsonSpot, SpotImages, Owner})

    }
});
// get all reviews by spots id
router.get('/:spotId/reviews', async (req, res, next) => {

    const reviews = await Review.findAll({
        include: [{
            model: User,
            attributes: ["id", "firstName", "lastName"],

        }, ReviewImage],
         where: {
            spotId: req.params.spotId
        }
    });
    if(!reviews) {
        res.status(404);
        res.json({message: "Spot couldnt be found"})
    }
    else {
        res.json(reviews)
    }
});

//create a review for spot based on spot id
router.post('/:spotId/reviews', requireAuth, validateReview, async (req, res, next) => {

    const {user} = req;
    const {review, stars} = req.body;

    const checkSpotId = await Spot.findByPk(req.params.spotId)
    if(!checkSpotId) {
        res.status(404);
        res.json({message: "Spot couldn't be found"})
    }
    const checkReviews = await Review.findAll({
        where: {
            userId: user.id,
            spotId: req.params.spotId
        }
    });


    if(checkReviews.length > 0) {
        res.status(403);
        res.json({message: "User already has a review for this spot"})
    }
    else {
        const newReview = await Review.create({
            userId: user.id,
            spotId: req.params.spotId,
            review: review,
            stars: stars
    });
    res.status(201);
    res.json(newReview)
}

})


//Create a Spot, req auth: true
router.post('/', requireAuth, validateSpot, async (req, res, next) => {
const {user} = req
const {address, city, state, country, lat, lng, name, description, price} = req.body
const newSpot = await Spot.create({
   ownerId: user.id,
   address: address,
   city: city,
   state: state,
   country: country,
   lat: lat,
   lng: lng,
   name: name,
   description: description,
   price: price

});
res.status(201)
res.json(newSpot)
});

//Add an Image to Spot based on Spot Id, req auth: true
router.post('/:spotId/images', requireAuth, validateSpotImage, async (req, res, next) => {
    const spot = await Spot.findByPk(req.params.spotId);
    if(!spot) {
        res.status(404);
        res.json({message: "Spot couldnt be found"})
    }
    else {
    const {url, preview} = req.body
    const image = await SpotImage.create({
        spotId: req.params.spotId,
        url: url,
        preview: preview
    });
    const getImage = await SpotImage.findByPk(image.spotId)
    res.status(201);
    res.json(getImage);

    }


});

//Edit a Spot, req auth: true
router.put('/:spotId', requireAuth, validateSpot, async (req, res, next) => {
    const spot = await Spot.findByPk(req.params.spotId);
    if(!spot) {
        res.status(404)
        res.json({message: "Spot couldn't be found"})
    }
    else {
       const {address, city, state, country, lat, lng, name, description, price} = req.body
     await Spot.update({
        address: address,
        city: city,
        state: state,
        country: country,
        lat: lat,
        lng: lng,
        name: name,
        description: description,
        price: price
       },
    {
        where: {
            id: req.params.spotId
        }
    });
    const updatedSpot = await Spot.findByPk(req.params.spotId);

    return res.json(updatedSpot)
}
});

//Delete a Spot, req auth: true
router.delete('/:spotId', requireAuth, async (req, res, next) =>{
    try {
        const {user} = req;
        await Spot.destroy({
            where: {
                id: req.params.spotId
            }

        });

        res.json({message: "Successfully deleted"});

    } catch(error) {
        res.status(404)
        console.error(error)
        res.json({message: "Spot couldn't be found"})
    }
})


// POST /api/spots/:spotId/bookings - Create a booking for a spot
router.post('/:spotId/bookings', requireAuth, async (req, res, next) => {
    try {
      const spotId = req.params.spotId;
      const { startDate, endDate } = req.body;

      // Ensure that the spot exists
      const spot = await Spot.findByPk(spotId);
      if (!spot) {
        return res.status(404).json({
          message: "Spot couldn't be found",
          statusCode: 404,
        });
      }

      // Check if the current user is trying to book their own spot (unauthorized)
      if (spot.ownerId === req.user.id) {
        return res.status(403).json({
          message: "You cannot book your own spot",
          statusCode: 403,
        });
      }

      // Check if there is an overlapping booking
      const existingBooking = await Booking.findOne({
        where: {
          spotId: spotId,
          startDate: {
            [Op.lte]: endDate, // Booking exists with start date before the end date of new booking
          },
          endDate: {
            [Op.gte]: startDate, // Booking exists with end date after the start date of new booking
          },
        },
      });

      if (existingBooking) {
        return res.status(403).json({
          message: "Booking conflict: spot is already booked for the specified dates",
          statusCode: 403,
        });
      }

      // Create the new booking
      const newBooking = await Booking.create({
        userId: req.user.id, // Current authenticated user
        spotId: spotId,
        startDate: startDate,
        endDate: endDate,
      });

      return res.status(201).json(newBooking);
    } catch (error) {
      next(error);
    }
  });
module.exports = router;
