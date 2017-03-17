"use strict";
var utils   = require('./utils.js');

var builder = require('botbuilder');

//callback for the CM Moderator Studio API
//this is invoked when the reviewer has reviewed a picture. 
module.exports = function(req) {
    console.log('Review callback.');
    console.log(JSON.stringify(req.body, null, 4));

    var id;

    if (req.body.CallBackType==='Job'){
        if (req.body.ReviewId===""){//no further review necessary. 
            if (req.body.Metadata.isadult && req.body.Metadata.isracy){
                //this is allowed
                console.log('Review called for Job: allowed');
            }else{
                //denied 
                console.log('Review called for Job: denied');
            }
        }else{//notification that the content is in review. Another callback follows
            console.log('Review called for Job: need for review');

        }
    }else{//review result
        if (req.body.Metadata.isadult && req.body.Metadata.isracy){
            //this is allowed
                console.log('Review called for Review: allowed');
        }else{
            //denied 
                console.log('Review called for Review: denied');
        }
    }

    //retrieve job data
    utils.retrieveDataUrlforReview(req.body.JobId, req.body.ContentId, function(error, address, contentUrl){
        var msg = new builder.Message()
            .address(address)
            .text("Your pizza is on its way!");
       //  bot.send(msg);
    });
}
