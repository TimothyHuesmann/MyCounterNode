var express = require('express');
var router = express.Router();

var fs = require('fs');
var schedule = require('node-schedule');
var firebase = require('firebase');
var apiKey = '6778425b-daf6-4633-b583-64ca87e5f6cf';

var ref = new Firebase("https://mycounter-app.firebaseio.com");
var usersRef = ref.child("user");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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
	usersRef.on("value", function(snapshot){
		if(snapshot == null)
		{
			res.send("ERROR: NO DATA");
		}
		else
		{
			var exists = false;
			var obj = snapshot.val();
			var exists = snapshot.child(tempUsername).exists();
			

			if(snapshot.child(tempUsername) == true)
			{

			}
			else
			{
				var query = 'https://global.api.pvp.net/api/lol/'+tempRegion+'/v1.4/summoner/by-name/'+tempUsername+'?api_key='+apiKey;
				var jsonObj = JSON.parse(Get(query));
				
				
			}
			
		}
	})
})


function Get(yourUrl) {
	var Httpreq = new XMLHttpRequest(); // a new request
	Httpreq.open("GET",yourUrl,false);
	Httpreq.send(null);
	return Httpreq.responseText;
}

module.exports = router;
