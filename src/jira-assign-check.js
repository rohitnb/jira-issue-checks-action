const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run(){
    const jiraIssue = core.getInput('jira-issue');
    const jiraToken = core.getInput('jira-token'); 
    var reviewResult = 0;
    
    function getIssueDetails(callback){
        var config = {
        method: 'get',
        url: 'https://rohitnb.atlassian.net/rest/api/3/issue/'+jiraIssue,
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Basic '+jiraToken, 
        }
        };

        axios(config)
        .then(function (response) {
            callback(response.data);
        })
        .catch(function (error) {
        core.setFailed(error.message);console.log(error);
        });
    }

    function getSprintId(callback){
        var config = {
            method: 'get',
            url: 'https://rohitnb.atlassian.net/rest/api/3/field',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Basic '+jiraToken,
            }
        };
        axios(config)
        .then(function (response) {
            callback(response.data);
        })
        .catch(function (error) {
        console.log(error);
        });
    }

    getIssueDetails(function(result){
        var issueDetails = result;

        //This block checks for assignment
        try{
            if(issueDetails.fields.assignee.accountId!=null){
                console.log("JIRA Review - Assignment Check PASSED");
                reviewResult = reviewResult+1;
                core.setOutput("jira-assigned",true);
            }
        }
        catch(err){
            console.log("JIRA Review - Assignment Check FAILED");
            core.setOutput("jira-assigned",false);
        }

        //This checks if the sprint value is assigned or if it's linked to an Epic
        getSprintId(function(res2){
            var fieldsData = res2;
            var sprintFieldId = "";
            for(i=0;i<fieldsData.length;i++){
                if(fieldsData[i].name==="Sprint"){
                    sprintFieldId=fieldsData[i].id;
                    break;
                }
            }
            if(issueDetails.fields[sprintFieldId]!=null){
                console.log("JIRA Review - Sprint Check PASSED");
                reviewResult = reviewResult+1;
                core.setOutput("jira-sprint",true);
            }else{
                console.log("JIRA Review - Sprint Check FAILED");
                core.setOutput("jira-sprint",false);
            }
        });

        //This block checks for whether fix version is present
        if(issueDetails.fields.fixVersions.length!=0){
            console.log("JIRA Review - Fix version Check PASSED");
            reviewResult = reviewResult+1;
            core.setOutput("jira-fixversion",true);
        }else{
            console.log("JIRA Review - Fix version Check FAILED");
            core.setOutput("jira-fixversion",false);
        }

        //This block checks for whether time is logged
        if(issueDetails.fields.timespent!=null){
            console.log("JIRA Review - Time Logging Check PASSED");
            reviewResult = reviewResult+1;
            core.setOutput("jira-timelogging",true);
        }else{
            console.log("JIRA Review - Time Logging Check FAILED");
            core.setOutput("jira-timelogging",false);
        }
        
        if(reviewResult==4){
            console.log("All Checks PASSED");
            core.setOutput("result",true);
        }else{
            console.log("Some Checks have FAILED.");
            core.setOutput("result",false);
        }
    }
    );
}

run();