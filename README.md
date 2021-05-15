## JIRA Issue Checks

This action checks if the JIRA Issue is assigned or not

### Inputs

#### `jira-issue`

**Required** The JIRA issue number in the format XYZ-123. Default `null`

#### `jira-token`

**Required** The JIRA token. To set this token - form the string `<jira-email-address>:<jira-api-token>` and Base64 encode it. For example `abc@xyz.com:7h1s1smyJIRAt0k3n`

#### `ghtoken`

**Required** The GitHub token Default `null`

### Outputs
`jira-assigned` - Issue Assigned?	

`jira-sprint` - Sprint value updated?	

`jira-fixversion` - Fix version updated?	

`jira-timelogging` - Time Logged?

`jira-status` - Issue Status is In Progress?

`result` - True if all checks passed.

### Example usage
```
uses: rohitnb/jira-issue-checks-action@v1
with:
  jira-issue: 'XYZ-123'
  jira-token: ${{secrets.JIRA_TOKEN}}
  ghtoken: ${{secrets.GITHUB_TOKEN}}
```
### Demo workflow file for Pull Requests
```
name: 'JIRA Issue Checks'
on: 
  pull_request:
    types: [opened,edited]

jobs:
  jira-issue-checks:
    runs-on: ubuntu-latest
    name: JIRA Issue checks
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Check if JIRA Issues meet policies
        id: jira-checks
        uses: rohitnb/jira-issue-checks-action@v2
        with:
          jira-issue: 'INTEG-2'
          jira-token: ${{secrets.JIRA_TOKEN}}
          ghtoken: ${{secrets.GITHUB_TOKEN}}
      - name: JIRA Issue Checks Results
        run: echo "JIRA Issue Checks Results - ${{ steps.jira-checks.outputs.result }}"
```
