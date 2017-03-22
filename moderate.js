'use strict';

var unirest = require('unirest');
var config = require('./config.json');
var constants = require('./constants.json');
var utils = require('./utils.js');
var uuid = require('node-uuid');
var auth = require('./auth.js');

module.exports.review = function(contentType, workflow, contentid, input, cb) {
    unirest.post(constants.review_url+constants.moderation_team+'/jobs')
        .type("application/json")
        .query({
            ContentType: contentType,
            ContentId: contentid,
            WorkflowName: workflow,
            CallBackEndpoint: 'http://35482930.ngrok.io/review'
        })
        .headers({
            "Ocp-Apim-Subscription-Key":config.ocp_key, 
            "authorization": auth.token
        })
        .send({
            "ContentValue": input
        })
        .end(function (res) {
            return cb(res.error, res.body );
        });
}

module.exports.moderate = function(contentType, input, cb) {
    switch (contentType){
        case 'ImageUrl':{
            unirest.post(constants.moderation_url+'ProcessImage/Evaluate')
                .headers({
                    'content-type': 'application/json',
                    'Ocp-Apim-Subscription-Key':config.ocp_key
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
        case 'video/mp4':{
            var ext = input.contentUrl.substr(input.contentUrl.lastIndexOf('.'));
            var fileName = uuid.v1() +  ext 
            utils.downloadMedia(input.contentUrl, fileName, function (error) {
                utils.uploadMediaToBlob(fileName, function(error, url){
                    if (!error){
                        unirest.post(baseUrl+'ProcessImage/Evaluate')
                            .type('json')
                            .headers({
                                'content-type': 'application/json',
                                'Ocp-Apim-Subscription-Key':config.ocp_key, 
                            })
                            .send({
                                'DataRepresentation': 'URL',
                                'Value': url,
                            })
                            .end(function (res) {
                                return cb(res.error, res.body );
                            });
                    }
                });
            })
            break;
        }
        default:
            break;
    }
};
