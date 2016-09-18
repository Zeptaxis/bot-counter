# bot-counter

A Discord bot that can count things.

#### Installation
 - Download [Node.js][Node.js] **Version 6.0.0 or more**
 - Open a command prompt and type :  
    - `npm install --save discord.js --production --no-optional`
    - `npm install properties-reader`
    - `npm install mathjs`
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
Create counters with the `!addcounter name` command.  
Show the counter's value with `!name`.  
Interact with it with `!name +` or `!name -`.  
Mathematics are supported : `!name +5*2+3` will add 13 to `name`.

#### Customization
You can customize each counter with `!name edit property newValue`, where `property` can be one of the following :
 - `step` : The step that is used when you type `!counter +`. Must be an integer or it will be reset to 1.
 - `textView` : The text displayed when you call `!counter`.
 - `textPlus` : The text displayed when you call `!counter +...`.
 - `textMinus` : The text displayed when you call `!counter -...`.
 - `textReset` : The text displayed when you call `!counter reset`.
 - `textValue` : The text displayed when you call `!counter value ...`.

All the text properties can contain some variables that will be dynamically replaced. These are :
 - `%value%` : will be replaced by the counter's current value.
 - `%name%` : will be replaced by the counter's name.

##### Examples
Create a counter : `!addcounter badjokes`  
Customize the counter : `!badjokes edit textPlus He did it again. This is the %value% time.`  
Add to the counter : `!badjokes +`
Which will output : `He did it again. This is the 1 time.`  
Delete the counter : `!delcounter badjokes`

---

###### Full documentation will come soon !


[Node.js]: https://nodejs.org/
[Discord API]: https://discordapp.com/developers/applications/me
