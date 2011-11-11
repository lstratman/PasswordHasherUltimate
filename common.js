String.prototype.startsWith = function (startsWithString) {
	return (this.match ("^" + startsWithString) == startsWithString);
}

String.prototype.substringAfter = function (afterString) {
	return (this.substring(this.indexOf(afterString) + afterString.length));
}

Array.prototype.indexOf = function (searchValue) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == searchValue)
			return i;
	}
	
	return -1;
}

function generateGuid() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(currentCharacter) {
		var random = Math.random() * 16 | 0, randomCharacter = currentCharacter == 'x' ? random : (random & 0x3 | 0x8);
		return randomCharacter.toString (16);
	}).toUpperCase ();
}

function generateHash(config, input) {
	var siteName = config.siteName;

	if (config.version > 1)
		siteName += ":" + config.version;

	if (!config.compatibilityMode)
		siteName = PassHashCommon.generateHashWord(config.seed, siteName, 24, true, true, true, false, false);

	return PassHashCommon.generateHashWord(siteName, input, config.size, config.includeDigits, config.includePunctuation, config.includeMixedCase, config.noSpecialCharacters, config.digitsOnly);
}

function getDefaultConfig() {
	var defaultConfig = localStorage.getObject("defaultConfig");

	if (defaultConfig == null) {
		defaultConfig = {
			includeDigits: true,
			includePunctuation: true,
			includeMixedCase: true,
			noSpecialCharacters: false,
			digitsOnly: false,
			size: 8,
			version: 1,
			compatibilityMode: false,
			seed: getSeed(),
			fields: new Array()
		};
		
		localStorage.setObject("defaultConfig", defaultConfig);
	}
	
	return defaultConfig;
}

function getSeed() {
	var seed = localStorage["privateSeed"]

	// No private seed generated, create one
	if (!seed)
		seed = localStorage["privateSeed"] = generateGuid();
		
	return seed;
}

if (Storage) {
	Storage.prototype.setObject = function(key, value) {
		this.setItem(key, JSON.stringify(value));
	}
	
	Storage.prototype.getObject = function(key) {
		var jsonObject = this.getItem(key);
	
		if (jsonObject == null)
			return null;
	
		return JSON.parse(jsonObject);
	}
}