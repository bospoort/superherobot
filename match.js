"use strict";

var unirest = require("unirest");
var request = require("request");
var auth    = require('./auth.js');
var constants  = require('./constants.json');
var utils   = require('./utils.js');

module.exports.getFaceId = function(submittedImageUrl, callback) {
    var options = {
        url: 'https://westus.api.cognitive.microsoft.com/face/v1.0/detect',
        qs:{
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false'
        },
        headers: {
            "Ocp-Apim-Subscription-Key":process.env.faceAPIkey, 
            "Content-Type": 'application/json'
        },
        body: {
            "url": submittedImageUrl 
        },
        json: true,
        method: 'post'
    };
    request(options, function(err, res, body){
        if (err){
            return callback(err);
        }else{
            return callback(null, res.body[0].faceId);
        }
    })  
}

module.exports.matchFaceToHero = function (faceID, callback){
    var options = {
        url: 'https://westus.api.cognitive.microsoft.com/face/v1.0/findsimilars',
        headers: {
            "Ocp-Apim-Subscription-Key":process.env.faceAPIkey, 
            "Content-Type": 'application/json'
        },
        body: {
            "faceId":faceID, 
            "faceListId":   constants.facelistID,  
            "maxNumOfCandidatesReturned":10,
            "mode": "matchFace" 
        },
        json: true,
        method: 'post'
    };
    request(options, function(err, res, body){
        if (err){
            return callback(err);
        }else{
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
        }
    });
}