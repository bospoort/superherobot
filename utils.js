var http    = require('http');
var fs      = require('fs');
var unirest = require('unirest');
var azure   = require('azure-storage');
var util    = require('util');
var config  = require('./config.json');

const imageFolder = './images/';

module.exports.downloadMedia = function(url, dest, cb ){
    var file = fs.createWriteStream(imageFolder+dest);
    var request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
            file.close(cb);
        });
    });
}

//upload picture to blob
module.exports.uploadMediaToBlob = function(image, cb ){
    var accountName     = config.blobAccountName;
    var accountKey      = config.blobAccountKey;
    var containerName   = config.containerName;
    var template        = 'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net';

    var connectionstring= util.format(template, accountName, accountKey);
    var blobService     = azure.createBlobService( connectionstring );

    blobService.createContainerIfNotExists(containerName, 
                                        {publicAccessLevel : 'blob'}, 
                                        function(error, result, response){
        if(!error){
            blobService.createBlockBlobFromLocalFile(containerName,
                                                image, 
                                                imageFolder+image, 
                                                function(error, result, response){
                if(!error){
                    var url = config.blobStorageURL + image;
                    cb(null,url);
                }
            });    
        }
    });
}