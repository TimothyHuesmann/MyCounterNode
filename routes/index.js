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
	var query = 'https://global.api.pvp.net/api/lol/'+tempRegion+'/v1.4/summoner/by-name/'+tempUsername+'?api_key='+apiKey;
	var jsonObj = JSON.parse(Get(query));			
	if(jsonObj.status != null)							//Checking if the username exists in League of Legends
	{
		console.log('not found');
		console.log(jsonObj);
	}
	else
	{
		var lowerUser = tempUsername.toLowerCase();
		var summonerID = jsonObj[lowerUser].id;
		console.log(summonerID);
		usersRef.on("value", function(snapshot){		//Checking to see if username exists in Firebase already
		if(snapshot == null)	//Firebase has an error
		{
			res.send("ERROR: NO DATA");			
		}
		else	//Data gathered
		{
			var obj = snapshot.val();
		
			if(snapshot.child(tempUsername).exists() == true) //username exists in the database -> proceed to login
			{
				var region = tempRegion.toLowerCase();
				
				usersRef.child(tempUsername).on("value", function(snapshot2)
				{
					res.send(snapshot2.val().statistics);
				})

			}
			else //username doesn't exist in databse, create user account then login
			{
				var region = tempRegion.toLowerCase();
				var query2 = 'https://global.api.pvp.net/api/lol/static-data/'+region+'/v1.2/champion?api_key='+apiKey;
				console.log(query2);
				var champJSON = JSON.parse(Get(query2));
				if(champJSON.status != null)
				{
					console.log("Error");					//No data found or error (most likely an error)
					console.log(champJSON);
				}
				else
				{	
					var championString = '{"Champion Data":{';
					for(var i = 0; i<Object.keys(champJSON.data).length;i++)	//starts the JSON string creation
					{
						championString+= '"' + Object.keys(champJSON.data)[i] + '"' + ':{"with":{';
						for(var j=0; j<Object.keys(champJSON.data).length;j++)   //builds the "Playing with" part of the JSON String
						{
							championString+= '"' + Object.keys(champJSON.data)[j] + '"' + ':"0-0"';
							if(j != Object.keys(champJSON.data).length-1)
							{
								championString+=',';
							}
						}
						championString+= '}, "against":{';
						for(var k=0; k<Object.keys(champJSON.data).length;k++) //builds the "playing against" part of the JSON String
						{
							championString+= '"' + Object.keys(champJSON.data)[k] + '"' + ':"0-0"';
							if(k != Object.keys(champJSON.data).length-1)
							{
								championString+=',';
							}
						}
						championString+='}}';
						if(i != Object.keys(champJSON.data).length-1)
						{
							championString+=',';
						}
						
					}

					championString+= '}}';

					var query3 = 'https://global.api.pvp.net/api/lol/' + tempRegion.toLowerCase() + '/v1.3/stats/by-summoner/' + summonerID + '/summary?api_key=' + apiKey;
					var statsJSON = JSON.parse(Get(query3));
					console.log(statsJSON.playerStatSummaries);
					var totalWins = parseInt(statsJSON.playerStatSummaries[7].wins) + parseInt(statsJSON.playerStatSummaries[9].wins);
					var totalKills = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalChampionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalChampionKills);
					var totalCS = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalNeutralMinionsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalNeutralMinionsKilled);
					var totalTurrets = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalTurretsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalTurretsKilled);
					var totalAssists = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalAssists) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalAssists);
					
					statisticsString = '{"stats": {"wins":'+ totalWins + ',"kills":'+totalKills+',"cs":' + totalCS+',"totalTurrets":'+totalTurrets+',"totalAssists":'+totalAssists+'}}';
					
					usersRef.child(tempUsername).set({
							championData: championString,
							region: tempRegion,
							statistics: statisticsString	
					});
					
					res.send(statisticsString);

				}
			}
			
		}
	})
	}
	
})


function Get(yourUrl) {
	var Httpreq = new XMLHttpRequest(); // a new request
	Httpreq.open("GET",yourUrl,false);
	Httpreq.send(null);
	return Httpreq.responseText;
}

function createFirebaseAccount(username, region)
{
	
}

module.exports = router;
