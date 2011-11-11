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
 * Event handler for when a field that is being hashed gains focus; replaces the hashed value of the password with the
 * original password.
 * @param {jQuery.Event} event Data for the input event.
 */
function field_focus(event) {
	var field = $(this);	
	field.val(field.data("__passhash_input"));
}

/**
 * Event handler for when a field that is being hashed has a key press; if the Enter key is pressed, it fires the blur
 * event which hashes the password.
 * @param {jQuery.Event} event Data for the input event.
 */
function field_keypress(event) {
	if (event.which == 13)
		$(this).blur();
}

/**
 * Event handler for when a field that is being hashed loses focus; saves the password that the user put in and updates
 * the value of the field with the hashed password.
 * @param {jQuery.Event} event Data for the input event.
 */
function field_blur(event) {
	var field = $(this);
	
	field.data("__passhash_input", field.val());
	hashField(field);
}

/**
 * Event handler for when a field that is being hashed has its value changed; saves the original password that the user
 * entered.
 * @param {jQuery.Event} event Data for the input event.
 */
function field_change(event) {
	var field = $(this);
	field.data("__passhash_input", field.val());
}

/**
 * Called when we want to start automatically hashing the password value in the field.
 * @param {jQuery} field Field that we want to start hashing.
 */
function startHashingField(field) {
	// If the field does not have focus, hash its password
	if (!field.is(":focus"))
		hashField(field);

	// Don't bother re-doing the event bindings if the field is already being hashed
	if (field.attr("passhash") == "true")
		return;

	field.attr("passhash", "true");
	
	// Bind the field to the various event handlers
	field.bind("focus", field_focus);
	field.bind("blur", field_blur);
	field.bind("change", field_change);
	field.bind("keypress", field_keypress);
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

	// Unbind the field from the various event handlers	
	field.unbind("focus", field_focus);
	field.unbind("blur", field_blur);
	field.unbind("change", field_change);
	field.unbind("keypress", field_keypress);
}

/**
 * Hashes the value of the given field and replaces its value with the hashed version.
 * @param {jQuery} field Field whose value we are to hash.
 */
function hashField(field) {
	var input = field.data("__passhash_input"); 
		
	if (input != "" && !(typeof input == "undefined"))
		field.val(generateHash(config, input));
}

port.onMessage.addListener(function (message) {
	if (message.type == "updateConfig") {
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
	
	// Change the type of the field between text and password if the user wants to see the hashed value
	else if (message.type == "showHideValue")
		focusedField[0].type = focusedField[0].type == "text" ? "password" : "text";
});

// Send an init message indicating that everything is ready
port.postMessage({
	type: "init"
});