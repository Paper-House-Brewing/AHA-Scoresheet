let express = require('express');
let router = express.Router();

//* CONTROLLERS *//
let authController = require("../controllers/AuthController");
let scoresheetController = require('../controllers/ScoresheetController');
let adminController = require('../controllers/AdminController');
const flightController = require('../controllers/FlightController');

//* MIDDELWARE *//
let authMiddle = require("../middleware/auth");

//* CORE SITE FUNCTIONS *//

// route to index/home
router.get('/', authController.home);

// route to register page
router.get('/register', authController.register);

// route for register action
router.post('/register', authController.doRegister);

// route to login page
router.get('/login', authController.login);

// route for login action
router.post('/login', authController.doLogin);

// route for logout action
router.get('/logout', authController.logout);

// route for user profile edit
router.get('/profile/edit', authMiddle.isAuthenticated, authController.editProfile);

// route for user profile edit
router.post('/profile/edit', authMiddle.isAuthenticated, authController.saveProfile);
router.post('/profile/email', authMiddle.isAuthenticated, authController.updateEmail);
router.post('/profile/password', authMiddle.isAuthenticated, authController.updatePassword);

//* SCORESHEET FUNCTIONS *//

//route for scoresheet list load
router.get('/scoresheet/load', authMiddle.isAuthenticated, scoresheetController.loadScoresheetList);

//route for scoresheet individual or new load
router.get('/scoresheet/edit/', authMiddle.isAuthenticated, scoresheetController.initScoresheet);

//route for scoresheet individual post edit
router.post('/scoresheet/edit/', authMiddle.isAuthenticated, scoresheetController.initScoresheet);

// route for scoresheet ajax autosave
router.post('/scoresheet/update/', authMiddle.isAuthenticated, scoresheetController.doScoresheetDataChange);

//route for PDF Generate
router.get('/scoresheet/pdf/:scoresheetId', authMiddle.isAuthenticated, scoresheetController.generatePDF);

//route for check scoresheet post
router.post('/scoresheet/check', authMiddle.isAuthenticated, scoresheetController.doCheckScoresheet);

//route for validate scoresheet post
router.post('/scoresheet/validate', authMiddle.isAuthenticated, scoresheetController.doValidateScoresheet);

//* ADMIN FUNCTIONS *//
router.get('/admin', authMiddle.isAdmin, adminController.controlPanel);

//* FLIGHT FUNCTIONS *//
router.post('/flight/add', authMiddle.isAuthenticated, flightController.addFlight)
router.post('/flight/edit', authMiddle.isAdmin, flightController.editFlight)
router.post('/flight/submit', authMiddle.isAuthenticated, flightController.submitFlight)
router.post('/flight/getByName', authMiddle.isAuthenticated, flightController.getFlightByName)
router.post('/flight/getById', authMiddle.isAuthenticated, flightController.getFlightById)
router.post('/flight/delete', authMiddle.isAdmin, flightController.deleteFlight)


module.exports = router;