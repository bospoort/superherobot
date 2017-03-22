"use strict";

var unirest = require("unirest");

module.exports.token = null;

module.exports.refreshToken = function() {
    unirest.post("https://login.microsoftonline.com/contentmoderatorprod.onmicrosoft.com/oauth2/token")
    .headers({
        "content-type": "application/x-www-form-urlencoded"
    })
    .form({
        "resource": "https://api.contentmoderator.cognitive.microsoft.com/review",
        "client_id": process.env.cm_id,
        "client_secret": process.env.cm_key,
        "grant_type": "client_credentials"
    })
    .end(function (res){
        if (res.error){
            console.log("Refreshing token error: "+res.error);
        }else{
            module.exports.token = 'Bearer ' + res.body.access_token;
        }
    });
};

