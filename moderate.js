'use strict';

var unirest = require('unirest');
var constants = require('./constants.json');
var utils = require('./utils.js');
var uuid = require('node-uuid');
var auth = require('./auth.js');
var request = require('request');

module.exports.review = function(contentType, workflow, contentid, input, serverUrl, cb) {
    unirest.post(constants.review_url+constants.moderation_team+'/jobs')
        .type("application/json")
        .query({
            ContentType: contentType,
            ContentId: contentid,
            WorkflowName: workflow,
            CallBackEndpoint: serverUrl
        })
        .headers({
            "Ocp-Apim-Subscription-Key":process.env.ocp_key, 
            "authorization": auth.token
        })
        .send({
            "ContentValue": input
        })
        .end(function (res) {
            return cb(res.error, res.body );
        });
}

module.exports.moderate1 = function(contentType, input, cb) {
    switch (contentType){
        case 'ImageUrl':{
            unirest.post(constants.moderation_url+'ProcessImage/Evaluate')
                .headers({
                    'content-type': 'application/json',
                    'Ocp-Apim-Subscription-Key':process.env.ocp_key
                })
                .send({
                    'DataRepresentation': 'URL',
                    'Value': input
                })
                .end(function (res) {
                    return cb(res.error, res.body );
                });
            break;
        }
        default:
            break;
    }
};

module.exports.moderate = function(contentType, input, cb) {
    switch (contentType){
        case 'ImageUrl':{
            var options = {
                url: constants.moderation_url+'ProcessImage/Evaluate',
                headers: {
                    'content-type':'application/json',
                    'Ocp-Apim-Subscription-Key': process.env.ocp_key
                },
                body: {
                    'DataRepresentation': 'URL',
                    'Value': input
                },
                json: true,
                method: 'post'
            };
            request(options, function(err, res, body){
                return cb(err, res.body );
            })   
            break;
        }
        default:
            break;
    }
};

