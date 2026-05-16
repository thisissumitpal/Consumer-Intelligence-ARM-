const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const eventController = require('../controllers/eventController');
const brandController = require('../controllers/brandController');


router.post('/brands', brandController.createBrand);
router.get('/brands', brandController.getBrands);


router.post('/users', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users/:id/register-brand', userController.registerBrand);
router.get('/users/:id/intelligence', userController.getIntelligence);


router.post('/events', eventController.createEvent);
router.get('/events', eventController.getEvents);

module.exports = router;
