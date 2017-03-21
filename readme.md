# ContentModerationBot

## Introduction
This bot uses the Content Moderation APIs for flagging inappropriate content. The bot can flag  images. You can use either the simple content moderation APIs to analyze individual pictures or the review API with the Review UI. This Review Studio allows human beings to manually evaluate pictures and flag appropriately. When a human resource has the picture reviewed, Content Moderator Review invokes your callback to notify you of the results. 

## Setting it up
You will need to create a config.json file with the following keys. 

``` JSON
{
    "cm_id":            "{guid}",
    "cm_key":           "{guid}", 
    "ocp_key":          "{guid}",

    "moderation_team":  "{your-team-name}}",
    "workflow_name":    "{your-workflow-name}",
    "moderation_url":   "https://westus.api.cognitive.microsoft.com/contentmoderator/moderate/v1.0/",
    "review_url":       "https://westus.api.cognitive.microsoft.com/contentmoderator/review/v1.0/teams/",

    "blobAccountName":  "{your-blob-account-name}",
    "blobAccountKey":   "{your-blob-account-key}}",
    "containerName":    "images",
    "blobStorageURL":   "{your-blob-storage-url}",
    "tableStorageURL":  "{your-table-storage-url}",
    "reviewjobsTableName": "reviewjobs",
    "superheroURL":     "https://superheropictures.blob.core.windows.net/reference/",

    "faceAPIaccount":   "{account-name}",
    "faceAPIkey":       "acount-key",
    "facelistID":       "face-list-id",

    "imageFolder":      "./images/"
}   
```
First you'll need actual Content Moderation keys: 
1. Go to [Azure Portal](https://www.portal.azure.com) 
2. Click on the '+' sign to create a new resource
3. Search for 'Cognitive Services' and create the resource
4. In the following API type drop down, select 'Content Moderator'
5. Create appropriate resource groups and and other settings for this account.

APIs dropdown and select Content Moderator under Vision, you can Get started for Free. It will ask you to sign in and to provide a team name. You will then be taken to the dashboard. 

## Getting the callback
Content Moderator needs a callback for pictures when they are reviewed in Content Moderator studio. Since it might be hard to find your IP behind a firewall, you can set up the end point with ngrok: 
```
ngrok http <port>.
```
where <port> is the port you specify in index.js line 7. Alternatively, you can use requestb.in. 
