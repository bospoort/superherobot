# ContentModerationBot

## Introduction
This bot uses the Content Moderation APIs for flagging inappropriate content. The bot can flag  images. You can use either the simple content moderation APIs to analyze individual pictures or the review API with the Review UI. This Review Studio allows human beings to manually evaluate pictures and flag appropriately. When a human resource has the picture reviewed, Content Moderator Review invokes your callback to notify you of the results. 

## Setting it up
You will need to create a .env file with the following keys. 

``` JSON
cm_id   = {Id obtained from credentials page in https://contentmoderator.cognitive.microsoft.com/}
cm_key  = {Key obtained from credentials page in https://contentmoderator.cognitive.microsoft.com/}
ocp_key = {Key obtained from Cognitive services resource in portal.azure.com}

storageAccountName  = {Azure storage account}
storageAccountKey   = {Azure storage key}

facelistID  = superheroeslistid
faceAPIkey  = {faceapikey}

MICROSOFT_APP_ID        = {bot app id from dev.botframework.com}
MICROSOFT_APP_PASSWORD  = {bot password from dev.botframework.com}

#moderation or review
moderationMode=review
```

First you'll need actual Content Moderation keys: 
1. Go to [Azure Portal](https://portal.azure.com) 
2. Click on the '+' sign to create a new resource
3. Search for 'Cognitive Services' and create the resource
4. In the following API type drop down, select 'Content Moderator'
5. Create appropriate resource groups and and other settings for this account.
6. Go to keys and copy one of the values into ocp_key in .env above  

Next create a storage account
1. Click on the '+' sign to create a new resource
3. Search for 'Storage Account', select 'Microsoft Storage' and click create 
4. Give it a name, and other settings (default is fine)
5. Create appropriate resource groups and and other settings for this account.
6. Copy the Storage account name and one of the keys into storageAccountName and storageAccountKey

## Getting the callback
Content Moderator needs a callback for pictures when you post them for a job and when someone has reviewed them in the Review UI. Since it might be hard to find your IP behind a firewall, you can set up the end point with ngrok: 
```
ngrok http <port>.
```
where <port> is the port you specify in app.js line 15. I use an environment variable (process.env.WEBSITE_HOSTNAME) that Azure populates for my app service once deployed. For testing in the Bot emulator I set this variable in my launch.json file. 
