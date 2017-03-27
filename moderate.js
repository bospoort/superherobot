'use strict';

var uuid    = require('node-uuid');
var request = require('request');
var utils   = require('./utils.js');
var auth    = require('./auth.js');
var constants = require('./constants.json');

module.exports.review = function(contentType, workflow, contentid, input, serverUrl, cb) {
    var options = {
        url: constants.review_url+constants.moderation_team+'/jobs',
        qs:{
            ContentType: contentType,
            ContentId: contentid,
            WorkflowName: workflow,
            CallBackEndpoint: serverUrl
        },
        headers: {
            "Ocp-Apim-Subscription-Key":process.env.ocp_key, 
            "authorization": auth.token
        },
        body: {
            "ContentValue": input
        },
        json: true,
        method: 'post'
    };
    request(options, function(err, res, body){
        return cb(err, res.body );
    })   
}

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

