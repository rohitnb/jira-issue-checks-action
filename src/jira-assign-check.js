const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run(){
    function isAssigned(callback){
        const jiraIssue = core.getInput('jira-issue');
        const jiraToken = core.getInput('jira-token') 
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

    isAssigned(function(result){
        var issueDetails = result;
        try{
            if(issueDetails.fields.assignee.accountId!=null){
                core.setOutput("jira-assigned",true);
            }
        }
        catch(err){
            core.setOutput("jira-assigned",false);
        }
    }

    );
}

run();