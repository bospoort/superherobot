"use strict";
var fs      = require('fs');
var azure   = require('azure-storage');
var util    = require('util');
var request = require('request');
var constants = require('./constants.json');

var cnnstring    = util.format('DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net', 
                                    process.env.storageAccountName, 
                                    process.env.storageAccountKey);
var tableService = azure.createTableService( cnnstring );
var blobService  = azure.createBlobService( cnnstring );

module.exports.downloadMedia = function(fileurl, token, dest, cb ){
    var file = fs.createWriteStream(constants.imageFolder+dest);
    file.on('finish', function() {
            file.close(cb);
        })
        .on('error', function(err) {
            cb(err)
        });   
    var headers = {};
    if(token!==null){//this is passed in only for Skype for now. 
        headers['Authorization'] = 'Bearer ' + token;
        headers['Content-Type']  = 'application/octet-stream';
    }
    request
        .get({
            url: fileurl,
            encoding: null,
            headers: headers
        })
        .on('error', function(err) {
            cb(err)
        })   
        .pipe(file);
}

module.exports.uploadMediaToBlob = function(image, cb ){
    blobService.createContainerIfNotExists(constants.containerName, 
                                        {publicAccessLevel : 'blob'}, 
                                        function(error, result, response){
        if(!error){
            blobService.createBlockBlobFromLocalFile(constants.containerName,
                                                image, 
                                                constants.imageFolder+image, 
                                                function(error, result, response){
                if(!error){
                    var blobUrl = util.format("https://%s.blob.core.windows.net/%s/%s", 
                                              process.env.storageAccountName, 
                                              constants.containerName, 
                                              image);
                    cb(null,blobUrl);
                }
            });    
        }
    });
}

module.exports.storeContentIdForUser = function( contentId, address, contentUrl, cb ){
    tableService.createTableIfNotExists(constants.reviewjobsTableName, 
                                        function(error, result, response){
        if(!error){
            var entGen = azure.TableUtilities.entityGenerator;
            var review = {
                PartitionKey: entGen.String("fakeid"),
                RowKey: entGen.String(contentId),
                Address:entGen.String(address), 
                Url: entGen.String(contentUrl)
            };            
            tableService.insertEntity(constants.reviewjobsTableName, review, function (error, result, response) {
                if(!error){
                    cb(null,result);
                }else{
                    cb(error.code);
                }
            });    
        }else{
            cb(error.code);
        }
    });
}

module.exports.retrieveDataUrlforReview = function(contentId, cb ){
    tableService.createTableIfNotExists(constants.reviewjobsTableName, 
                                        function(error, result, response){
        if(!error){
            tableService.retrieveEntity(constants.reviewjobsTableName, "fakeid", contentId, function (error, result, response) {
                if(!error){
                    cb(null,result.Address._, result.Url._);
                }else{
                    cb(error.code);
                }
            });    
        }else{
            cb(error.code);
        }
    });
}