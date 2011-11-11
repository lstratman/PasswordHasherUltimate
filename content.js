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

var config;
var focusedField = null;

// Connect to the extension port
var port = chrome.extension.connect({
	name: "passhashultimate"
});

var id = 0;

// Bind a click handler for the right mouse button
$(document).mousedown(function (e) {
	// If we're over a password field or an input field with the passhash attribute set, display the context menus
	if (e.button == 2 && ($(e.target).is(":password") || $(e.target).is("input[passhash]"))) {
		port.postMessage({
			type: "addContextMenus",
			fieldId: e.target.id,
			show: e.target.type == "text"
		});
		
		focusedField = $(e.target);
	}

	// Otherwise, remove them		
	else if (e.button == 2)
		port.postMessage({
			type: "removeContextMenus"
		});
	
	return true;
});

/**
 * Called when we want to start automatically hashing the password value in the field.
 * @param {jQuery} field Field that we want to start hashing.
 */
function startHashingField(field) {
	var password = "";

	// Don't bother re-doing the event bindings if the field is already being hashed
	if (!field.data("__passhash_eventsBound")) {
		field.data("__passhash_eventsBound", "true");

		// Replace the value in the field with the password on focus
		field.bind("focus", function (event) {
			var eventField = $(event.target);	
			
			if (eventField.attr("passhash") == "true")
				eventField.val(password);
		});

		// Save the password and then hash the field's value on blur
		field.bind("blur", function (event) {
			var eventField = $(event.target);

			if (eventField.attr("passhash") == "true") {
				password = eventField.val();
				hashField(eventField);
			}
		});

		// Save the password on change
		field.bind("change", function (event) {
			var eventField = $(event.target);
			
			if (eventField.attr("passhash") == "true")
				password = eventField.val();
		});

		// Fire the blur event (which hashes the password) if the enter button is pressed
		field.bind("keypress", function (event) {
			if (event.which == 13 && $(event.target).attr("passhash") == "true")
				$(event.target).blur();
		});
		
		// Rehash the field with the update config values
		field.bind("updateConfig", function (event) {
			var eventField = $(event.target);
			
			if (!eventField.is(":focus"))
				hashField(eventField);
		});
	}
	
	/**
	 * Hashes the value of the given field and replaces its value with the hashed version.
	 * @param {jQuery} field Field whose value we are to hash.
	 */
	function hashField(field) {
		if (password != "")
			field.val(generateHash(config, password));
	}
	
	// If the field was already being hashed, update its config
	if (field.attr("passhash") == "true")
		field[0].dispatchEvent(updateEvent);
	
	else
		password = field.val();
	
	field.attr("passhash", "true");
}

/**
 * Called when we want to stop hashing a password field.
 * @param {jQuery} field Field that we want to stop hashing.
 */
function stopHashingField(field) {
	// If the field isn't being hashed, don't bother
	if (field.attr("passhash") != "true")
		return;

	field.attr("passhash", "false");
}

/**
 * Called when an update config message is received on the extension port; applies the new config to all 
 * password fields in the document.
 * @param {Object} message Message containing the updated config.
 */
function updateConfig(message) {
	config = message.config;
		
	// Apply the new config to each password field on the screen
	$("input").each(function (index) {
		var field = $(this);

		if (!field.is("[type=password]") && !field.is("input[passhash]"))
			return;

		// Field has no ID, so we will make one
		if (this.id == "")
			this.id = "passhash_" + id++;

		if (message.config.fields.indexOf(this.id) != -1)
			startHashingField(field);

		else
			stopHashingField(field);
	});
}

/**
 * Called when we want to show or hide the value in a password field.
 * @param {Object} message Message that triggered the event.
 */
function showHideValue(message) {
	// Change the type of the field between text and password if the user wants to see the hashed value
	focusedField[0].type = focusedField[0].type == "text" ? "password" : "text";
}

/**
 * Called whenever a message is received on the extension port and routes it to the correct handler.
 * @param {Object} message Message that we received.
 */
function port_message(message) {
	if (message.type == "updateConfig") 
		updateConfig(message);
		
	else if (message.type == "showHideValue")
		showHideValue(message);
}

var updateEvent = document.createEvent("HTMLEvents");
updateEvent.initEvent("updateConfig", true, true);

port.onMessage.addListener(port_message);

// Send an init message indicating that everything is ready
port.postMessage({
	type: "init"
});