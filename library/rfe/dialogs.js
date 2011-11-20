define([
//	'dojo/_base/lang',
//	'dojo/_base/declare',
//	'dojo/_base/Deferred',
	'dijit/registry',
	'rfe/DialogConfirm'
], function(registry, DialogConfirm) {

	return {

		show: function(type, copy) {
			var dialog;
			switch(type) {
				case 'sameFolder':
					dialog = this.get(type, {
						hasOkButton: false,
						hasSkipCheckBox: false,
						title: copy ? 'Copy' : 'Move' +  ' Folder',
						content: '<p>The destination folder is the same as the source folder.</p>'
               });
					break;
			}
			return dialog.show();
		},

		/**
		 * Returns dialog identified by type.
		 * If dialog does not exist it will be created.
		 * @param {string} type
		 * @param {object} args
		 */
		get: function(type, args) {
			var dialog = !registry.byId('dialog' + this.ucfirst(type));
			if (!dialog) {
				args.id = 'dialog' + this.ucfirst(type);
				dialog = new DialogConfirm(args);
			}
			return dialog;
		},

		/**
		 * Capitalize first letter in string.
		 * @param {string} val
		 */
		ucfirst: function(val) {
			return val.substring(0, 1).toUpperCase() + val.substring(1);
		}


	};
});