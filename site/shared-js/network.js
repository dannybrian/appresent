/*
 * Copyright (c) 2014 Danny Brian <danny@brians.org>
 *
 */


// FIXME
var io = io('http://g4tp.com/danny', { path: '/node/socket.io'} );
//var io = io('http://192.168.1.50/danny', { path: '/node/socket.io'} );

(function(window, undefined) {
    
    var connected = document.createEvent("Event");
    connected.initEvent("connected",true,true); 
    io.on('connect', function(event){
        connected.event = event;
        document.dispatchEvent(connected);
    });

    var disconnect = document.createEvent("Event");
    disconnect.initEvent("disconnected",true,true); 
    io.on('connect_error', function(error){
        disconnect.error = error;
        document.dispatchEvent(disconnect);
    });

    var stats = document.createEvent("Event");
    stats.initEvent("stats",true,true); 
    io.on('stats', function(data) {
        stats.stats = data;
        document.dispatchEvent(stats);
    });

    var votes = document.createEvent("Event");
    votes.initEvent("votes",true,true); 
    io.on('votes', function(data) {
        votes.votes = data;
        document.dispatchEvent(votes);
    });

    var vote = document.createEvent("Event");
    vote.initEvent("vote",true,true); 
    io.on('vote', function(data) {
        vote.vote = data;
        // console.log(data);
        document.dispatchEvent(vote);
    });
    
    var answer = document.createEvent("Event");
    answer.initEvent("answer",true,true); 
    io.on('answer', function(data) {
        answer.answer = data;
        // console.log(answer);
        document.dispatchEvent(answer);
    });
    
     var answers = document.createEvent("Event");
    answers.initEvent("answers",true,true); 
    io.on('answers', function(data) {
        answers.answers = data;
        // console.log(answer);
        document.dispatchEvent(answers);
    });
    
    var authenticated = document.createEvent("Event");
    authenticated.initEvent("authenticated",true,true); 
    io.on('authenticated', function(data) {
        authenticated.data = data;
        document.dispatchEvent(authenticated);
    });

    var badauth = document.createEvent("Event");
    badauth.initEvent("badauth",true,true); 
    io.on('badauth', function(data) {
        badauth.data = data;
        document.dispatchEvent(badauth);
    });
    
    var follow = document.createEvent("Event");
    follow.initEvent("follow",true,true); 
    io.on('follow', function(data) {
        follow.follow = data;
        document.dispatchEvent(follow);
    });
    
    
    var admin = document.createEvent("Event");
    admin.initEvent("admin-msg",true,true); 
    io.on('admin-msg', function(data) {
        admin.admin = data;
        document.dispatchEvent(admin);
    });

})(this);

// for global namespace calls from unity
function nextSubEvent () {
    var trigger = document.createEvent("Event");
    trigger.initEvent("trigger",true,true);
    trigger.trigger = { type: "nextSubEvent" };
    document.dispatchEvent(trigger);    
}

function fadeWhite () {
    var trigger = document.createEvent("Event");
    trigger.initEvent("trigger",true,true);
    trigger.trigger = { type: "fadeWhite" };
    document.dispatchEvent(trigger);
}

function pathPaused () {
    var trigger = document.createEvent("Event");
    trigger.initEvent("trigger",true,true);
    trigger.trigger = { type: "pathPaused" };
    document.dispatchEvent(trigger);
}
