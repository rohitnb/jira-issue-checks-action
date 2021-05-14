# JIRA Check - Assign

This action checks if the JIRA Issue is assigned or not

## Inputs

### `jira-issue`

**Required** The JIRA issue number in the format XYZ-123. Default `null`

### `jira-token`

**Required** The JIRA token. To set this token - form the string `<jira-email-address>:<jira-api-token>` and Base64 encode it. For example `abc@xyz.com:7h1s1smyJIRAt0k3n`

## Outputs

### `jira-assigned`

Binary flag - Assigned/True; Unassigned/False

## Example usage
```
uses: preacherlemon/jira-assign-action@v1
with:
  jira-issue: 'XYZ-123'
  jira-token: ${{secrets.JIRA_TOKEN}}
```
