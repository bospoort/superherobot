"use strict";
//make sure we have all the vars before we start loading modules
require('dotenv').load();

var restify = require('restify');
var builder = require('botbuilder');
var uuid    = require('node-uuid');
var utils   = require('./utils.js');
var match   = require('./match.js');
var constants  = require('./constants.json');

//set up server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3991, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

//get a token for CM and refresh periodically
var auth = require('./auth.js');
auth.refreshToken();
setInterval(auth.refreshToken, 15*60*1000);

var fs = require('fs');
if (!fs.existsSync(constants.imageFolder)){
    fs.mkdirSync(constants.imageFolder);
}

//this is needed to get body out of restify request...
server.use(restify.bodyParser());

//set up review callback
server.post('/review', function create(req, res, next) {
    res.send('OK');//keep server happy

    var processReview = require('./reviewCallback.js'); 
    processReview(req, function(allowed, contentid){
        utils.retrieveDataUrlforReview(contentid, function(error, address, contentUrl){
            if(!error){
                var text, goMatch = false;
                if (allowed===null){
                    text = 'Some actual human eyeballs would like to inspect your submission. Hold on...';
                }
                if (allowed==false){
                    text = 'Please submit another picture. This was a little too revealing';
                }
                if (allowed==true){
                    goMatch = true;
                }
                //create a message to send
                var msg = new builder.Message()
                    .address(JSON.parse(address));
                if(goMatch) {
                    findHero(msg, contentUrl);
                }else{
                    msg.text(text);
                    bot.send(msg);
                }
            }
        });
    });
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.dialog('/', [ 
    function (session, args) {
        builder.Prompts.attachment(session, 'Please send me a picture of you as a superhero.');
    },
    function (session, results){
        var contentURL = results.response[0].contentUrl;
        var contentid  = uuid.v1();

        switch (session.message.source){
            case 'skype':
            case 'sfb':{
                var name       = results.response[0].name;
                var ext        = name.substr(name.lastIndexOf('.'))
                var fileName   = contentid + ext;
                connector.getAccessToken( function (err, token) {
                    utils.downloadMedia(contentUrl, token, fileName, function (error) {
                        if (error){
                            session.send('Failed to upload image to blob storage.');
                        }
                        else{
                            utils.uploadMediaToBlob(fileName, function(error, blobURL){
                                if (error){
                                    session.send('Failed to upload image to blob storage.');
                                }
                                else{
                                    moderateAndMatch(session, contentid, blobURL);
                                    //reviewAndMatch(session, contentid, blobURL);
                                }
                            })
                        }
                    });                        
                });
                break;
            }
            case 'emulator':
            case 'webchat':{
                var name       = results.response[0].name;
                var ext        = name.substr(name.lastIndexOf('.'))
                var fileName   = contentid + ext;

                utils.downloadMedia(contentURL, null, fileName, function (error) {
                    utils.uploadMediaToBlob(fileName, function(error, blobURL){
                        if (error){
                            session.send('Failed to upload image to blob storage.');
                        }
                        else{
                            moderateAndMatch(session, contentid, blobURL);
                            //reviewAndMatch(session, contentid, blobURL);
                        }
                    });
                });
                break;
            }
            case 'kik':{
                moderateAndMatch(session, contentid, contentURL);
                //reviewAndMatch(session, contentid, blobURL);
                break;
            }
            default:{
                console.log('Dont know how to handle this platform' );
            }
        }
    }
]);

function reviewAndMatch (session, contentid, input){
    var moderate = require('./moderate.js');

    moderate.review( "Image", constants.workflow_name, contentid, input, function(err, body) {
        if (err) {
            console.log('Error: '+err);         
            session.endDialog('Oops. Something went wrong sending the content for review`.');
            return;
        }
        console.log('=====Submitted for review: ' + contentid);

        //now store the address, so we can pick up the conversation later
        var address = JSON.stringify(session.message.address);
        utils.storeContentIdForUser(contentid, address, input, function(result){
            session.endDialog('Your submission is in review.');
        });
    });
}

function moderateAndMatch (session, contentid, submittedImageUrl){
    var moderate = require('./moderate.js');
    moderate.moderate( 'ImageUrl', submittedImageUrl, function(err, body) {
        if (err) {
            console.log('Error: '+err);         
            session.endDialog('Oops. Something went wrong in Content Moderation.');
            return;
        }
        var output = JSON.stringify(body);

        //if racy or adult bounce back
        if (body.IsImageAdultClassified || body.IsImageRacyClassified){
            session.send('This picture is a bit too daring. No go');
            return;
        }
        var message = new builder.Message(session);
        findHero(message, submittedImageUrl);
    });
}

function findHero (message, submittedImageUrl){
    match.getFaceId(submittedImageUrl, function(error, faceId){
        if(error){
            bot.send(message.text(error.message));
        }
        else {
            match.matchFaceToHero(faceId, function(error, name, confidence, refurl){
                if (error){
                    bot.send(message.text(error.message));
                }else{
                    // Create and send attachment
                    var attachment = {
                        contentUrl: refurl,
                        contentType: 'image/jpg',
                        name: name
                    };

                    if ( message.data.source !== 'kik'){//bug in Kik connector; can't send images
                        message.addAttachment(attachment);
                    }
                    message.text("You look most like "+ name );
                    bot.send(message);
                }
            });
        }
    });
}