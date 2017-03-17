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
            CallBackEndpoint: 'http://a21492ba.ngrok.io/review'//'http://requestb.in/1jiduqh1'
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

