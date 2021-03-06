var async    = require('async');
var bcrypt   = require('bcrypt-nodejs');
var Schedule = require('../models/schedule.model');

var Vote     = require('../controllers/vote');
var moment   = require('moment');

/** @class ScheduleController */
var ScheduleController = {};

// Standard call function to send back data in json
function reply (res, err, data) {

    if (err) {
        res.status(500);
        return res.json({"data": err})
    }

    return res.json({"data": data});
}

/**
 * Delete a schedule
 * 
 * @param  {uuid}   	schedule_id 	Schedule identifier
 * @param  {Function} 	callback    	Standard callback function
 */
ScheduleController.delete = function (schedule_id, callback) {

	Schedule.delete(schedule_id, callback);

};

/**
 * Delete the votes of the schedule on the loodle
 * 
 * @param  {uuid}   	schedule_id 	Schedule identifier
 * @param  {uuid}   	loodle_id   	Loodle identifier
 * @param  {Function} 	callback    	Standard callback function
 */
ScheduleController.deleteVotes = function (schedule_id, loodle_id, callback) {

	async.series({

        // Delete the votes
        deleteVotes: function (done) {
            async.waterfall([
                // Get the vote ids of the schedule in the loodle
                function (end) {
                    Schedule.getVoteIds(schedule_id, loodle_id, end);
                },
                // Delete votes
                function (vote_ids, end) {
                    async.each(vote_ids, Vote.delete, end);
                }
            ], done);
        },

        // Delete the votes associations
        deleteAssociations: function (done) {
            Vote.removeAssociationsBySchedule(loodle_id, schedule_id, done);
        }

    }, callback);

};

/**
 * Create the schedule and bind it to the loodle
 * 
 * @param  {String}   loodle_id  	Loodle identifier
 * @param  {String}   begin_time 	Begin time of the schedule to create
 * @param  {String}   end_time   	End time of the schedule to create
 * @param  {String}   lang       	Locale language
 * @param  {Function} callback   	Standard callback function
 */
ScheduleController.createSchedule = function (loodle_id, begin_time, end_time, lang, callback) {

	var moment_begin_time,
		moment_end_time;

	// We are forced to adapt the creation of moment object according to the language
	// otherwise it works but creates random dates by confusing date informations
	if (lang == 'en') {
		moment_begin_time = moment(begin_time, 'MM-DD-YYYY LT');
		moment_end_time = moment(end_time, 'MM-DD-YYYY LT');
	}
	else if (lang == 'fr') {
		moment_begin_time = moment(begin_time, 'DD-MM-YYYY HH:mm');
		moment_end_time = moment(end_time, 'DD-MM-YYYY HH:mm');
	}
	else {
		return callback(new Error('Unknown language'));
	}

	var schedule = new Schedule(moment_begin_time.format(), moment_end_time.format());

	async.parallel({
		// Save the schedule
		save: function (done) {
			schedule.save(done);
		},
		// Bind the schedule to the loodle
		bind: function (done) {
			Schedule.bindLoodle(loodle_id, schedule.id, done);
		},
		// Create the default vote for this schedule
		defaultVotes: function (done) {
			Vote.createDefaultVotesForSchedule(loodle_id, schedule.id, done);
		}
	}, function (err, results) {

		if (err)
			return callback(err)
		
		return callback(null, results.save);
	});

};

/**
 * Delete the specified schedule
 * 
 * @param  {String}   loodle_id   	Loodle identifier
 * @param  {String}   schedule_id 	Schedule identifier
 * @param  {Function} callback    	Standard callback function
 */
ScheduleController.remove = function (loodle_id, schedule_id, callback) {

	async.parallel({
		// Delete the schedule and its association with the loodle
		deleteSchedule: function (done) {
			Schedule.remove(loodle_id, schedule_id, done);
		},
		// Delete the votes associated for each user of the loodle
		deleteVotes: function (done) {
			Vote.deleteVotesFromSchedule(loodle_id, schedule_id, done);
		}
	}, callback);

};

module.exports = ScheduleController;