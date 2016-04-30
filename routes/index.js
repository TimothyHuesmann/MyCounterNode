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
var statisticsString = "";

var cronJob = cron.job("0 0 * * * *", function()
{
	updateStats(28694383, 'na', 'ZeroConsortium');    //Used for testing purposes only! Change to be multi-user so that it updates all accounts later.
});
cronJob.start();

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
				getStats(tempRegion, summonerID);
				res.send(statisticsString)

			}
			else //username doesn't exist in databse, create user account then login
			{
				var region = tempRegion.toLowerCase();
				var query2 = 'https://global.api.pvp.net/api/lol/static-data/'+region+'/v1.2/champion?api_key='+apiKey;
				//console.log(query2);
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
					getStats(tempRegion, summonerID);
					
					res.send(statisticsString);
				
				}
			}
			
		}
	})
	}
	
})

router.get("/counterAgainst/:username/:champion", function(req, res, next)
{
	var username = req.params.username;
	var champion = req.params.champion;
	var championRef = new Firebase("https://mycounter-app.firebaseio.com/user/" + username + "/champData");
	var topThree = {};
	championRef.once("value", function(snapshot)
	{
		snapshot.forEach(function(childSnapshot)
		{
			if(childSnapshot.child(champion).exists() == true)
			{
				tempRecords = childSnapshot.child(champion).val().split('-');
				tempRecord = tempRecords[2];
				tempName = childSnapshot.key();

				if(topThree[0] != null)
				{
					if(parseInt(topThree[0]["number"]) <= tempRecord)
					{
						topThree[2] = topThree[1];
						topThree[1] = topThree[0];
						topThree[0] = {"name":tempName, "record":tempRecord};
					}
					else
					{ 
						if(topThree[1] != null)
						{
							if(parseInt(topThree[1]["number"]) <= tempRecord)
							{
								topThree[2] = topThree[1];
								topThree[1] = {"name":tempName, "record":tempRecord};
							}
							else
							{
								if(topThree[2] != null)
								{
									if(parseInt(topThree[2]["number"]) <= tempRecord)
									{
										topThree[2] = {"name":tempName, "record":tempRecord};
									}
								}
								else
								{
									if(tempRecord != 0)
									{
										topThree[2] = {"name":tempName, "record":tempRecord};
									}
								}
							}
						}
						else
						{
							if(tempRecord != 0)
							{
								topThree[1] = {"name":tempName, "record":tempRecord};
							}
						}
						
					}
				}
				else
				{
					if(tempRecord != 0)
					{
						topThree[0] = {"name":tempName, "record":tempRecord};
					}
				}
			}
		});
		if(topThree != null)
		{
			res.send(topThree);
		}
		else
		{
			res.send("No Data Availible");
		}
	});
})

router.get("/counterWith/:username/:champion", function(req, res, next)
{
	var username = req.params.username;
	var champion = req.params.champion;
	var championRef = new Firebase("https://mycounter-app.firebaseio.com/user/" + username + "/champData");
	var topThree = {};
	championRef.once("value", function(snapshot)
	{
		snapshot.forEach(function(childSnapshot)
		{
			if(childSnapshot.child(champion).exists() == true)
			{
				tempRecords = childSnapshot.child(champion).val().split('-');
				tempRecord = tempRecords[0];
				tempName = childSnapshot.key();

				if(topThree[0] != null)
				{
					if(parseInt(topThree[0]["number"]) <= tempRecord)
					{
						topThree[2] = topThree[1];
						topThree[1] = topThree[0];
						topThree[0] = {"name":tempName, "record":tempRecord};
					}
					else
					{ 
						if(topThree[1] != null)
						{
							if(parseInt(topThree[1]["number"]) <= tempRecord)
							{
								topThree[2] = topThree[1];
								topThree[1] = {"name":tempName, "record":tempRecord};
							}
							else
							{
								if(topThree[2] != null)
								{
									if(parseInt(topThree[2]["number"]) <= tempRecord)
									{
										topThree[2] = {"name":tempName, "record":tempRecord};
									}
								}
								else
								{
									if(tempRecord != 0)
									{
										topThree[2] = {"name":tempName, "record":tempRecord};
									}
								}
							}
						}
						else
						{
							if(tempRecord != 0)
							{
								topThree[1] = {"name":tempName, "record":tempRecord};
							}
						}
						
					}
				}
				else
				{
					if(tempRecord != 0)
					{
						topThree[0] = {"name":tempName, "record":tempRecord};
					}
				}
			}
		});
		if(topThree[0] != null)
		{
			res.send(topThree);
		}
		else
		{
			res.send("No Data Available");
		}
	});
})

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
	var teamNames = [];
	var enemyNames = [];
	var win = false;
	var data = null;
	usersRef.child(username).on("value", function(snapshot)
	{
		var userChampStats = snapshot.val().championData;
			if(gamesJSON.games[0].subType == "NORMAL" || gamesJSON.games[0].subType == "RANKED_SOLO_5x5")
			{
				var gameID = gamesJSON.games[0].gameId;
				if(snapshot.val().game == gameID){}
				else{
				win = gamesJSON.games[0].stats.win;
				var recordString = '';
				var meId = gamesJSON.games[0].championId;
				var myTeam = gamesJSON.games[0].teamId;
				var meQuery = 'https://global.api.pvp.net/api/lol/static-data/' + region.toLowerCase() + '/v1.2/champion/' + meId + '?api_key=' + apiKey;
				var meJSON = JSON.parse(Get(meQuery));
				var me = meJSON.key;
				for(var g = 0; g < 9; g++)
				{
					if(gamesJSON.games[0].fellowPlayers[g].teamId == myTeam)
					{
						//console.log("Win-MyTeam");
						var tempChamp = gamesJSON.games[0].fellowPlayers[g].championId;
						var teamQuery = 'https://global.api.pvp.net/api/lol/static-data/' + region.toLowerCase() + '/v1.2/champion/' + tempChamp + '?api_key=' + apiKey;
						teamJSON = JSON.parse(Get(tempQuery));
						tempName = teamJSON.key;
						if(snapshot.child('champData').child(me).child(tempName).exists() == true)
						{
							var tempRecord = snapshot.child('champData').child(me).child(tempName);
							var records = tempRecord.split('-');
							if(win == true)
							{
								data[tempName] = (parseInt(records[0]) + 1) +'-'+ records[1] +'-'+ records[2] +'-'+ records[3];
							}
							else
							{
								data[tempName] = records[0] +'-'+ (parseInt(records[1]) + 1) +'-'+ records[2] +'-'+ records[3];
							}
						}
						else
						{
							if(win == true)
							{
								data[tempName] = '1-0-0-0';
							}
							else
							{
								data[tempName] = '0-1-0-0';
							}
						}
					}
					else
					{
						//console.log("Win-OtherTeam");
						var tempChampID = gamesJSON.games[0].fellowPlayers[g].championId;
						var enemyQuery = 'https://global.api.pvp.net/api/lol/static-data/' + region.toLowerCase() + '/v1.2/champion/' + tempChampID + '?api_key=' + apiKey;
						enemyJSON = JSON.parse(Get(enemyQuery));
						tempName = enemyJSON.key;
						if(snapshot.child('champData').child(me).child(tempName).exists() == true)
						{
							var tempRecord = snapshot.child('champData').child(me).child(tempName);
							var records = tempRecord.split('-');
							if(win == true)
							{
								data[tempName] = records[0] +'-'+ records[1] +'-'+ (parseInt(records[2]) + 1) +'-'+ records[3];
							}
							else
							{
								data[tempName] = records[0] +'-'+ records[1] +'-'+ records[2] +'-'+ (parseInt(records[3]) + 1);
							}
						}
						else
						{
							if(win == true)
							{
								data[tempName] = '0-0-1-0';
							}
							else
							{
								data[tempName] = '0-0-0-1';
							}
						}
					}
				}
			}
		}
		if(data == null){}
		else
		{
			sendUpdate(data, me, username);
		}
	});
}




function sendUpdate(data, champ, username)
{
	var tempRef = new Firebase("https://mycounter-app.firebaseio.com/user/" + username + "/championData/" + champ);
	tempRef.update(data);
}

function getStats(region, summonerID)
{
	var query3 = 'https://global.api.pvp.net/api/lol/' + region.toLowerCase() + '/v1.3/stats/by-summoner/' + summonerID + '/summary?api_key=' + apiKey;
	var statsJSON = JSON.parse(Get(query3));
	//console.log(statsJSON.playerStatSummaries);
	var totalWins = parseInt(statsJSON.playerStatSummaries[7].wins) + parseInt(statsJSON.playerStatSummaries[9].wins);
	var totalKills = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalChampionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalChampionKills);
	//var totalCS = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalNeutralMinionsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalMinionKills) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalNeutralMinionsKilled);
	var totalTurrets = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalTurretsKilled) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalTurretsKilled);
	var totalAssists = parseInt(statsJSON.playerStatSummaries[7].aggregatedStats.totalAssists) + parseInt(statsJSON.playerStatSummaries[9].aggregatedStats.totalAssists);
					
	statisticsString = '{"stats": {"wins":'+ totalWins + ',"kills":'+totalKills+',"totalTurrets":'+totalTurrets+',"totalAssists":'+totalAssists+'}}';
}

module.exports = router;
