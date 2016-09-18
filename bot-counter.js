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
} catch(err) {
	console.log("You need to create a settings.properties file in the application folder. See README for more informations.");
	process.exit(1);
};

// initialize the bot
const bot = new Discord.Client();

const token = properties.get('token');
if(!token) {
	console.log("settings.properties file is missing a 'token = <your token>' line. Check README if you don't know how to get your token.");
	process.exit(1);
};

// retrieve the ownerID from the config file
var ownerID = properties.get('ownerID');

// the regex we will use to check if the name is valid
var inputFilter = /^[A-Za-z0-9]+$/;

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
	/*message.mentions.users.forEach(function (value, key, mapObj) {
	console.log(value.id);
	});*/

	if (message.content.startsWith('!') && message.content.length > 1) {
		var content = message.content.split(" ");

		if (message.content.startsWith('!addcounter') || message.content.startsWith('!ac')) {
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
		} else if (message.content.startsWith('!delcounter') || message.content.startsWith('!dc')) {
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
		} else if (message.content == "!log") {
			console.log(counters);
		} else if (message.content == "!cleardb") {
			if (message.author.id == ownerID) {
				counters = {};
				saveToDisk();
			} else {
				message.channel.sendMessage('Sorry, only the owner can do this.');
			}
		} else if(message.content == "!uid") {
			message.channel.sendMessage('Your UID is : ' + message.author.id)
		} else if(message.content == "!counterhelp") {
			message.channel.sendMessage('Command list : https://github.com/Zeptaxis/bot-counter/blob/master/README.md');
		} else {
			var counterName = content[0].substring(1);
			if (counters[counterName]) {
				if (content.length == 1) {
					message.channel.sendMessage(getTextView(counterName));
				} else {
					if (content[1].startsWith('+')) {
						if(setValue(counterName,message.content.substring(content[0].length+2),'+')) {
							message.channel.sendMessage(getTextPlus(counterName));
						} else {
							message.channel.sendMessage("There was an error parsing your input.");
						}
					} else if (content[1].startsWith('-')) {
						if(setValue(counterName,message.content.substring(content[0].length+2),'-')) {
							message.channel.sendMessage(getTextMinus(counterName));
						} else {
							message.channel.sendMessage("There was an error parsing your input.");
						}
					} else if (content[1] == 'reset') {
						resetValue(counterName);
						message.channel.sendMessage(getTextReset(counterName));
					} else if (content[1] == 'value') {
						if (content[2]) {
							if(setValue(counterName, message.content.substring(content[0].length+1+content[1].length+1), '=')) {
								message.channel.sendMessage(getTextValue(counterName));
							} else {
								message.channel.sendMessage("There was an error parsing your input.");
							}
						}
					} else if (content[1] == 'edit') {
						if (counters[counterName][content[2]]) {
							var newValue = message.content.substr(message.content.indexOf(content[2]) + content[2].length + 1);
							setCounterText(counterName, content[2], newValue);
						}
					} else if (content[1] == 'show') {
						if (counters[counterName][content[2]]) {
							message.channel.sendMessage(content[2] + ' : ' + counters[counterName][content[2]]);
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
				owner : id,
				value : 0,
				step : 1,
				name : title,
				textView : 'Value of %name% : %value%',
				textPlus : 'The value of %name% has been incremented. New value : %value%.',
				textMinus : 'The value of %name% has been decremented. New value : %value%.',
				textReset : 'The value of %name% has been reset to %value%.',
				textValue : 'The value of %name% has been set to %value%.'
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

function setCounterText(title, textToChange, newText) {
	counters[title][textToChange] = newText;
}

function resetValue(title) {
	setValue(title, getValue(title) + 1);
}

//
function setValue(title, value, operator) {
	console.log(value);
	try {
		var val = math.eval(value);
		switch(operator) {
			case '+':
				counters[title].value = counters[title].value + val;
			break;
			case '-':
				counters[title].value = counters[title].value - val;
			break;
			case '=':
				counters[title].value = val;
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
			if (id != counters[title].owner) {
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
