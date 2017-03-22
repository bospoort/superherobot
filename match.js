"use strict";

var unirest = require("unirest");
var auth    = require('./auth.js');
var config  = require('./config.json');
var constants  = require('./constants.json');
var utils   = require('./utils.js');

module.exports.getFaceId = function(submittedImageUrl, callback) {
    var detectFaceAPIURL = 'https://westus.api.cognitive.microsoft.com/face/v1.0/detect';
    var req = unirest.post(detectFaceAPIURL)
        .query({ 
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false'
        })
        .headers({
            "Ocp-Apim-Subscription-Key":config.faceAPIkey, 
            "Content-Type": 'application/json'
        })
        .send({
            "url": submittedImageUrl 
        })
        .end(function (res) {
            if (res.error){
                return callback(res.error );
            }else{
                callback(null, res.body[0].faceId)
            }
        });
}

module.exports.matchFaceToHero = function (faceID, callback){
    var faceAPIURL = 'https://westus.api.cognitive.microsoft.com/face/v1.0/findsimilars';
    var req = unirest.post(faceAPIURL)
        .headers({
            "Ocp-Apim-Subscription-Key":config.faceAPIkey, 
            "Content-Type": 'application/json'
        })
        .send({
            "faceId":faceID, 
            "faceListId":   constants.facelistID,  
            "maxNumOfCandidatesReturned":10,
            "mode": "matchFace" 
        })
        .end(function (res) {
            var heroId  = res.body[0].persistedFaceId;      
            var conf    = res.body[0].confidence;
            var list    = require('./superheroeslistid.json');
            var len     = list.persistedFaces.length;
            for  ( var i = 0 ; i < len ; i++){
                if (list.persistedFaces[i].persistedFaceId === heroId){
                    var hero = list.persistedFaces[i].userData;
                    var refurl = constants.superheroURL+hero+'.jpg';
                    return callback(null, hero, conf, refurl);
                }
            }
            return callback("Could not find a match..." );
        });
}