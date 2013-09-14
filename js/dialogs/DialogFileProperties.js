define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'rfe/DialogConfirm',
	'rfe/util/stringUtil'
], function(declare, construct, Dialog, stringUtil) {

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
				if (fileObj.hasOwnProperty(prop)) {
					// TODO: create a property - label object and use that to map prop to label / formatter throughout rfe
					var label, value = fileObj[prop];
					switch (prop) {
						case 'parId':
							label = 'Parent id';
							break;
						case 'dir':
							label = 'Directory';
							break;
						case 'cre':
							label = 'Created';
							value = stringUtil.formatDate(value);
							break;
						case 'mod':
							label = 'Modified';
							value = stringUtil.formatDate(value);
							break;
						case 'size':
							label = 'Size';
							value = stringUtil.formatFileSize(value);
							break;
						default:
							label = stringUtil.ucFirst(prop);
					}
					strTbl += '<tr><td>' + label + ':</td><td>' + value + '</td>';
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