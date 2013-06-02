define([
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/dom-attr',
	'dijit/form/_ComboBoxMenu'
], function(array, declare, domConstruct, domAttr, _ComboBoxMenu) {

	return declare([_ComboBoxMenu], {

		// TODO: find better solution to get store target url
		url: '/library/rfe/php/controller.php',

		/**
		 * Creates an option to appear on the popup menu.
		 * @param {Object} obj store object
		 * @return {HTMLTableRowElement}
		 */
		_createOption: function(obj) {

			var menuItem = this._createMenuItem();

			// TODO: add more info, e.g. path
			menuItem.innerHTML = obj.name + '<br>' +
				'/' + this.url + '/' + obj.path + '<br>' +
				'<span class="rfeSearchBoxItemLabel">Date modified:</span> ' + obj.mod + ', <span class="rfeSearchBoxItemLabel">Size:</span> ' + obj.size;

			return menuItem;
		}

	});
});
