## JIRA Check - Assign

This action checks if the JIRA Issue is assigned or not

### Inputs

#### `jira-issue`

**Required** The JIRA issue number in the format XYZ-123. Default `null`

#### `jira-token`

**Required** The JIRA token. To set this token - form the string `<jira-email-address>:<jira-api-token>` and Base64 encode it. For example `abc@xyz.com:7h1s1smyJIRAt0k3n`

### Outputs

#### `jira-assigned`

Binary flag - Assigned/True; Unassigned/False

### Example usage
```
uses: preacherlemon/jira-assign-action@v1
with:
  jira-issue: 'XYZ-123'
  jira-token: ${{secrets.JIRA_TOKEN}}
```
### Demo workflow file for Pull Requests
```
name: 'JIRA Check - Assign'
on: 
  pull_request:
    types: [opened,edited]

jobs:
  jira-assign-check:
    runs-on: ubuntu-latest
    name: Check if JIRA Issue is assigned
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Check if JIRA Issue is assigned
        id: jira-assign
        uses: ./
        with:
          jira-issue: 'INTEG-2'
          jira-token: ${{secrets.JIRA_TOKEN}}
      # Use the output from the `hello` step
      - name: JIRA Assign Check Results
        run: echo "JIRA Assign Results - ${{ steps.jira-assign.outputs.jira-assigned }}"
```
