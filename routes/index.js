var express = require('express');
var router = express.Router();
var cron = require('cron');
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
			/*	
				usersRef.child(tempUsername).on("value", function(snapshot2)
				{
					res.send(snapshot2.val().statistics);
				})
				updateStats(summonerID, tempRegion, tempUsername);
			*/
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
					usersRef.child(tempUsername).set({
							region: tempRegion,
							summonerId: summonerID,
							gamesList: '',
							username: tempUsername	
					});

					championDataRef = usersRef.child(tempUsername).child("championData");

					for(var i = 0; i < Object.keys(champJSON.data).length;i++)
					{
						var tempChamp = Object.keys(champJSON.data)[i];
					}
					for(var g = 0; g < Object.keys(champJSON.data).length;g++)
					{
						var tempBaseChamp = Object.keys(champJSON.data)[g];
						var champWithRef = championDataRef.child(tempChamp).with;
						for(var k = 0; k < Object.keys(champJSON.data).length;k++)
						{
							var tempWithChamp = Object.keys(champJSON.data)[k];
							var tempChampWithRef = new Firebase("https://mycounter-app.firebaseio.com/user/" + tempUsername + "/championData/" + tempBaseChamp + "/with/" + tempWithChamp);
							tempChampWithRef.set('0-0-0-0');
						}		
					}

					var query3 = 'https://global.api.pvp.net/api/lol/' + tempRegion.toLowerCase() + '/v1.3/stats/by-summoner/' + summonerID + '/summary?api_key=' + apiKey;
					var statsJSON = JSON.parse(Get(query3));
					console.log(statsJSON.playerStatSummaries);
					var totalWins = parseInt(statsJSON.playerStatSummaries[7].wins) + parseInt(statsJSON.playerStatSummaries[9].wins);
					var totalKills = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalChampionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalChampionKills);
					var totalCS = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalNeutralMinionsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalNeutralMinionsKilled);
					var totalTurrets = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalTurretsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalTurretsKilled);
					var totalAssists = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalAssists) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalAssists);
					
					//statisticsString = '{"stats": {"wins":'+ totalWins + ',"kills":'+totalKills+',"cs":' + totalCS+',"totalTurrets":'+totalTurrets+',"totalAssists":'+totalAssists+'}}';
					
					usersRef.child(tempUsername).child("statistics").set({
						wins: totalWins,
						kills: totalKills,
						CS: totalCS,
						Turrets: totalTurrets,
						Assists: totalAssists
					});
					
					res.send(usersRef.child(tempUsername.statistics));

					//updateStats(summonerID, tempRegion, tempUsername);
				
				}
			}
			
		}
	})
	}
	
})

router.get("/counterAgainst/:username")
{

}

router.get("/counterWith/:username")
{

}

function Get(yourUrl) 
{
	var Httpreq = new XMLHttpRequest(); // a new request
	Httpreq.open("GET",yourUrl,false);
	Httpreq.send(null);
	return Httpreq.responseText;
}

function updateStats(userID, region, username)
{
	var query4 = 'https://global.api.pvp.net/api/lol/' + region.toLowerCase() + '/v1.3/game/by-summoner/' + userID + '/recent?api_key=' + apiKey;
	console.log(query4);
	var gamesJSON = JSON.parse(Get(query4));
	console.log(gamesJSON);
	var teams = [];
	var teamChamps = [];
	var enemyChamps = [];
	var teamNames = [];
	var enemyNames = [];
	var win = true;
	usersRef.child(username).on("value", function(snapshot)
	{
		var userChampStats = snapshot.val().championData;
		console.log(userChampStats['championStats']);
		for(var i = 0; i< Object.keys(gamesJSON.games).length;i++)
		{
			var meQuery = 'https://global.api.pvp.net/api/lol/static-data/' + region.toLowerCase() + '/v1.2/champion/' + gamesJSON.games[i].championId + '?api_key=' + apiKey;
			var meJSON = JSON.parse(Get(meQuery));
			var me = meJSON.key;
			console.log(me);
			myTeam = gamesJSON.games[i].teamId;
			win = gamesJSON.games[i].stats.win;
			console.log(myTeam);
			for(var j = 0; j< 9;j++)
			{
				if(gamesJSON.games[i].fellowPlayers[j].teamId == myTeam)
				{
					var champQuery = 'https://global.api.pvp.net/api/lol/static-data/' + region.toLowerCase() + '/v1.2/champion/' + gamesJSON.games[i].fellowPlayers[j].championId + '?api_key=' + apiKey;
					var tempJSON = JSON.parse(Get(champQuery));
					teamNames.push(tempJSON.key);
				}
				else
				{
					var champQuery = 'https://global.api.pvp.net/api/lol/static-data/' + region.toLowerCase() + '/v1.2/champion/' + gamesJSON.games[i].fellowPlayers[j].championId + '?api_key=' + apiKey;
					var tempJSON = JSON.parse(Get(champQuery));
					enemyNames.push(tempJSON.key);
				}
			}
			var champStatsRef = new Firebase("https://mycounter-app.firebaseio.com/users/" + username);
			if(win == true)
			{

				for(var k = 0; k< teamNames.length;k++)
				{
					
					//console.log(userChampStats.ChampionData[me].with[teamNames[k]])
				}
				for(var g = 0; g < enemyNames.length;g++)
				{

				}
			}
			else
			{
				for(var k = 0; k< teamNames.length;k++)
				{
					
				}
				for(var g = 0; g < enemyNames.length;g++)
				{
					
				}
			}
			teamNames = [];
			enemyNames = [];
		}

	})

}

var cronJob = cron.job("0 0 * * * *", function()
{
	usersRef.forEach(function(childSnapshot){
		var tempUser = childSnapshot.summonerID;
		var tempR = childSnapshot.region;
		var username = childSnapshot.username;
		updateStats(tempUser, tempR, username);
	});
});
cronJob.start();

module.exports = router;
