# bot-counter
A Discord bot that can count things.

#### Installation
 - Download [Node.js][Node.js] **Version 6.0.0 or more**
 - Open a command prompt and type :  
    - `npm install --save discord.js --production --no-optional`
    - `npm install properties-reader`
 - Edit the `settings.properties` file and add your Discord API token. While you are at it, you can add your ID in the file so the bot know you are its owner. If you don't know how to get your ID, check next section.
 - You can get your Discord API token [here][Discord API]. You need to create a new application, then create a bot user, then your token will be available in the `APP BOT USER` section.
 - To invite your bot to your server, copy the following link and replace the `12345678` with the `Client ID` you can find on your application's page. `https://discordapp.com/oauth2/authorize?client_id=12345678&scope=bot&permissions=66186303`
 - To run the bot, just open a command prompt in the bot folder and type `node bot-counter.js`
 - To stop the bot, press `Ctrl + C`

###### How to get your ID
 - Run the bot and add it to your server
 - Type `!uid` in a channel that the bot can access
 - Copy your ID in the `settings.properties` file next to `ownerID = `
 - Restart the bot for changes to work.

#### Usage
You can create counters with the `!addcounter name` command.  
You can then show the counter with `!name` and interact with it with `!name +` or `!name -`.

Full documentation will come soon !


[Node.js]: https://nodejs.org/
[Discord API]: https://discordapp.com/developers/applications/me
