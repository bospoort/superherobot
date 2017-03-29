"use strict";
//make sure we have all the vars before we start loading modules
require('dotenv').load();
var request = require('request');

function createFaceList(cb){
    console.log("Create list");
    var options = {
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/techgiants",
        headers: {
            'content-type':'application/json',
            'Ocp-Apim-Subscription-Key': process.env.faceAPIkey
        },
        body: {
            'name': 'Tech Giants'
        },
        json: true,
        method: 'put'
    };
    request(options, function(err, res, body){
        return cb(err, res.body );
    })   
}

function addFace(name, url, cb){
    console.log("===>add face");
    var options = {
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/techgiants/persistedFaces",
        qs: {
            'userData':name
        },
        headers: {
            'content-type':'application/json',
            'Ocp-Apim-Subscription-Key': process.env.faceAPIkey
        },
        body: {
            'url': url
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
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/facelists/techgiants",
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
    console.log(body);
    addFace("Jeff Bezos", 
            "http://1u88jj3r4db2x4txp44yqfj1.wpengine.netdna-cdn.com/wp-content/uploads/2016/05/Jeff-Bezos-04-930x523.png",
            function(err, body){
                console.log(body);
                getFaceList(function(err,body){
                    console.log(body);
                })
            }
    );
});