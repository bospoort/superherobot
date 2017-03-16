var restify = require('restify');
var builder = require('botbuilder');
var uuid    = require('node-uuid');

//set up server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3991, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

//get a token for CM and refresh periodically
var auth = require('./auth.js');
auth.refreshToken();
setInterval(auth.refreshToken, 15*60*1000);

//set up review callback
server.use(restify.bodyParser());//this is needed to get body out of restify request...
server.post('/review', function create(req, res, next) {
    var review = require('./reviewCallback.js'); 
    return review(req, res, next);
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.dialog('/', [ 
    function (session, args) {
        builder.Prompts.text(session, 'Please send me a video clip of you as a superhero.');
    },
    function (session, results){
        var input = null;
        //treat the text as url  if there is no attachment
        if (!session.message.attachments[0]){
            input = session.message.text;
            filterAndMatch(session, input);
        }
        else{
            input = session.message.attachments[0];
            var ext = input.contentUrl.substr(input.contentUrl.lastIndexOf('.'));
            var fileName = uuid.v1() +  ext;
            var utils = require('./utils.js');

            utils.downloadMedia(input.contentUrl, fileName, function (error) {
                utils.uploadMediaToBlob(fileName, function(error, url){
                    if (error){
                        session.send('Failed to upload image to blob storage.');
                    }
                    else{
                        filterAndMatch(session, url);
                    }
                });
            });
        }
    }
]);

function filterAndMatch(session, input){
    var moderate = require('./moderate.js');
    moderate( 'ImageUrl', input, function(err, body) {
        if (err) {
            console.log('Error: '+err);         
            session.send('Oops. Something went wrong in Content Moderation.');
            return;
        }
        var output = JSON.stringify(body);

        //if racy or adult bounce back
        if (body.IsImageAdultClassified || body.IsImageRacyClassified){
            session.send('This picture is a bit too daring. No go');
            return;
        }
        //find super hero
        var matchSuperHero = require('./match.js');
        matchSuperHero(input, function(error, name, confidence, refurl){
            if (error){
                session.send(error);
            }else{
                // Create and send attachment
                var attachment = {
                    contentUrl: refurl,
                    contentType: 'image/jpg',
                    name: name
                };
                var msg = new builder.Message(session)
                    .addAttachment(attachment)
                    .text("You look most like "+ name + ' (confidence: '+ confidence + ')');
                session.send(msg);
            }
        });
    });
}

bot.dialog('/jobPicture', [ 
    function (session, args) {
        builder.Prompts.text(session, 'This is a Job. Give me a URL to a picture, please.');
    },
    function (session, results){
        var moderate = require('./job.js');
        var input = session.message.text;
        moderate( "Image", 
            'butterfly',
            input, 
            function(err, body) {
            if (err) {
                console.log('Error: '+err);         
                session.send('Oops. Something went wrong.');
                return;
            }
            var output = JSON.stringify(body);
            console.log('Result: ' + output);
            session.endDialog(output);
        });
    }
]);

