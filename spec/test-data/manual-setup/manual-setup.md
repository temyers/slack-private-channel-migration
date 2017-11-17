Manual setup to configure test data.
Once created, don't post to the channel

Create the private channel: slack-int-existing

Post messages as the following users:

| user            | message           | metadata |
| alice.adams     | This is a message | |
| charlie.chaplin | This is a file with a comment   | file.txt |
| alice.adams     |                                 | file.txt |
| alice.adams     | This is a snippet               | title=Snippet Title, comment=, type=plain text |
| alice.adams     | A snippet with no title/comment | |
| alice.adams     | echo "A snippet with a comment" | title=Title, comment="A comment", type="shell" |
| alice.adams     | A post | type=post, title="A Post" |
| alice.adams     | A thread |
| charlie.chaplin | Reply to a thread | a reply |
| charlie.chaplin | Yet another message |

Get details of the users:

curl -X GET -H 'Content-type: application/json' "https://slack.com/api/users.list?token=$TEAM_A_TOKEN" | json_pp | egrep "\{|id|display_name|\}" > spec/test-data/integration-test-users.json

Get list of groups:
curl -X GET -H 'Content-type: application/json' "https://slack.com/api/groups.list?token=$TEAM_A_TOKEN" | json_pp

Output sample messages:
curl -X GET -H 'Content-type: application/json' "https://slack.com/api/groups.history?token=$TEAM_A_TOKEN&channel=G7Y0PA3SB" | json_pp > spec/test-data/manual-setup/slack-int-existing.json
