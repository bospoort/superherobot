"use strict";

var unirest = require("unirest");
var config = require('./config.json');
var auth = require('./auth.js');

module.exports = function(contentType, workflow, contentid, input, callback) {
    var url = config.url_prefix+'jobs';

    var req = unirest.post(url)
        .type("application/json")
        .query({
            ContentType: contentType,
            ContentId: contentid,
            WorkflowName: workflow,
            CallBackEndpoint: 'http://7f82e0aa.ngrok.io/review'
        })
        .headers({
            "Ocp-Apim-Subscription-Key":config.ocp_key, 
            "authorization": auth.token
        })
        .send({
            "ContentValue": input
        })
        .end(function (res) {
            return callback(res.error, res.body );
        });
}

