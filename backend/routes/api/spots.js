const express = require('express');
const { Spot, SpotImage } = require('../../db/models');
const { requireAuth } = require('../../utils/auth');

const router = express.Router();

//Get all spots, req auth: false
router.get('/', async (req, res) => {
//still needs avgRating, previewImage
    const allSpots = await Spot.findAll();
    res.json(allSpots)
});

router.get('/current', requireAuth,  async (req, res, next) => {
    //still needs avgRating, previewImage
    const {user} = req
    const ownedSpots = await Spot.findAll({
        where: {
            ownerId: user.id
        }
    });
    res.json(ownedSpots)
    });
//Get details of Spot from an id, req auth: false
router.get('/:spotId', async (req, res) => {
    try {

        //still needs Owner details
        const specificSpot = await Spot.findByPk(req.params.spotId, {
            include: SpotImage

        })
        res.json(specificSpot)
    } catch(error) {
        res.status(404);
        res.json({message: "Spot couldn't be found"})
    }

});



//Create a Spot, req auth: true
router.post('/', requireAuth, async (req, res, next) => {
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
 //previewImage: imageUrl (need to include from spotImage)
});
res.json(newSpot)
});

//Add an Image to Spot based on Spot Id, req auth: true
router.post('/:spotId/images', requireAuth, async (req, res, next) => {

try{

    const {url, preview} = req.body
    const image = await SpotImage.create({
        spotId: req.params.spotId,
        url: url,
        preview: preview
    });
//added to SpotImage table but url needs to be added to Spot as previewImage
    res.json(image)
} catch(error) {
    res.status(404);
    res.json({message: "Spot couldn't be found"})
}



});

//Edit a Spot, req auth: true
router.put('/:spotId', requireAuth, async (req, res, next) => {
    try{
       const {address, city, state, country, lat, lng, name, description, price} = req.body
       const updatedSpot = await Spot.update({
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
    res.json(updatedSpot)
    } catch(error) {
        res.status(404);
        res.json({message: "Spot couldn't be found"})
    }
});

//Delete a Spot, req auth: true
router.delete('/:spotId', requireAuth, async (req, res, next) =>{
    try {
        await Spot.destroy({
            where: {
                id: req.params.spotId
            }
        });

        res.json({message: "Successfully deleted"});

    } catch(error) {
        res.status(404)
        res.json({message: "Spot couldn't be found"})
    }
})
module.exports = router;
