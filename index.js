var restify = require('restify');
var builder = require('botbuilder');
var uuid    = require('node-uuid');
var utils   = require('./utils.js');
var match   = require('./match.js');
var constdef= require('./constants.json');


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
if (!fs.existsSync(constdef.imageFolder)){
    fs.mkdirSync(constdef.imageFolder);
}

//set up review callback
server.use(restify.bodyParser());//this is needed to get body out of restify request...

server.post('/review', function create(req, res, next) {
    res.send('OK');//keep server happy

    var handleReview = require('./reviewCallback.js'); 
    handleReview(req, function(allowed, contentid){
        utils.retrieveDataUrlforReview(contentid, function(error, address, contentUrl, cb){
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
        builder.Prompts.attachment(session, 'Please send me a video clip of you as a superhero.');
    },
    function (session, results){
        var contentURL = results.response[0].contentUrl;
        var name       = results.response[0].name;
        var ext        = name.substr(name.lastIndexOf('.'))
        var contentid  = uuid.v1();
        var fileName   = contentid + ext;

        utils.downloadMedia(contentURL, fileName, function (error) {
            utils.uploadMediaToBlob(fileName, function(error, blobURL){
                if (error){
                    session.send('Failed to upload image to blob storage.');
                }
                else{
                    reviewAndMatch(session, contentid, blobURL);
                    //moderateAndMatch(session, contentid, blobURL);
                }
            });
        });
    }
]);

function reviewAndMatch (session, contentid, input){
    var moderate = require('./moderate.js');

    moderate.review( "Image", 'butterfly', contentid, input, function(err, body) {
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
        findHero(session.message, submittedImageUrl);
    });
}

function findHero (message, submittedImageUrl){
    match.getFaceId(submittedImageUrl, function(error, faceId){
        if(error){
            session.send(error);
        }
        else {
            match.matchFaceToHero(faceId, function(error, name, confidence, refurl){
                if (error){
                    session.send(error);
                }else{
                    // Create and send attachment
                    var attachment = {
                        contentUrl: refurl,
                        contentType: 'image/jpg',
                        name: name
                    };
                    message.addAttachment(attachment)
                        .text("You look most like "+ name + ' (confidence: '+ confidence + ')');
                    bot.send(message);
                }
            });
        }
    });
}
