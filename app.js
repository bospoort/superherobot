"use strict";
//make sure we have all the vars before we start loading modules
require('dotenv').load();

const restify = require('restify');
const builder = require('botbuilder');
const uuid    = require('node-uuid');
const utils   = require('./utils.js');
const match   = require('./match.js');
const moderate = require('./moderate.js');
const constants  = require('./constants.json');

//set up server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3991, function () {
    console.log('%s listening to %s', server.name, process.env.WEBSITE_HOSTNAME); 
});

//get a token for CM and refresh periodically
var auth = require('./auth.js');
auth.refreshToken();
setInterval(auth.refreshToken, 15*60*1000);

console.log(process.env.WEBSITE_HOSTNAME);

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
    appId:       process.env.MICROSOFT_APP_ID,
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
        var name       = results.response[0].name;
        var ext        = name.substr(name.lastIndexOf('.'))
        var fileName   = contentid + ext;

        switch (session.message.source){
            case 'skype':
            case 'sfb':
                connector.getAccessToken( function (err, token) {
                    utils.downloadMedia(contentURL, token, fileName, function (error) {
                        utils.uploadMediaToBlob(fileName, function(error, blobURL){
                            if (error)
                                return session.endDialog('Failed to upload image to blob storage.');
                            moderateAndMatch(session, contentid, blobURL);
                        });
                    });
                });
                break;
            case 'emulator':
            case 'webchat':
                utils.downloadMedia(contentURL, null, fileName, function (error) {
                    utils.uploadMediaToBlob(fileName, function(error, blobURL){
                        if (error)
                            return session.endDialog('Failed to upload image to blob storage.');
                        moderateAndMatch(session, contentid, blobURL);
                    });
                });
                break;
            case 'kik':
                moderateAndMatch(session, contentid, contentURL);
                break;
            default:
                console.log('Dont know how to handle this platform' );
                session.send('This appears to be an unsupported platform.');
        }
    }
]);

function moderateAndMatch (session, contentid, submittedImageUrl){
    if (process.env.moderationMode==='moderation'){
        moderate.moderate( 'ImageUrl', submittedImageUrl, function(err, body) {
            if (err) {
                console.log('Error: '+err);         
                return session.endDialog('Oops. Something went wrong in Content Moderation.');
            }
            var output = JSON.stringify(body);

            //if racy or adult bounce back
            if (body.IsImageAdultClassified || body.IsImageRacyClassified){
                return session.send('This picture is a bit too daring. No go');
            }
            var message = new builder.Message(session);
            findHero(message, submittedImageUrl);
        });
    }else{
        var reviewCallbackUrl = process.env.WEBSITE_HOSTNAME+'/review';
        moderate.review( "Image", constants.workflow_name, contentid, submittedImageUrl, reviewCallbackUrl, function(err, body) {
            if (err) {
                console.log('Error: '+err);         
                return session.endDialog('Oops. Something went wrong sending the content for review`.');
            }
            console.log('=====Submitted for review: ' + contentid);
            //now store the address, so we can pick up the conversation later
            var address = JSON.stringify(session.message.address);
            utils.storeContentIdForUser(contentid, address, submittedImageUrl, function(result){
                session.endDialog('Your submission is in review.');
            });
        });
    }
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
                    message.text("You have a striking resemblance to "+ name );
                    console.log('Confidence: '+confidence);
                    bot.send(message);
                }
            });
        }
    });
}
