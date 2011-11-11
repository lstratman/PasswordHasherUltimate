/**
 * Tests to see if this string starts with the given string.
 * @param {String} startsWithString The string that this string needs to start with.
 * @returns {Boolean} True if this string starts with the given string, false otherwise.
 */
String.prototype.startsWith = function (startsWithString) {
	return (this.match ("^" + startsWithString) == startsWithString);
}

/**
 * Returns the rest of the string (if any) that occurs after the first instance of the search value.
 * @param {String} afterString Search value to use when determining how much of the string to return.
 * @returns {String} Rest of the string following the first instance of the search string if it was found, null otherwise.
 */
String.prototype.substringAfter = function (afterString) {
	return (this.substring(this.indexOf(afterString) + afterString.length));
}

/**
 * Returns the index within the array (if any) of the first instance of the search value.
 * @param {Object} searchValue The value that we should search the array for.
 * @returns {Integer} Index within the array of the first instance of the search value if found, -1 otherwise.
 */
Array.prototype.indexOf = function (searchValue) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == searchValue)
			return i;
	}
	
	return -1;
}

/**
 * A poor man's implementation of GUID generation, this creates a GUID-format string comprised of random
 * base-16 values.
 * @returns {String} A GUID-format string comprised of random base-16 values.
 */
function generateGuid() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(currentCharacter) {
		var random = Math.random() * 16 | 0, randomCharacter = currentCharacter == 'x' ? random : (random & 0x3 | 0x8);
		return randomCharacter.toString (16);
	}).toUpperCase ();
}

/**
 * Hashes the given password with the parameters and site name defined within the config.
 * @param {Object} config Configuration, including the site name and hashing parameters, that we should use to hash the input.
 * @returns {String} The hashed value of the input.
 */
function generateHash(config, input) {
	var siteName = config.siteName;

	// Append the "bump" value to the site name
	if (config.version > 1)
		siteName += ":" + config.version;

	// If we're not using compatibility mode, hash the site name with the private key before using it to hash the input;
	// this helps to defeat JavaScript keyloggers
	if (!config.compatibilityMode)
		siteName = PassHashCommon.generateHashWord(config.seed, siteName, 24, true, true, true, false, false);

	return PassHashCommon.generateHashWord(siteName, input, config.size, config.includeDigits, config.includePunctuation, config.includeMixedCase, config.noSpecialCharacters, config.digitsOnly);
}

/**
 * Loads the default hashing configuration.
 * @returns {Object} The default configuration from the local storage or a freshly-instantiated version of it from stock
 * values if it doesn't exist.
 */
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

/**
 * Gets the private key set by the user from storage.
 * @returns {String} The private key from storage if it exists, or a freshly generated GUID otherwise.
 */
function getSeed() {
	var seed = localStorage["privateSeed"]

	// No private seed generated, create one
	if (!seed)
		seed = localStorage["privateSeed"] = generateGuid();
		
	return seed;
}

if (Storage) {
	/**
	 * Puts an object into the local storage in JSON format.
	 * @param {String} key The lookup key for the object.
	 * @param {Object} value The object that needs to be persisted.
 	 */
	Storage.prototype.setObject = function(key, value) {
		this.setItem(key, JSON.stringify(value));
	}
	
	/**
	 * Gets an object from local storage and deserializes it from JSON.
	 * @param {String} key The lookup key for the object.
	 * @returns {Object} The deserialized version of the object if it exists, null otherwise.
 	 */
	Storage.prototype.getObject = function(key) {
		var jsonObject = this.getItem(key);
	
		if (jsonObject == null)
			return null;
	
		return JSON.parse(jsonObject);
	}
}