/*********

Run thus:

  node server.js [debug] 1> log.out 2> err.out

This new version doesn't do much, other than let an admin stream to 
everyone else. This is how it should have always worked. Participants
are limited to sending stuff, we stream very little to them other than
things that originate from the admin. Push the complexity to the 
presentation app.

This is completely in-memory and stateless. That means if you restart
Node, you will need to reauthenticate. That's how I want it for now.

***********/

'use strict';

// with express:
// var express = require('express');
// var app = express();
// var http = require('http').Server(app);
// #var io = require('socket.io')(http);
// http.listen(3000);


// with node http:
//var app = require('http').createServer(handler)
//var io = require('socket.io')(app);
//app.listen(3000);

// standalone:
var io = require('socket.io')(3000);
//var mongodb = require('mongodb').MongoClient;
var assert = require('assert');

var MARKLIMIT = 5; // max votes/marks per section
var RANDOM_IDS = false; // make every vote and mark a random ID to allow for testing.
var usercount = 0; // a count of users
var users = new Object(); // a list of users
var browsers = new Object(); // a list of the browsers
var admins = new Object(); // authenticated clients
var passwords = ['dummypass'];
var followers = new Object;
var correct;
var score = new Object;
var db;

// the initial user message.
var lastcontent = { aside: "This session has not begun. Please wait." };
var lastvote = 0;
var meta = 0;
var lastfollow = 0;
var voteStartTime = 0;

var votes = {};
var voted = {};
var answers = {};

var DEBUG = process.argv[2] == 'debug' ? true : false;

reset();
function reset() {
    correct = null;
    score = new Object;
    lastcontent = { aside: "This session has not begun. Please wait." };
    lastvote = 0;
    meta = 0;
    lastfollow = 0;
    voteStartTime = 0;

    votes = {};
    voted = {};
    answers = {};
}

// console.log(DEBUG);

// app.use(express.static(__dirname + '/site/'));

function handler (req, res) {
}

io.on("connect_failed", function() {
    console.log("failure");
});

mongodb.connect('mongodb://localhost:27017/quiz', 
  function(err, newdb) {
    assert.equal(null, err);
    console.log('Connected to MongoDB server');
    db = newdb;
  }
);

//of('/danny')
var everyone = io.of('/danny').on('connection', function(socket) {
    socket.on("disconnect", function() {
    
	if (DEBUG) { console.log("disconnect"); }
    });
  
    console.log("connection");
    
	socket.on('key', function(data) {
		
            var users = db.collection('users');
            data.date = new Date();
            users.update(
                { key : data.key },    // match these docs
                data,                // set this
                { upsert: true },    // insert if no matches
                function (e, r) { } // callback
            );  

		var tempkey = data.key.substring(0, 15); // 75%
		
        if (data.follow) {
            // console.log(data.follow);
            followers[tempkey] = socket;
            
            if (lastfollow) {
                socket.emit('follow', lastfollow);
            }
        }
		
        if (admins[data.key]) {
            console.log("ADMIN CONNECTION");
			admins[data.key] = socket;
			socket.emit('authenticated');
        }
        
        if (admins[data.key] || followers[tempkey]) {
            // state data needed on refresh.
			socket.emit('stats', {
				total: usercount,
				connected: Object.keys(io.sockets.connected).length
			});
			socket.emit('votes', {
				votes: votes
			});
            socket.emit('answers', {
				answers: answers
			});
			socket.emit('browsers', {
				browsers: browsers,
			});
		}
		else
		{
            if (meta) {
                //console.log('sending meta');
                socket.emit('msg', meta);
            }
			if (lastcontent) {
				//console.log("sending last content: " + lastcontent);
				socket.emit('msg', lastcontent);
			}
            if (lastvote) {
				//console.log("sending last vote: " + lastvote);
				socket.emit('msg', lastvote);
			}
		}
		
		if (users[tempkey]) {
			// console.log("REPEAT: " + data.key + ", " + Object.keys(io.sockets.connected).length + " sockets active.");
			users[tempkey].socket = socket;
            
		}
		else
		{
			// console.log("NEW: " + data.key + ", " + Object.keys(io.sockets.connected).length + " sockets active.");
			usercount++;
			users[tempkey] = {
				socket: socket
			}
            users[tempkey].votetime = 0;
            users[tempkey].votes = 0;
            users[tempkey].score = 0;
            
			browsers[tempkey] = data.browser;
		}
        
        sendToAdmins('browser', { key: tempkey, browser: data.browser });
        sendToFollowers('browser', { key: tempkey, browser: data.browser });
        sendToAdmins('stats', { total: usercount, connected: Object.keys(io.sockets.connected).length });
        sendToFollowers('stats', { total: usercount, connected: Object.keys(io.sockets.connected).length });

	});

	socket.on('disconnect', function(data) {
        sendToAdmins('stats', { total: usercount, connected: Object.keys(io.sockets.connected).length });
	});

    // meta sticks and gets sent on connect to all clients.
    socket.on('meta', function(data) {
        if (DEBUG) {
            console.log("meta: " + JSON.stringify(data));
        }
        
        // we only change this on a new presentation
        if (meta && data.content['title'] == meta['title']) {
            return; // otherwise skip it.
        }
        
        var tempkey = data.key.substring(0, 15);
		if (admins[data.key]) { // we use full key to check.
            
            // reset votes, scores, and limits.
            if ('reset' in data.content) {
                if (DEBUG) {
                    console.log("RESETTING");
                }
                delete data.content['reset'];
                reset();
            }
            
            meta = data.content;
            lastcontent = meta;
            meta.id = 'META';
            everyone.emit('msg', meta);
        }
    });
    
	// the admin event, generic.
	socket.on('msg', function(data) {
        if (DEBUG) { 
            console.log('msg: ' + JSON.stringify(data));
        }
		var tempkey = data.key.substring(0, 15);
		if (admins[data.key]) { // we use full key to check.
            if ('vote-prompt' in data.content) {
                setupVotePrompt(data.content);
                
                correct = undefined;
                if ('correct' in data.content['vote-prompt']) {
                    correct = data.content['vote-prompt'].correct;
                    delete data.content['vote-prompt'].correct;
                }
                
                lastvote = data.content; // we still need to send the whole thing! Duh.
                delete data.key;
                everyone.emit('msg', data.content);
                voteStartTime = new Date().getTime();
            }
            else if ('multiple-votes' in data.content) {
                for (var i =0; i < data.content['multiple-votes'].length; i++) {
                    setupVotePrompt(data.content['multiple-votes'][i]);
                }
                lastvote = data.content; // we still need to send the whole thing! Duh.
                delete data.key;
                everyone.emit('msg', data.content);
                if (DEBUG) {
                    console.log('SENT: ' + JSON.stringify(data.content));
                }
                voteStartTime = new Date().getTime();
            }
            else if ('vote-end' in data.content) {
                lastvote = 0;
                var voteEndTime = new Date().getTime();
                if (DEBUG) {
			         console.log('vote-end: ' + JSON.stringify(data.content));
                }
                everyone.emit('msg', data.content);
            }
            else if ('question-prompt' in data.content) {
                answers[data.content['question-prompt'].qgroup] = {};
                everyone.emit('msg', data.content);
                lastvote = data.content;
            }
            else
            {
                lastcontent = data.content;
                delete data.key;
                everyone.emit('msg', data.content);
            }
		}
	});
    
    socket.on('follow', function(data) {
        //if (DEBUG) {
        //    console.log("follow: " + JSON.stringify(data));
        //}
        var tempkey = data.key.substring(0, 15);
		if (admins[data.key]) { // we use full key to check.
            delete data.key;
            sendToFollowers('follow', data);
            lastfollow = data;
            lastfollow.hurry = true;
		}
	});
    
    socket.on('admin-msg', function(data) {
        if (admins[data.key]) {
            if ('get-winners' in data.content) {
                console.log('get-winners');
                var tempkey = data.key.substring(0, 15);
                
                if (admins[data.key]) { // we use full key to check.
                    delete data.key;

                    // sort correct answers
                    var scoreTuples = [];
                    for (var key in users) { 
                        scoreTuples.push([key, users[key]['score']]);
                        console.log('user:');
                        console.log(users[key]);
                    }
                    scoreTuples.sort(function(a, b) {
                        a = a[1];
                        b = b[1];
                        return a > b ? -1 : (a < b ? 1 : 0);
                    });

                    console.log('score tuples:');
                    console.log(scoreTuples);
                    
                    // sort time
                    var timeTuples = [];
                    for (var key in users) timeTuples.push([key, users[key]['votetime']]);
                    timeTuples.sort(function(a, b) {
                        a = a[1];
                        b = b[1];
                        return a < b ? -1 : (a > b ? 1 : 0);
                    });

                    console.log('time tuples:');
                    console.log(timeTuples);
                    
                    
                    if (meta['numwinners'] == undefined) {
                        meta['numwinners'] = 1;
                    }
                    if (meta['reqvotes'] == undefined) {
                        meta['reqvotes'] = 10;
                    }
                    
                    var winnerCount = 0;
                    var winners = {};
                    
                    // make a list of the top scorers.
                    
                    /*
                    var lastScore = 0;
                    for (var i = 0; i < scoreTuples.length; i++ ) {
                        winnerCount++;
                        lastScore = users[scoreTuples[i][0]]['score'];
                        if (winnerCount > meta.numwinners) {
                            // we only quit if we have all of the 
                            // current score. Note that if there 
                            // were no scores, this will include 
                            // the whole user list. Which is what we 
                            // want.
                            if (users[scoreTuples[i][0]]['score'] < lastScore) {
                                break;
                            }
                        }
                        scoreWinners.push(tuples[i]);
                    }
                    */
                    
                    winnerCount = 0;
                    var topscore = users[scoreTuples[0][0]]['score'];
                    
                    /* My current strategy is pretty simple; I iterate
                       based on the play times, and then limit the winners
                       to those that had the top score. This is a lot 
                        easier than trying to merge the two lsits. */
                    
                    console.log("top score: " + topscore);
                    
                    for (var i = 0; i < timeTuples.length; i++) {
                        if (!admins[timeTuples[i][0]] && !followers[timeTuples[i][0]]) {
                            if (users[timeTuples[i][0]]['votes'] >= meta['reqvotes'] && users[timeTuples[i][0]]['score'] >= topscore) {
                                winnerCount++;
                                
                                winners[timeTuples[i][0]] = { votetime: users[timeTuples[i][0]]['votetime'], score: users[timeTuples[i][0]]['score'] };
                                
                                if ('send-codes' in data.content) {
                                    // io.sockets.connected[users[tuples[i][0]].id].emit('msg', { aside: "you won!" });
                                    var congrats = "Congratulations, you won! Please come to the stage <b>now</b> to claim the prize. Your code is:<br/><br/><b>" + String(users[timeTuples[i][0]]['votetime']) + "</b><br/><br/>It will disappear soon!";
                                    users[timeTuples[i][0]].socket.emit('msg', { aside: congrats, _id: '88301094' });
                                }
                                
                                if (winnerCount >= meta.numwinners) {
                                    break;
                                }
                                
                            }
                        }
                    }
                    
                    sendToFollowers('admin-msg', { winners: winners });
                    socket.emit('admin-msg', { winners: winners });
                    console.log("winners: ");
                    console.log(winners);
                    
                }
            }
        }
    });
    
	// admin authentication
	socket.on('auth', function(data) {
        var authed = false;
		for (var i = 0; i < passwords.length; i++) {
			if (data.password == passwords[i]) {
				console.log("AUTHENTICATED");
				admins[data.key] = socket;
                authed = true;
				socket.emit('authenticated');
				socket.emit('stats', {
					total: usercount,
					connected: Object.keys(io.sockets.connected).length
				});
				socket.emit('votes', {
					votes: votes
				});
				socket.emit('browsers', {
					browsers: browsers,
				});
				break;
			}
		}
        if (!authed) {
            socket.emit('badauth');
        }
	});
	
    // client answer to question
    socket.on('answer', function(data) {
        if (DEBUG) {
            console.log("answer: " + JSON.stringify(data));
        }
        var tempkey = data.key.substring(0, 15);
        
        if (answers[data.qgroup]) {
            if (!answers[data.qgroup][tempkey]) {
                answers[data.qgroup][tempkey] = data.answer;
                sendToAdmins('answer', {
					key: tempkey,
					qgroup: data.qgroup,
					answer: data.answer
				});
                // FIXME: how are we gonna get the set value to
                // followers? What a PITA.
            }
        }
    });
    
	// the client vote event.
	socket.on('vote', function(data) {
        if (DEBUG) {
            console.log("vote: " + JSON.stringify(data));
        }
        var tempkey = data.key.substring(0, 15);
		
        /*
        if (RANDOM_IDS) {
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			tempkey = "";
			for (var i=0; i < 15; i++) {
				tempkey += possible.charAt(Math.floor(Math.random() * possible.length));
			}
		}
        */
        
		if (votes[data.votegroup]) { // && !marks[data.element][tempkey]) {
            
			if (voted[data.votegroup][tempkey]) {
                console.log("already voted!");
				return;
			}
            
            // how long they took to vote.
            users[tempkey].votetime += Number(new Date().getTime() - voteStartTime);
            // how many questions they answered.
            users[tempkey].votes++;
            
            // whether or not they answered correctly.
            if (correct) {
                if (data.vote == correct) {
                    users[tempkey].score++;
                }
            }
                    
			voted[data.votegroup][tempkey] = data.vote;
			if (!votes[data.votegroup][data.vote]) {
				votes[data.votegroup][data.vote] = 0;
			}
			votes[data.votegroup][data.vote]++;
            
            sendToAdmins('vote', {
					key: tempkey,
					votegroup: data.votegroup,
					vote: data.vote
				});
            sendToFollowers('vote', {
					key: tempkey,
					votegroup: data.votegroup,
					vote: data.vote
				});
		}
	});

});

process.on('SIGINT', function() {
	
	setTimeout(function() {
		process.exit();
	}, 2000);

});

process.on('uncaughtException', function(err) {
	console.error("BIG ERROR: " + err);
	console.log("Node NOT Exiting...");
});

function sendToAdmins (name, data) {
    for (var akey in admins) {
        admins[akey].emit(name, data);
    }
}

function sendToFollowers (name, data) {
    for (var akey in followers) {
        followers[akey].emit(name, data);
    }
}

function setupVotePrompt (content) {
    if (!DEBUG && voted[content['vote-prompt']['votegroup']]) {
        console.log("DEBUG: ADMIN should not be sending prompts twice!");
        return;
    }
    // don't reset vote counts just because a presenter resent the prompt.
    if (voted[content['vote-prompt']['votegroup']] == undefined) {
        voted[content['vote-prompt']['votegroup']] = new Object;
        votes[content['vote-prompt']['votegroup']] = new Object;
    }
}
