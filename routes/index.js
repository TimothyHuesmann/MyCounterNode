var express = require('express');
var router = express.Router();

var fs = require('fs');
var schedule = require('node-schedule');
var firebase = require('firebase');
var RiotApi = require('riot-api');

var riot = new RiotApi('6778425b-daf6-4633-b583-64ca87e5f6cf');

var ref = new Firebase("https://mycounter-app.firebaseio.com");
var usersRef = ref.child("user");

//base get function
router.get('/', function(req, res, next)
{
	res.send("Welcome to MyCounter");
})


//user inputs username to create account or retrieve account
router.get('/login/:username/:region', function(req,res,next)
{
	var tempUsername = req.params.username;
	var tempRegion = req.params.region;
	usersRef.once("value", function(snapshot){
		if(snapshot == null)
		{
			/*
			riot.getSummoner({
				'region': tempRegion,
				'summonerName': tempUsername
			},
			function(data)
			{
				res.send(data);
			});
			*/
			res.send("Here");
		}
		else
		{

		}
	})
})

module.exports = router;
