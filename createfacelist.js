"use strict";
require('dotenv').load();
var request = require('request');
var futures = require('futures');
var constants = require('./constants.json');

function createFaceList(cb){
    console.log("First delete the list : "+constants.facelistID);
    var listUrl = "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/"+constants.facelistID;
    var options = {
        url: listUrl,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.faceAPIkey
        },
        method: 'delete'
    };
    request(options, function(err, res, body){
        if(err) return cb(err);
        console.log("Then create the list : "+constants.facelistID);
        var options = {
            url: "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/"+constants.facelistID,
            headers: {
                'content-type':'application/json',
                'Ocp-Apim-Subscription-Key': process.env.faceAPIkey
            },
            body: {
                'name': 'List'
            },
            json:   true,
            method: 'put'
        };
        request(options, function(err, res, body){
            return cb(err, res.body );
        })   
    });
}

function addFace(element, cb){
    console.log("===>add face: "+element.name);
    var userData = {
        name: element.name,
        url: element.url
    };
    var options = {
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/"+constants.facelistID+"/persistedFaces",
        qs: {
            'userData':JSON.stringify(userData)
        },
        headers: {
            'content-type':'application/json',
            'Ocp-Apim-Subscription-Key': process.env.faceAPIkey
        },
        body: {
            'url': element.url
        },
        json: true,
        method: 'post'
    };
    request(options, function(err, res, body){
        return cb(err, res.body );
    })   
}

function getFaceList(cb){
    console.log("===>get list");
    var options = {
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/"+constants.facelistID,
        headers: {
            'Ocp-Apim-Subscription-Key': process.env.faceAPIkey
        },
        json: true,
        method: 'get'
    };
    request(options, function(err, res, body){
        return cb(err, res.body );
    })   
}

createFaceList(function(err, body){
    var forEachAsync = futures.forEachAsync;

    var list    = require('./sampleFaces.json');
    forEachAsync(list.sampleFaces, function (next, element, index, array) {
        addFace(element, next);
    })
    .then(function () {
        getFaceList(function(err,body){
            var fs = require('fs');
            fs.writeFile("faceListWithId.json", JSON.stringify(body), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log(body);
            });
        });
    });
});