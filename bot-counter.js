// to read the settings file
var PropertiesReader = require('properties-reader');

// to interact with Discord
const Discord = require('discord.js');

// to write in files
var fs = require("fs");
// to eval expressions
var math = require("mathjs");

var properties;
try {
    properties = PropertiesReader('settings.properties')
} catch (err) {
    console.log("You need to create a settings.properties file in the application folder. See README for more informations.");
    process.exit(1);
};

// initialize the bot
const bot = new Discord.Client();

const token = properties.get('token');
if (!token) {
    console.log("settings.properties file is missing a 'token = <your token>' line. Check README if you don't know how to get your token.");
    process.exit(1);
};

// retrieve the ownerID from the config file
var ownerID = properties.get('ownerID');

// retrieve the prefix for the bot
var prefix;
try {
    prefix = properties.get('prefix');
} catch (err) {
    console.log("Adding setting 'prefix' to settings.properties");
    properties.set('prefix', '!');
    prefix = "!";
};

// the regex we will use to check if the name is valid
var inputFilter = /^[A-Za-z0-9]+$/;
// the regex we will use to replace user mentions in message
var mentionFilter = /\s(<?@\S+)/g;

// this is a counter prototype
// we do not directly use it in the code as the references in javascript are weird
var dummy = {
    owner: '0',
    value: 0,
    step: 1,
    name: 'dummy',
    textView: 'Value of %name% : %value%',
    textPlus: 'The value of %name% has been incremented. New value : %value%.',
    textMinus: 'The value of %name% has been decremented. New value : %value%.',
    textReset: 'The value of %name% has been reset to %value%.',
    textValue: 'The value of %name% has been set to %value%.',
    textLeaderboard: 'Current leaderboard for %name% :',
    leaderboard: {}
};

var userLeaderboardDummy = {
    id: '0',
    username: 'dummy',
    value: 0
};

var counters;
try {
    counters = require('./counters.json');
} catch (err) {
    console.log(err);
    counters = {};
}

bot.on('ready', () => {
    console.log(' -- LOADED -- ');
});

bot.on('message', message => {

    if (message.content.startsWith(prefix) && message.content.length > 1) {
        message.content = message.content.replace(mentionFilter, "");
        var content = message.content.split(" ");

        if (message.content.startsWith(prefix + 'addcounter') || message.content.startsWith(prefix + 'ac')) {
            if (content.length == 2) {
                var state = addCounter(message.author.id, content[1]);
                if (state == 1) {
                    message.channel.sendMessage('The counter has been correctly added.\r\nYou can use it with !' + content[1] + ' [ + | - ].');
                } else if (state == 2) {
                    message.channel.sendMessage('A counter with this name already exists, please choose another one.');
                } else if (state == 3) {
                    message.channel.sendMessage('Your counter name contains illegal characters. Please match /^[A-Za-z0-9]+$/.');
                }
            }
        } else if (message.content.startsWith(prefix + 'delcounter') || message.content.startsWith('!dc')) {
            if (content.length == 2) {
                var state = delCounter(message.author.id, content[1]);
                if (state == 1) {
                    message.channel.sendMessage('The counter has been correctly deleted.');
                } else if (state == 2) {
                    message.channel.sendMessage('There is no counter with this name.');
                } else if (state == 3) {
                    message.channel.sendMessage('You are not the owner of this counter.');
                }
            }
        } else if (message.content == prefix + "log") {
            console.log(counters);
        } else if (message.content == prefix + "cleardb") {
            if (message.author.id == ownerID) {
                counters = {};
                message.channel.sendMessage('Local database has been cleared.');
                saveToDisk();
            } else {
                message.channel.sendMessage('Sorry, only the owner can do this.');
            }
        } else if (message.content == prefix + "stop" || message.content == prefix + "exit") {
            if (message.author.id == ownerID) {
                message.channel.sendMessage('Stopping');
                bot.logout();
                process.exit(0);
            } else {
                message.channel.sendMessage('Sorry, only the owner can do this.');
            }
        } else if (message.content == prefix + "upgradecounters") {
            if (message.author.id == ownerID) {
                upgradeCounters();
                message.channel.sendMessage('Counters have been upgraded. You MUST restart the bot, or weird behaviour could happen.');
                saveToDisk();
            } else {
                message.channel.sendMessage('Sorry, only the owner can do this.');
            }
        } else if (message.content == prefix + "uid") {
            message.channel.sendMessage('Your UID is : ' + message.author.id)
        } else if (message.content == prefix + "counterhelp") {
            message.channel.sendMessage('Command list : https://github.com/Starwort/bot-counter/blob/master/README.md');
        } else if (message.content == prefix + "listcounters") {
            var output = '```\r\n';
            for (var key in counters) {
                output += counters[key].name + '\r\n';
            }
            output += '```';
            message.channel.sendMessage(output);
        } else {
            var counterName = content[0].substring(1);
            if (counters[counterName]) {
                if (content.length == 1) {
                    message.channel.sendMessage(getTextView(counterName));
                } else {
                    if (content[1].startsWith('+')) {
                        if (setValue(counterName, content[1].length == 1 ? "1" : message.content.substring(content[0].length + 2), '+', message.mentions.users)) {
                            message.channel.sendMessage(getTextPlus(counterName));
                        } else {
                            message.channel.sendMessage("There was an error parsing your input.");
                        }
                    } else if (content[1].startsWith('-')) {
                        if (setValue(counterName, content[1].length == 1 ? "1" : message.content.substring(content[0].length + 2), '-', message.mentions.users)) {
                            message.channel.sendMessage(getTextMinus(counterName));
                        } else {
                            message.channel.sendMessage("There was an error parsing your input.");
                        }
                    } else if (content[1] == 'reset') {
                        resetValue(counterName);
                        message.channel.sendMessage(getTextReset(counterName));
                    } else if (content[1] == 'value') {
                        if (content[2]) {
                            if (setValue(counterName, message.content.substring(content[0].length + 1 + content[1].length + 1), '=')) {
                                message.channel.sendMessage(getTextValue(counterName));
                            } else {
                                message.channel.sendMessage("There was an error parsing your input.");
                            }
                        }
                    } else if (content[1] == 'edit') {
                        if (counters[counterName][content[2]]) {
                            var newValue = message.content.substr(message.content.indexOf(content[2]) + content[2].length + 1);
                            setCounterText(counterName, content[2], newValue);
                            message.channel.sendMessage('Property ' + content[2] + ' has been changed.');
                        }
                    } else if (content[1] == 'show') {
                        if (counters[counterName][content[2]]) {
                            message.channel.sendMessage(content[2] + ' : ' + counters[counterName][content[2]]);
                        }
                    } else if (content[1] == 'leaderboard') {
                        var sortable = [];

                        for (var key in counters[counterName].leaderboard) {
                            sortable.push(counters[counterName].leaderboard[key]);
                        }

                        sortable.sort(function (a, b) {
                            return b.value - a.value;
                        });

                        var output = '```\r\n';
                        output += getTextLeaderboard(counterName) + '\r\n\r\n';
                        for (var i = 0; i < sortable.length; i++) {
                            output += (i + 1) + '. ' + sortable[i].username + ' : ' + sortable[i].value + '\r\n';
                        }
                        output += '```';
                        message.channel.sendMessage(output);

                    } else if (content[1] == 'clearleaderboard') {
                        if (message.author.id == ownerID) {
                            counters[counterName].leaderboard = {};
                            message.channel.sendMessage('Leaderboard for ' + counterName + ' has been cleared.');
                            saveToDisk();
                        } else {
                            message.channel.sendMessage('Sorry, only the owner can do this.');
                        }
                    }
                    saveToDisk();
                }
            }
        }
    }

});

bot.login(token);

function addCounter(id, title) {
    if (inputFilter.test(title) && title != "addcounter" && title != "delcounter") {
        if (counters[title]) {
            return 2;
        } else {
            counters[title] = {
                owner: id,
                value: 0,
                step: 1,
                name: title,
                textView: 'Value of %name% : %value%',
                textPlus: 'The value of %name% has been incremented. New value : %value%.',
                textMinus: 'The value of %name% has been decremented. New value : %value%.',
                textReset: 'The value of %name% has been reset to %value%.',
                textValue: 'The value of %name% has been set to %value%.',
                textLeaderboard: 'Current leaderboard for %name% :',
                leaderboard: {}
            };
            saveToDisk();
            return 1;
        }
    } else {
        return 3;
    }
}

function getTextView(title) {
    return counters[title].textView.replace('%name%', counters[title].name).replace('%value%', counters[title].value);
}

function getTextPlus(title) {
    return counters[title].textPlus.replace('%name%', counters[title].name).replace('%value%', counters[title].value);
}

function getTextMinus(title) {
    return counters[title].textMinus.replace('%name%', counters[title].name).replace('%value%', counters[title].value);
}

function getTextReset(title) {
    return counters[title].textReset.replace('%name%', counters[title].name).replace('%value%', counters[title].value);
}

function getTextValue(title) {
    return counters[title].textValue.replace('%name%', counters[title].name).replace('%value%', counters[title].value);
}

function getTextLeaderboard(title) {
    return counters[title].textLeaderboard.replace('%name%', counters[title].name).replace('%value%', counters[title].value);
}

function setCounterText(title, textToChange, newText) {
    counters[title][textToChange] = newText;
}

function resetValue(title) {
    setValue(title, dummy.value, '=', []);
}

//
function setValue(title, value, operator, mentions) {
    try {
        var val = math.eval(value);

        // ensure that each mentionned user is present in the leaderboard, creating them when needed

        mentions.forEach(function (value2) {
            if (!counters[title].leaderboard[value2.id]) {
                counters[title].leaderboard[value2.id] = {
                    id: value2.id,
                    username: value2.username,
                    value: 0
                };
            }
        });

        switch (operator) {
            case '+':
                counters[title].value += val;
                mentions.forEach(function (value) {
                    counters[title].leaderboard[value.id].value += val;
                });
                break;
            case '-':
                counters[title].value -= val;
                mentions.forEach(function (value) {
                    counters[title].leaderboard[value.id].value -= val;
                });
                break;
            case '=':
                counters[title].value = val;
                mentions.forEach(function (value) {
                    counters[title].leaderboard[value.id].value = val;
                });
                break;
        }
        return true;
    } catch (err) {
        return false;
    }
}

function getValue(title) {
    // since the value can be invalide due to the edit command, we check that it is an integer and reset it when needed
    var val = parseInt(counters[title].value);
    if (isNaN(val)) {
        counters[title].value = val = 0;
    }
    return val;
}

function getStep(title) {
    // since the value of step can be invalide due to the edit command, we check that it is an integer and reset it when needed
    var val = parseInt(counters[title].step);
    if (isNaN(val)) {
        counters[title].step = val = 1;
    }
    return val;
}

function delCounter(id, title) {
    if (inputFilter.test(title)) {
        if (counters[title]) {
            if (id != counters[title].owner && id != OwnerID) {
                return 3;
            } else {
                delete counters[title];
                return 1;
            }
        } else {
            return 2;
        }

    } else {
        return 2;
    }
}

function saveToDisk() {
    fs.writeFile('counters.json', JSON.stringify(counters), "utf8");
}

// this function take the existing counters and upgrade them to the newest counter prototype
function upgradeCounters() {
    for (var key in counters) {
        if (!counters.hasOwnProperty(key)) continue;

        for (var key2 in dummy) {
            if (!dummy.hasOwnProperty(key2)) continue;

            if (!counters[key][key2]) {
                counters[key][key2] = dummy[key2];
            }

        }

    }
}
