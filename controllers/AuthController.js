let passport = require("../helpers/seq.passport");
let User = require("../models").User;
let appConstants = require("../helpers/appConstants");
const errorConstants = require("../helpers/errorConstants");
let debug = require('debug')('aha-scoresheet:authController');
const Scoresheet = require("../models").Scoresheet;
const Flight = require("../models").Flight;

let _fields = ["username", "firstname", "lastname", "password"];

let userController = {};

let hasError = false;

function errorProcessor(err, req) {
	// Error trigger
	hasError = true;

	// Sort out our custom error messages
	_fields.forEach(function(v) {
		if (err.errors && typeof err.errors[v] !== "undefined") {
			req.flash("error", err.errors[v].message);
		}
	});

	// Specific and default error catcher
	switch (err.name) {
		case "UserExistsError":
		case "MissingPasswordError":
		case "CustomError":
			req.flash("error", err.message);
			break;
		case "IncorrectPasswordError":
			// Customize this message
			req.flash("error", "Password provided is not correct");
			break;
		// Don't use a default it doubles for the custom error messages
		default:
			req.flash("error", err.message);
			break;
	}
}

function jsonErrorProcessor(err, res) {
	if (errorConstants[err]) {
		res.status(400).json({
			errors: [
				{
					code: err,
					message: errorConstants[err]
				}
			]
		})
	} else {
		debug(err)
		console.log(err)
		res.status(500)
	}
}

// Restrict access to root page
userController.home = function(req, res) {
	if (!req.user) {
		res.render('index', {
			user : req.user,
			title : appConstants.APP_NAME + " - Home"
		});
		return
	}

	const scoresheetPromise = Scoresheet.findAll({
		where: {
			userId : req.user.id
		},
	})

	const flightPromise = Flight.findAll({
		where: {
			created_by : req.user.id
		},
	})

	Promise.all([scoresheetPromise, flightPromise]).then(([scoresheets, flights]) => {
		const flightObject = {}

		flights.forEach(flight => {
			flightObject[flight.id] = {
				...flight.get({plain:true}),
				scoresheets : scoresheets.filter(scoresheet => scoresheet.flightKey === flight.id).map(scoresheet => scoresheet.get({plain:true}))
			}
		})

		res.render('index', {
			user: req.user,
			title : appConstants.APP_NAME + " - Home",
			flights: flightObject
		})
	}).catch(err => {
		res.status(500)
		debug(err)
		console.log(err)
	})
};

// Go to registration page
userController.register = function(req, res) {
	res.render('register', {
		title : appConstants.APP_NAME + " - Register"
	});
};

// Post registration
userController.doRegister = function(req, res) {
	// Password match
	let passwd = null;
	if (req.body.password.length > 0 && req.body.passwordC.length > 0 && req.body.password === req.body.passwordC) {
		passwd = req.body.password;
	}

	let newUser = User.build({
		email : req.body.email,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		bjcp_id: req.body.bjcp_id,
		bjcp_rank: req.body.bjcp_rank,
		cicerone_rank: req.body.cicerone_rank,
		pro_brewer_brewery: req.body.pro_brewer_brewery,
		industry_description: req.body.industry_description,
		judging_years: req.body.judging_years
	});

	User.create({
		email : req.body.email,
		password: passwd,
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		bjcp_id: req.body.bjcp_id,
		bjcp_rank: req.body.bjcp_rank,
		cicerone_rank: req.body.cicerone_rank,
		pro_brewer_brewery: req.body.pro_brewer_brewery,
		industry_description: req.body.industry_description,
		judging_years: req.body.judging_years
	})
		.then(function() {
			req.flash('success', 'Registration Successful');
			res.redirect('/');
		})
		.catch((err) => {
			// Push the processed errors to the flash handler
			errorProcessor(err, req);

			return res.render('register', {
				fData: newUser,
				title : appConstants.APP_NAME + " - Register"
			});
		});
};

// Go to login page
userController.login = function(req, res) {
	res.render('login', {
		title : appConstants.APP_NAME + " - Login"
	});
};

// Post login
userController.doLogin = function(req, res) {
	passport.authenticate('passport-sequelize', {
		// Login is bad, try again!
		failureRedirect: '/login',
		failureFlash: 'Incorrect user information.'
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
		title : appConstants.APP_NAME + " - Edit Profile"
	});
};

userController.updateEmail = function(req,res) {
	const emailRegex = new RegExp(appConstants.EMAIL_REGEX)
	const oldEmail = req.body.oldEmail
	const newEmail = req.body.newEmail

	User.findByPk(req.user.id).then(user => {
		// validate new password meets minimum requirements
		if (!emailRegex.test(newEmail)) {
			return Promise.reject("EMAIL_FAIL_CRITERIA")
		}

		if (oldEmail !== user.email) {
			return Promise.reject("INVALID_EMAIL")
		}

		return User.update({ email: newEmail }, {
			where: {
				id: user.id
			}
		})
		
	}).then(user => {
		res.status(200).json(true)
	}).catch(err => {
		jsonErrorProcessor(err, res)
	})
}

userController.updatePassword = function(req,res) {
	const passwordRegex = new RegExp(appConstants.PASSWORD_REGEX)
	const oldPassword = req.body.oldPassword
	const newPassword = req.body.newPassword

	User.findByPk(req.user.id).then(user => {
		// validate new password meets minimum requirements
		if (!passwordRegex.test(newPassword)) {
			return Promise.reject("PASSWORD_FAIL_CRITERIA")
		}

		return user.validatePasswordAsync(oldPassword).then(validated => {
			if (!validated) {
				return Promise.reject("INVALID_PASSWORD")
			} else {
				return user
			}
		}).then(user => {
			user.hashPassword(newPassword).then(newHashedPassword => {
				return User.update({ password: newHashedPassword }, {
					where: {
						id: user.id
					}
				})
			})
		})
	}).then((user) => {
		console.log('Password Change Successful')
		res.status(200).json(true)
	}).catch(err => {
		console.log(err)
		jsonErrorProcessor(err, res)
	})
}

// Post profile edit page
userController.saveProfile = function(req, res) {
	// Login is good, now just make sure we have a good user object to modify
	User.findById(req.user.id, function (err, user) {
		// Something went wrong...
		if (err || !user) {
			// Push the processed errors to the flash handler
			errorProcessor(err, req);
			// Render our profile page again to show errors
			return res.render('profile', {
				fData: user,
				title : appConstants.APP_NAME + " - Edit Profile"
			});
		}

		// Make sure the provided existing username/email matches what we have in the DB if we have a new address populated
		if (req.body.new_username.trim() !== "") {
			if (req.body.username === user.username[0]) {
				user.username = req.body.new_username;
			} else {
				errorProcessor({name:"CustomError", message: 'Email address does not match existing.'}, req);
			}
		}

		user.forename = req.body.forename;
		user.surname = req.body.surname;
		user.bjcp_id = req.body.bjcp_id;
		user.bjcp_rank = req.body.bjcp_rank;
		user.cicerone_rank = req.body.cicerone_rank;
		user.pro_brewer_brewery = req.body.pro_brewer_brewery;
		user.industry_description = req.body.industry_description;
		user.judging_years = req.body.judging_years;

		// If the user provided both "new" password and confirm password we are changing the password
		if (req.body.new_password.length > 0 && req.body.new_passwordC.length > 0 && req.body.current_password.length > 0) {
			if (req.body.new_password !== req.body.new_passwordC) {
				errorProcessor({name:"CustomError", message: 'Passwords do not match.'}, req);
			}
		}

		// At this point if there are any errors they need to be shown and fixed BEFORE trying to save
		if (hasError) {
			// Reset the trigger
			hasError = false;
			// Render our profile page again to show errors
			return res.render('profile', {
				user: user,
				title : appConstants.APP_NAME + " - Edit Profile"
			});
		}

		/** We use a promise chain for this portion because of the firing order of the change password function **/
		user.changePassword(req.body.current_password, req.body.new_password)
			/** our changePassword promise was sucessful **/
			.then(function(result){
				// Finally show the profile edit page again.
				req.flash("success", 'Profile edit successful!');
				return res.render('profile', {
					user: user,
					title : appConstants.APP_NAME + " - Edit Profile"
				});
			})
			/** Promise chain error function **/
			.then(undefined, function(err){
				// If we get an error from the changePassword promise make sure we were trying to change the password to begin with
				if (req.body.new_password.length > 0 && req.body.new_passwordC.length > 0 && req.body.current_password.length > 0) {
					// Password change fired errors go back and fix them
					errorProcessor(err, req);
					return res.render("profile", {
						user : user,
						title : appConstants.APP_NAME + " - Edit Profile"
					});
				} else {
					// Try and just do a plain save of the user profile
					// Default save of the user without password change
					user.save(function (err) {
						// Something went wrong...
						if (err) {
							// Push the processed errors to the flash handler
							errorProcessor(err, req);
							return res.render("profile", {
								user : user,
								title : appConstants.APP_NAME + " - Edit Profile"
							});
						}

						// Finally show the profile edit page again.
						req.flash("success", 'Profile edit successful!');
						return res.render('profile', {
							user: user,
							title : appConstants.APP_NAME + " - Edit Profile"
						});
					});
				}
			});
	});
};

module.exports = userController;