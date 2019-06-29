let mongoose = require("mongoose");
let passport = require("passport");
let User = require("../models/User");
let appConstnats = require("../helpers/appConstants");

let _fields = ["username", "forename", "surname", "password"];

let userController = {};

function errorProcessor(err, req) {
	// Sort out our custom error messages
	//let _err = [];
	_fields.forEach(function(v) {
		if (err.errors && typeof err.errors[v] !== "undefined") {
			req.flash("error", err.errors[v].message);
		}
	});

	// Specific and default error catcher
	switch (err.name) {
		case "UserExistsError":
		case "MissingPasswordError":
			req.flash("error", err.message);
			break;
		// Don't use a default it doubles for the custom error messages
		default:
			//_err.push(err.message);
			break;
	}

	//return _err;
}

// Restrict access to root page
userController.home = function(req, res) {
	res.render('index', {
		user : req.user,
		title : appConstnats.APP_NAME + " - Home"
	});
};

// Go to registration page
userController.register = function(req, res) {
	res.render('register', {
		title : appConstnats.APP_NAME + " - Register"
	});
};

// Post registration
userController.doRegister = function(req, res) {
	// Password match
	let passwd = null;
	if (req.body.password.length > 0 && req.body.passwordC.length > 0 && req.body.password === req.body.passwordC) {
		passwd = req.body.password;
	}

	let newUser = new User({
		username : req.body.username,
		forename: req.body.forename,
		surname: req.body.surname,
		bjcp_id: req.body.bjcp_id,
		bjcp_rank: req.body.bjcp_rank,
		cicerone_rank: req.body.cicerone_rank,
		pro_brewer_brewery: req.body.pro_brewer_brewery,
		industry_description: req.body.industry_description,
		judging_years: req.body.judging_years
	});

	User.register(newUser, passwd)
		.then(function(newUser) {
			req.flash('success', 'Registration Successful');
			res.redirect('/');
		})
		.catch(function(err) {
			// Push the processed errors to the flash handler
			errorProcessor(err, req);

			return res.render('register', {
				fData: newUser,
				title : appConstnats.APP_NAME + " - Register"
			});
		});
};

// Go to login page
userController.login = function(req, res) {
	res.render('login', {
		title : appConstnats.APP_NAME + " - Login"
	});
};

// Post login
userController.doLogin = function(req, res) {
	passport.authenticate('local', {
		failureRedirect: '/login'
	})(req, res, function() {
		// Login is good, set the user data and go back home
		req.flash('success', 'Login Successful');
		res.redirect('/');
	});
};

// logout
userController.logout = function(req, res) {
	req.logout();
	res.redirect('/');
};

// Go to profile edit page
userController.editProfile = function(req, res) {
	res.render('profile', {
		user : req.user,
		title : appConstnats.APP_NAME + " - Edit Profile"
	});
};

// Post profile edit page
userController.saveProfile = function(req, res) {
	// Password match
	let passwd = null;

	// If the user provided both "new" password and confirm password we are changing the password
	if (req.body.new_password.length > 0 && req.body.new_passwordC.length > 0 && req.body.new_password === req.body.new_passwordC) {
		passwd = req.body.new_password;
	}

	let newUser = new User({
		username : req.body.username,
		forename: req.body.forename,
		surname: req.body.surname,
		password: passwd,
		bjcp_id: req.body.bjcp_id,
		bjcp_rank: req.body.bjcp_rank,
		cicerone_rank: req.body.cicerone_rank,
		pro_brewer_brewery: req.body.pro_brewer_brewery,
		industry_description: req.body.industry_description,
		judging_years: req.body.judging_years
	});

	// We only update the data if the user provides the correct password.
	passport.authenticate('local', {
		failureRedirect: '/login'
	})(req, res, function() {
		// Login is good, set the user data and go back home
		res.redirect('/');
	});
};

module.exports = userController;