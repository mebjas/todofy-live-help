var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var sprintf = require('sprintf').sprintf;
var uuid = require('node-uuid');
var sbot = require('slackbots');

var port = 8080;
var app = express();
app.use( bodyParser.json() );        // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({      // to support URL-encoded bodies
  extended: true
}));

app.listen(port, function() {
    console.log(sprintf("BOT Listening to port %s", port));
});

var responses = {};

/**
 * Endpoint to get the help request from some extension, with config information
 * Creates a WS with slack, post the message and wait for the user to respond.
 * Once the user responds, add it to responses dictionery so that polling extension
 * can get back the information.
 */
app.post('/todofylivepoc', function(req, res) {
    var guid = uuid.v1();
    var username = req.body.username;
    var message = req.body.message;
    var filename = req.body.filename;
    var question = req.body.question;
    var config = req.body.config;
    var userdictionery = {};

    // send response back to client
    res.json({ack: true, guid: guid});

    var bot = new sbot({token: config.APIToken, name: 'todofybot'});

    // Get all user information
    bot.getUsers().then(function(data) {
        data.members.forEach(function(d) {
            userdictionery[d.id] = d.name;
        });
    })

    bot.on('start', function() {
        var M = "@" +username +" a user has requested for your help\n";
        M += "*Question:* " +question +"\n";
        M += "*filename:* " +filename +"\n";
        M += "```\n";
        M += message
        M += "```\n";
        M += "\nSEND REPLY WITH: " +guid;
        bot.postMessageToChannel(config.Channel, M, { 'slackbot': true, icon_emoji: ':cat:' });
    });

    bot.on('message', function(mesg) {
        if (mesg.type == "message") {
            if (typeof mesg.subtype != 'undefined' && mesg.subtype == 'bot_message') return;
            
            if (mesg.text.indexOf(guid)!=-1) {
                // responses
                responses[guid] = mesg.text.replace(guid, '');
            }
            console.log(mesg);
        }
    });
});


/**
 * Endpoint to get the respond with response from user from slack.
 */
app.post('/todofylivepocpoll', function(req, res) {
    var guid = req.body.guid;
    if (typeof responses[guid] != 'undefined') {
        res.json({ack: true, text: responses[guid]});
        responses[guid] = undefined;
    } else {
        res.json({ack: false});
    }
})