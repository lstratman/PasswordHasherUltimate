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