define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/dom-attr',
	'dojo/on',
	'dijit/form/_ComboBoxMenu'
], function(lang, array, declare, domConstruct, domAttr, on, _ComboBoxMenu) {

	return declare([_ComboBoxMenu], {
		// TODO: find better solution to get store target url
		target: require.toUrl('rfe-php') + '/services/filesystem.php/',

		postCreate: function() {
			this.inherited(arguments);
			this.on('focus', lang.hitch(this, function() {
				this.select();
			}));
		},

		/**
		 * Creates an option to appear on the popup menu.
		 * @param {Object} obj store object
		 * @return {HTMLTableRowElement}
		 */
		_createOption: function(obj) {

			var menuItem = this._createMenuItem();

			// TODO: add more info, e.g. path
			menuItem.innerHTML = obj.name + '<br>' +
				'/' + this.target + '/' + obj.path + '<br>' +
				'<span class="rfeSearchBoxItemLabel">Date modified:</span> ' + obj.mod + ', <span class="rfeSearchBoxItemLabel">Size:</span> ' + obj.size;

			return menuItem;
		}


	});
});
