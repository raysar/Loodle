var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../controllers/user');
var Vote = require('../controllers/vote');
var Loodle = require('../controllers/loodle');
var Schedule = require('../controllers/schedule');

// GET =====================================================

// PAGES ===================

// Home 
router.get('/', isAuthenticated, function(req, res, next) {
	res.render('index', {
		message: req.flash()
	});
});

// Login
router.get('/login', function (req, res) {
	res.render('login', {
		message: req.flash()
	});
});

// Sign up 
router.get('/sign-up', function (req, res) {
	res.render('sign-up');
});

// Logout
router.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/login');
});

// New loodle
router.get('/new-doodle', isAuthenticated, function (req, res) {
	res.render('new-doodle');
});

// Loodle page
router.get('/loodle/:id', isAuthenticated, function (req, res) {
	res.render('loodle', {
		message: req.flash()
	});
});

// Add schedule page
router.get('/loodle/:id/schedule', isAuthenticated, function (req, res) {
	res.render('add-schedule');
});

// Add user page
router.get('/loodle/:id/user', isAuthenticated, function (req, res) {
	res.render('add-user');
});

// DATA ======================

// Get user data
router.get('/data/user', isAuthenticated, function (req, res) {
	User.get(req.user.id, function (err, user) {
		if (err)
			throw new Error(err);

		res.json({
			type: true,
			data: user
		});
	})
});

// Get loodle data
router.get('/data/loodle/:id', isAuthenticated, Loodle.get);

// Loodles list data
router.get('/data/loodle/', isAuthenticated, Loodle.getLoodlesOfUser);

// POST ====================================================

// Process login 
router.post('/login', passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true,
	successFlash: true
}));

// Process sign-up
router.post('/sign-up', passport.authenticate('local-signup', {
	successRedirect: '/',
	failureRedirect: '/sign-up',
	failureFlash: true,
    successFlash: true
}));

// Process new doodle
router.post('/new-doodle', isAuthenticated, function (req, res) {
	
	Loodle.createLoodle(req.user.id, req.body.name, req.body.description, function (err, data) {
		if (err) 
			throw err;

		res.redirect('/loodle/' + data.id);
	})
});

// Process add schedule
router.post('/loodle/:id/schedule', isAuthenticated, function (req, res) {

	// Create the schedule
	// Bind it to the loodle
	// Create the default votes according to the schedule
	
	Schedule.createSchedule(req.params.id, req.body.begin_time, req.body.end_time, function (err, data) {
		if (err)
			throw new Error(err);
		
		req.flash('success', 'Schedule added');
		res.redirect('/loodle/' + req.params.id);

	});
	
});

router.put('/vote', function (req, res) {

	Vote.updateVotes(req.body.votes, function (err) {

		console.log("Error : ", err);

		if (err)
			throw new Error;

		res.json({
			type: true,
			data: "success"
		});
	});

});


// PUT =====================================================


// DEL =====================================================


function isAuthenticated (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

module.exports = router;
