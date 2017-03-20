"use strict";

var utils   = require('./utils.js');

//Callback for the CM Moderator Studio API
//This is invoked: 
//1) when the content goes through the job pipeline
//2) when the reviewer has reviewed a picture. 
module.exports = function(req, cb) {
    console.log('======Review callback.');
    console.log(JSON.stringify(req.body, null, 4));

    var allowed = false;

    if (req.body.CallBackType==='Job'){
        if (req.body.ReviewId===""){//no further review necessary. 
            if (req.body.Metadata.isadult === "True" || 
                req.body.Metadata.isracy === "True"){
                allowed = false;
                console.log('Review called for Job: denied');
            }else{
                allowed = true;
                console.log('Review called for Job: allowed');
            }
        }else{//notification that the content is in review. Another callback follows
            allowed = null;
            console.log('Review called for Job: need for review');

        }
    }else{//review result
        if (req.body.ReviewerResultTags.a==='True' || 
            req.body.ReviewerResultTags.r==='True'){
            allowed = false;
            console.log('Review called for Review: denied');
        }else{
            allowed = true;
            console.log('Review called for Review: allowed');
        }
    }
    //retrieve job data
    cb(allowed, req.body.ContentId);
}
