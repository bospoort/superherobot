var http    = require('http');
var fs      = require('fs');
var unirest = require('unirest');
var azure   = require('azure-storage');
var util    = require('util');
var config  = require('./config.json');
var constants = require('./constants.json');

module.exports.downloadMedia = function(url, dest, cb ){
    var file = fs.createWriteStream(constants.imageFolder+dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
        });
    });
}

//upload picture to blob
module.exports.uploadMediaToBlob = function(image, cb ){
    var accountName     = config.storageAccountName;
    var accountKey      = config.storageAccountKey;
    var containerName   = constants.containerName;
    var template        = 'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net';

    var connectionstring= util.format(template, accountName, accountKey);
    var blobService     = azure.createBlobService( connectionstring );

    blobService.createContainerIfNotExists(containerName, 
                                        {publicAccessLevel : 'blob'}, 
                                        function(error, result, response){
        if(!error){
            blobService.createBlockBlobFromLocalFile(containerName,
                                                image, 
                                                constants.imageFolder+image, 
                                                function(error, result, response){
                if(!error){
                    var blobUrl = util.format("https://%s.blob.core.windows.net/%s/%s", 
                                              config.storageAccountName, 
                                              constants.containerName, 
                                              image);
                    cb(null,blobUrl);
                }
            });    
        }
    });
}

module.exports.storeContentIdForUser = function( contentId, address, contentUrl, cb ){
    var accountName     = config.storageAccountName;
    var accountKey      = config.storageAccountKey;
    var tableName       = constants.reviewjobsTableName;
    var template        = 'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net';

    var connectionstring= util.format(template, accountName, accountKey);
    var tableService    = azure.createTableService( connectionstring );

    tableService.createTableIfNotExists(tableName, 
                                        function(error, result, response){
        if(!error){
            var entGen = azure.TableUtilities.entityGenerator;
            var review = {
                PartitionKey: entGen.String("fakeid"),
                RowKey: entGen.String(contentId),
                Address:entGen.String(address), 
                Url: entGen.String(contentUrl)
            };            
            tableService.insertEntity(tableName, review, function (error, result, response) {
                if(!error){
                    cb(null,result);
                }
            });    
        }
    });
}

module.exports.retrieveDataUrlforReview = function(contentId, cb ){
    var accountName     = config.storageAccountName;
    var accountKey      = config.storageAccountKey;
    var tableName       = constants.reviewjobsTableName;
    var template        = 'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net';

    var connectionstring= util.format(template, accountName, accountKey);
    var tableService    = azure.createTableService( connectionstring );

    tableService.createTableIfNotExists(tableName, 
                                        function(error, result, response){
        if(!error){
            tableService.retrieveEntity(tableName, "fakeid", contentId, function (error, result, response) {
                if(!error){
                    cb(null,result.Address._, result.Url._);
                }else{
                    cb(error.code);
                }
            });    
        }
    });
}