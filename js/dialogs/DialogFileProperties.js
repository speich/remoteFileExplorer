define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'rfe/DialogConfirm'
], function(declare, construct, Dialog) {

	/**
	 * @class rfe.DialogFileProperties
	 * @extends {DialogConfirm}
	 * @property {string} type type of dialog
	 * @property {boolean} hasUnderlay create the dialog underlay?
	 */
	return declare(Dialog, /* @lends rfe.DialogFileProperties.prototype */ {

		type: 'fileProperties',
		hasUnderlay: false,
		hasSkipCheckBox: false,
		hasCancelButton: false,

		_setContentAttr: function(fileObj) {
			var prop, strTbl = '<table class="tblFileProperties">';
			for (prop in fileObj) {
				if(fileObj.hasOwnProperty(prop)) {
					strTbl += '<tr><td>' + prop + ':</td><td>' + fileObj[prop] + '</td>';
				}
			}
			strTbl += '</table>';
			this.inherited(arguments, [strTbl]);
		},

		/**
		 * Shows the dialog.
		 * @return {Deferred}
		 */
		show: function() {
			// override to allow to display without underlay
			if (!this.hasUnderlay) {
				construct.destroy(this.id + '_underlay');	// remove underlay
			}
			this.inherited('show', arguments);
		},

		/**
		 * Hides the dialog and then destroys it.
		 * Allows for multiple open dialogs without having to track which ones are open and not amassing a ton of umused dialogs in markup
		 */
		hide: function() {
			this.inherited('hide', arguments);
			this.destroy();
		}
	});
});