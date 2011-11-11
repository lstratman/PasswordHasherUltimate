/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Password Hasher Plus
 *
 * The Initial Developer of the Original Code is Eric Woodruff.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): (none)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var portsByTabId = new Array();
var menuItemLengths = new Object();

chrome.extension.onConnect.addListener (function (port) {
	console.assert(port.name == "passhashultimate");
	
	port.onMessage.addListener (function (message) {
		// Add the tab port to the collection and send back the config for that site
		if (message.type == "init") {
			portsByTabId[port.tab.id] = port;
			
			port.siteName = getSiteName(port.tab.url);
			port.postMessage({
				type: "updateConfig",
				config: loadConfig(port.siteName)
			});
		} 
		
		// Create the context menus for the given tab based on its configuration
		else if (message.type == "addContextMenus") {
			chrome.contextMenus.removeAll();
			addContextMenus(loadConfig(port.siteName), message.fieldId, message.show);
		}
		
		// Kill all the context menus
		else if (message.type == "removeContextMenus")
			chrome.contextMenus.removeAll();
	});

	port.onDisconnect.addListener (function (event) {
		portsByTabId.splice(port.tab.id, 1);		
		console.log("Removed " + port.tab.id);
	});
});

/**
 * Creates the context menus for the given config.
 * @param {Object} config The site configuration that the context menus should be based on.
 * @param {String} fieldId The identifier of the field that the user is focused on when they right-clicked
 * to bring up the context menu.
 * @param {Boolean} show Flag indicating whether or not the user has chosen to show the value of the focused
 * password field.
 */
function addContextMenus(config, fieldId, show) {
	// Create the various context menu entries based on the configuration values
	var topLevelMenu = chrome.contextMenus.create({
		title: "Password hashing",
		contexts: ["all"]
	});
	
	chrome.contextMenus.create({
		title: "Enabled",
		type: "checkbox",
		contexts: ["all"],
		checked: config.fields.indexOf(fieldId) != -1,
		parentId: topLevelMenu,
		onclick: function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);
			
			if (info.checked && config.fields.indexOf(fieldId) == -1)
				config.fields.push(fieldId);
				
			else if (!info.checked && config.fields.indexOf(fieldId) != -1)
				config.fields.splice(config.fields.indexOf(fieldId), 1);
			
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		title: "Use compatibility mode",
		type: "checkbox",
		contexts: ["all"],
		checked: config.compatibilityMode,
		parentId: topLevelMenu,
		onclick: function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.compatibilityMode = info.checked;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		type: "separator",
		contexts: ["all"],
		parentId: topLevelMenu
	});
	
	chrome.contextMenus.create({
		title: "Include digits",
		type: "checkbox",
		checked: config.includeDigits,
		contexts: ["all"],
		parentId: topLevelMenu,
		onclick : function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.includeDigits = info.checked;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		title: "Include punctuation",
		type: "checkbox",
		checked: config.includePunctuation,
		contexts: ["all"],
		parentId: topLevelMenu,
		onclick : function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.includePunctuation = info.checked;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		title: "Include mixed case",
		type: "checkbox",
		checked: config.includeMixedCase,
		contexts: ["all"],
		parentId: topLevelMenu,
		onclick : function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.includeMixedCase = info.checked;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		title: "No special characters",
		type: "checkbox",
		checked: config.noSpecialCharacters,
		contexts: ["all"],
		parentId: topLevelMenu,
		onclick : function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.noSpecialCharacters = info.checked;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		title: "Digits only",
		type: "checkbox",
		contexts: ["all"],
		checked: config.digitsOnly,
		parentId: topLevelMenu,
		onclick : function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.digitsOnly = info.checked;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		type: "separator",
		contexts: ["all"],
		parentId: topLevelMenu
	});

	chrome.contextMenus.create({
		title: "Bump version",
		contexts: ["all"],
		parentId: topLevelMenu,
		onclick: function (info, tab) {
			var port = portsByTabId[tab.id];
			var config = loadConfig(port.siteName);

			config.version++;
			saveConfig(port.siteName, config, tab.id);
		}
	});
	
	chrome.contextMenus.create({
		title: show ? "Hide value" : "Show value",
		contexts: ["all"],
		parentId: topLevelMenu,
		onclick: function (info, tab) {
			var port = portsByTabId[tab.id];

			port.postMessage({
				type: "showHideValue"
			});
		}
	});
	
	var lengthMenu = chrome.contextMenus.create({
		title: "Length",
		contexts: ["all"],
		parentId: topLevelMenu
	});
	
	// Create the submenu items for the size of the generated password in a loop
	menuItemLengths = new Object();
	
	for (var i = 4; i <= 26; i += 2) {
		var newMenuItemId = chrome.contextMenus.create({
			title: i.toString(),
			type: "radio",
			contexts: ["all"],
			checked: config.size == i,
			parentId: lengthMenu,
			onclick: function (info, tab) {
				var port = portsByTabId[tab.id];
				var config = loadConfig(port.siteName);

				config.size = menuItemLengths[info.menuItemId];
				saveConfig(port.siteName, config, tab.id);
			}
		});
		
		menuItemLengths[newMenuItemId] = i;
	}
}

/**
 * Loads the configuration for the given site name.
 * @param {String} siteName The site name whose configuration we are to look up.
 * @returns {Object} Configuration from storage matching the given site name if it exists, the default config otherwise.
 */
function loadConfig(siteName) {
	console.log("Loading config for " + siteName);

	// Try to load the config from storage
	var seed = getSeed();
	var config = localStorage.getObject("siteName:" + siteName);

	// Use the default config if it doesn't exist		
	if (config == null)
		config = getDefaultConfig();

	// Set the private key to the value set by the user in the options screen
	config.siteName = siteName;
	config.seed = seed;
	
	// Initialize any missing properties
	if (typeof config.fields == "undefined")
		config.fields = new Array();
		
	if (typeof config.version == "undefined")
		config.version = 1;
	
	return config;
}

/**
 * Generates the short site name identifier for the given url (i.e. google from https://mail.google.com).
 * @param {String} url URL for which we are to generate the site name.
 * @returns {String} Site name for the given URL.
 */
function getSiteName(url) {
	console.log("Getting site name for " + url);
	
	var regEx = new RegExp ("^https?://([^:/]+\\.)?([^.:/]+)\\.([a-z]{2,5})(:\\d+)?/.*$");
	var components = regEx.exec(url);
	
	try {
		if (components[2] == "")
			throw "chrome";
	
		// Return the component immediately before the TLD
		return components[2];
	} 
	
	// If the URL doesn't match our regex, just return a placeholder value
	catch (e) {
		return "chrome";
	}
}

/**
 * Saves the config for the given site to storage.
 * @param {String} siteName The name of the site for which we are saving the config.
 * @param {Object} config Configuration that is being persisted to storage.
 * @param {Integer} tabId Identifier of the tab for which we are saving this config.
 */
function saveConfig(siteName, config, tabId) {
	console.log("Saving config for " + siteName);
	
	localStorage.setObject("siteName:" + siteName, config);

	// Post a message back to the tab indicating whe have refreshed the config
	if (tabId != null)
		portsByTabId[tabId].postMessage({ 
			type: "updateConfig",
			config: config
		});
}