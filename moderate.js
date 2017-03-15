'use strict';
var unirest = require('unirest');
var config = require('./config.json');
var utils = require('./utils.js');
var uuid = require('node-uuid');

var baseUrl = 'https://westus.api.cognitive.microsoft.com/contentmoderator/moderate/v1.0/';

module.exports = function(contentType, input, cb) {
    switch (contentType){
        case 'ImageUrl':{
            unirest.post(baseUrl+'ProcessImage/Evaluate')
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
        case 'image/jpeg':{
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
        case 'Text':{
            unirest.post(baseUrl+'ProcessText/Screen/')
                //.type('application/json')
                .query({ 
                    'language': 'eng',
                    'autocorrect': 'true',
                    'urls': 'true',
                    'PII': 'true'                
                })
                .headers({
                    'Ocp-Apim-Subscription-Key':config.ocp_key, 
                    'Content-Type':'text/plain'
                })
                .send(
                    input
                )
                .end(function (res) {
                    return cb(res.error, res.body );
                });
            break;
        }
        case 'Video':{
            break;
        }
        default:
            break;
    }
};
