# debrief-bot

## How the bot works

The discord bot features ephemeral and private voice channel creation, using invites to add users to the channel.

**Workflow** : \
The discord member *Member1* connects to the "Créer un vocal débrief" channel \
debrief-bot creates a "<Member1_username - Débrief>" voice channel. \
debrief-bot overwrites permissions : no one can see the channel except *Member1* and debrief-bot, the latter gains moderation permissions. \
Default permissions for members inside a voice channel are view channel, connect, send voice messages, speak. \
debrief-bot mentions *Member1* inside the channel with a text message, explaining how to invite other members. \
*Member1* uses slash command `/inviter_debrief` with at least one required option to mention another member to invite in the voice channel. \
*Member2* gains permission to the voice channel from debrief-bot. \
debrief-bot mentions *Member2* in a text message in the voice channel to draw attention to the voice channel. \
debrief-bot reacts to the message with a door emoji. \
*Member2* can react with the door emoji to the message anytime to leave and lose access to the voice channel. \
If *Member2* was connected to the voice channel, they get disconnected when they react with the door emoji to the message. \
When the voice channel is empty, debrief-bot deletes it.

At launch time, debrief-bot checks if "Créer un vocal débrief" voice channel is created and also detects already created debrief voice channels to keep them in memory.

## How to run the bot

1. Copy config_template.json and rename the copy to config.json
2. Fill in the fields :
    * token : your Discord bot secret token
    * appId : your Discord bot application id
    * guildId : your Discord server guild id
3. Invite your bot to your discord server with the following permissions :
    * scope : bot
    * permissions (1099796909136) :
        * manage channels
        * manage roles
        * read messages/view channels
        * moderate members
        * send messages
        * read message history
        * add reactions
        * move members
4. Run the bot :
    * `npm install`
    * `node ./index.js`

## Known issues
* debrief-bot does not save door emoji / invited member couples in memory and cannot retrieve them at launch if they already exist. \
This means that if debrief channels with invited members already exist at launch time, invited members will not be able to use the door emoji inside the debrief-bot text message. A new debrief voice channel will be needed for this feature to work.