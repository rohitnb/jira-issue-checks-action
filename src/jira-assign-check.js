const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run(){
    const jiraIssue = core.getInput('jira-issue');
    const jiraToken = core.getInput('jira-token'); 
    const ghtoken = core.getInput('ghtoken');
    const jiraDomain = core.getInput('jira-domain');
    const octokit = github.getOctokit(ghtoken);
    var reviewResult = 0;
    var resultMessages = [];
    var finalMessage = [];
    
    function getIssueDetails(callback){
        var config = {
        method: 'get',
        url: jiraDomain+'/rest/api/3/issue/'+jiraIssue,
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
            url: jiraDomain+'/rest/api/3/field',
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
                console.log("Assignment Check PASSED");
                resultMessages.push("\n | Issue Assigned? | ✅ |");
                reviewResult = reviewResult+1;
                core.setOutput("jira-assigned",true);
            }
        }
        catch(err){
            console.log("Assignment Check FAILED");
            resultMessages.push("\n | Issue Assigned? | ❌ |");
            core.setOutput("jira-assigned",false);
        }

        //This checks if the sprint value is assigned or if it's linked to an Epic
        getSprintId(function(res2){
            var fieldsData = res2;
            var sprintFieldId = "";
            var epicLinkFieldId = ""
            for(i=0;i<fieldsData.length;i++){
                if(fieldsData[i].name==="Sprint"){
                    sprintFieldId=fieldsData[i].id;
                }
                if(fieldsData[i].name==="Epic Link"){
                    epicLinkFieldId=fieldsData[i].id;
                }
            }
            if(issueDetails.fields[sprintFieldId]!=null || issueDetails.fields[epicLinkFieldId]!=null){
                console.log("Sprint/Epic Check PASSED");
                resultMessages.push("\n | Sprint/Epic value updated? | ✅ |");
                reviewResult = reviewResult+1;
                core.setOutput("jira-sprint",true);
            }else{
                console.log("Sprint/Epic Check FAILED");
                resultMessages.push("\n | Sprint/Epic value updated? | ❌ |");
                core.setOutput("jira-sprint",false);
            }
        });

        //wait for the above block to finish (2sec) and continue with the remaining checks
        setTimeout(()=>
        {
                if(issueDetails.fields.fixVersions.length!=0){
                    console.log("Fix version Check PASSED");
                    resultMessages.push("\n | Fix version updated? | ✅ |");
                    reviewResult = reviewResult+1;
                    core.setOutput("jira-fixversion",true);
                }else{
                    console.log("Fix version Check FAILED");
                    resultMessages.push("\n | Fix version updated? | ❌ |");
                    core.setOutput("jira-fixversion",false);
                }
        
                //This block checks for whether time is logged
                if(issueDetails.fields.timespent!=null){
                    console.log("Time Logging Check PASSED");
                    resultMessages.push("\n | Time logged? | ✅ |");
                    reviewResult = reviewResult+1;
                    core.setOutput("jira-timelogging",true);
                }else{
                    console.log("Time Logging Check FAILED");
                    resultMessages.push("\n | Time logged? | ❌ |");
                    core.setOutput("jira-timelogging",false);
                }
        
                //This block checks for status
                if(issueDetails.fields.status.name=="In Progress"){
                    console.log("Issue Status is In Progress");
                    resultMessages.push("\n | Issue Status is In Progress? | ✅ |");
                    reviewResult = reviewResult+1;
                    core.setOutput("jira-status",true);
                }else{
                    console.log("Issue Status is "+issueDetails.fields.status.name+". It must be In Progress when the PR is open.");
                    resultMessages.push("\n | Issue Status is In Progress? | ❌ |");
                    core.setOutput("jira-status",false);
                }
                
                const pull_request_number = github.context.payload.pull_request.number;
                const pull_request_labels = github.context.payload.pull_request.labels;
                var label = ""
                console.log("Type of labels is "+typeof(pull_request_labels)+" and contents is "+pull_request_labels);
                
                
                if(reviewResult==5){
                    console.log("All Checks PASSED");
                    finalMessage.push("All Checks PASSED ✅");
                    var applied_label = octokit.rest.issues.addLabels({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: pull_request_number,
                        labels: ["jira-check:passed",issueDetails.project.key, issueDetails.fields.issuetype.name]
                      })
                    for(i=0;i<pull_request_labels.length;i++){
                        if(pull_request_labels[i].name == "jira-checks:failed"){
                            octokit.rest.issues.removeLabel({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: pull_request_number,
                                name: "jira-checks:failed"
                              });
                        }
                    }
                    core.setOutput("result",true);
                }else{
                    console.log("Some Checks have FAILED.");
                    finalMessage.push("Some Checks FAILED ❌");
                    var applied_label = octokit.rest.issues.addLabels({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: pull_request_number,
                        labels: ["jira-check:failed",issueDetails.project.key, issueDetails.fields.issuetype.name]
                      })
                    for(i=0;i<pull_request_labels.length;i++){
                        if(pull_request_labels[i].name == "jira-checks:passed"){
                            octokit.rest.issues.removeLabel({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: pull_request_number,
                                name: "jira-checks:passed",
                                });
                        }
                    }
                    core.setOutput("result",false);
                }
        
                
                var details_message = "\n\
### JIRA Issue Details: \n\n\
| JIRA Issue ID | ["+issueDetails.key+"] | \n\
|-|-| \n\
| JIRA Summary |"+issueDetails.fields.summary+"| \n\
| JIRA Issue Type | "+issueDetails.fields.issuetype.name+"| \n\
| JIRA Status |"+issueDetails.fields.status.name+"|\n\
        "
                var results_message = "\n\
### JIRA Issue Checks: \n\
| Check Name | Result | \n\
|-|-| \
"+resultMessages.join("")+"\n\
"
        
                var results_report = "### Results: "+finalMessage+"\n";
        
                var message = details_message + results_message + results_report;
        
                const new_comment = octokit.rest.issues.createComment({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: pull_request_number,
                    body: message
                    });
        
        },2000);
    });        
}

run();