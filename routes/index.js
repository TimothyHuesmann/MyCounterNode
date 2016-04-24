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
			
				updateStats(summonerID, tempRegion, tempUsername);
				//res.send("success response")

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

					updateStats(summonerID, tempRegion, tempUsername);
					

					var query3 = 'https://global.api.pvp.net/api/lol/' + tempRegion.toLowerCase() + '/v1.3/stats/by-summoner/' + summonerID + '/summary?api_key=' + apiKey;
					var statsJSON = JSON.parse(Get(query3));
					console.log(statsJSON.playerStatSummaries);
					var totalWins = parseInt(statsJSON.playerStatSummaries[7].wins) + parseInt(statsJSON.playerStatSummaries[9].wins);
					var totalKills = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalChampionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalChampionKills);
					//var totalCS = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalNeutralMinionsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalNeutralMinionsKilled);
					var totalTurrets = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalTurretsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalTurretsKilled);
					var totalAssists = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalAssists) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalAssists);
					
					//statisticsString = '{"stats": {"wins":'+ totalWins + ',"kills":'+totalKills+',"cs":' + totalCS+',"totalTurrets":'+totalTurrets+',"totalAssists":'+totalAssists+'}}';
					
					usersRef.child(tempUsername).child("statistics").set({
						wins: totalWins,
						kills: totalKills,
						//CS: totalCS,
						Turrets: totalTurrets,
						Assists: totalAssists
					});
					
					res.send("success response");
				
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
	var gamesJSON = JSON.parse(Get(query4));
	var games = [];
	var teamChamps = [];
	var enemyChamps = [];
	var teamWinNames = [];
	var enemyWinNames = [];
	var teamLostNames = [];
	var enemyLostNames = [];
	var win = [];
	var meWinList = [];
	var meLoseList = [];
	usersRef.child(username).on("value", function(snapshot)
	{
		var userChampStats = snapshot.val().championData;
		for(i = 0; i< 10;i++)
		{
			if(gamesJSON.games[i].subType == "NORMAL" || gamesJSON.games[i].subType == "RANKED_SOLO_5x5")
			{
				win.push(gamesJSON.games[i].stats.win);
				var recordString = '';
				var meId = gamesJSON.games[i].championId;
				var myTeam = gamesJSON.games[i].teamId;
		
				if(win[i] == true)
				{
					meWinList.push(meId);
				}
				else
				{
					meLoseList.push(meId);
				}
				//console.log(me);
				//console.log(win);
				//console.log(teamWinNames);
				//console.log(teamLostNames);
				//console.log(enemyWinNames);
				//console.log(enemyLostNames);
				for(var g = 0; g < 9; g++)
				{
					if(win[i] == true)
					{
						if(gamesJSON.games[i].fellowPlayers[g].teamId == myTeam)
						{
							//console.log("Win-MyTeam");
							var tempChamp = gamesJSON.games[i].fellowPlayers[g].championId;
							teamWinNames.push(tempChamp);
						}
						else
						{
							//console.log("Win-OtherTeam");
							var tempChampID = gamesJSON.games[i].fellowPlayers[g].championId;
							enemyWinNames.push(tempChampID);
						}
					}
					else
					{
						if(gamesJSON.games[i].fellowPlayers[g].teamId == myTeam)
						{
							//console.log("Lose-MyTeam");
							var tempChampID = gamesJSON.games[i].fellowPlayers[g].championId;
							teamLostNames.push(tempChampID);
						}
						else
						{
							//console.log("Lose-OtherTeam");
							var tempChampID = gamesJSON.games[i].fellowPlayers[g].championId;
							enemyLostNames.push(tempChampID);
						}
					}
					
				}
			
			}
		

		}
		var j = 0;
		var k = 0;
		var l = 0;
		var m = 0;
		var setDict = {};
		for(var h = 0; h < teamWinNames.length; h++)
		{
			console.log(j);
			console.log(h);
			console.log(meWinList[j]);
			var tempRef = new Firebase("https://mycounter-app.firebaseio.com/user/" + username + "/championData");
			var tempName = teamWinNames[h];
			tempRef.once("value", function (teamWinSnapshot)
			{
				var exists = teamWinSnapshot.child(meWinList[j] + '/' + tempName).exists();
				console.log(exists);
				if(exists == true)					
				{
					console.log("Here");
					var tempVal = teamWinSnapshot.child(meWinList[j] + '/' + tempName).val();
					console.log(tempVal);
					//var tempValue = obj[tempname][tempchamp];
					//console.log(tempValue);
				}
				else
				{
					setDict[tempName] = '1-0-0-0';
					console.log(setDict);
				}
					
			});
			if(h != 0 && (h+1)%4 == 0)
			{
				j++;
			}
		}
		sendUpdate(setDict, username);
		

	});

}

var cronJob = cron.job("0 0 * * * *", function()
{
	
});
cronJob.start();

function sendUpdate(data, username)
{
	var tempRef = new Firebase("https://mycounter-app.firebaseio.com/user/" + username + "/championData");
	tempRef.push().update(data);
}

module.exports = router;
