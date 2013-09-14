define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'rfe/DialogConfirm',
	'rfe/config/fileObject'
], function(declare, construct, Dialog, fileObject) {

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

		_setContentAttr: function(obj) {
			var prop, strTbl = '<table class="tblFileProperties">';
			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					strTbl += '<tr><td>' + fileObject.label[prop] + ':</td><td>' + (fileObject.formatter[prop] ? fileObject.formatter[prop](obj[prop]) : obj[prop]) + '</td>';
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