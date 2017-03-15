"use strict";

//callback for the CM Moderator Studio API
//this is invoked when the reviewer has reviewed a picture. 
module.exports = function(req, res, callback) {
    console.log('Review callback.');
    console.log(JSON.stringify(req.body, null, 4));
    res.send('OK');
    return callback(null, res.body );
}
