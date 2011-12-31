define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/dom-construct',
	'dijit/Dialog',
	'dijit/form/Button',
	'dijit/form/CheckBox'
], function(lang, declare, Deferred, construct, Dialog, Button, Checkbox) {

	return declare('DialogConfirm', Dialog, {
		okButton: null,
		cancelButton: null,
		skipCheckBox: null,
		hasOkButton: true,
		hasCancelButton: true,
		hasSkipCheckBox: true,
		hasUnderlay: true,
		dfd: null,

		/**
		 * Instantiates the confirm dialog.
		 */
		constructor: function(props) {
			lang.mixin(this, props);
		},

		/**
		 * Creates the OK/Cancel buttons.
		 */
		postCreate: function() {
			this.inherited('postCreate', arguments);

			var remember = false;
			var div = construct.create('div', {
				className: 'dialogConfirm'
			}, this.containerNode, 'last');

			if (this.hasSkipCheckBox) {
				this.skipCheckBox = new Checkbox({
					checked: false
				}, construct.create('div'));
				div.appendChild(this.skipCheckBox.domNode);
				var label = construct.create('label', {
					'for': this.skipCheckBox.id,
					innerHTML: 'Remember my decision and do not ask again.<br/>'
				}, div);
			}
			if (this.hasOkButton) {
				this.okButton = new Button({
					label: 'OK',
					onClick: lang.hitch(this, function() {
						remember = this.hasSkipCheckBox ? this.skipCheckBox.get('checked') : false;
						this.hide();
						this.dfd.resolve(remember);
					})
				}, construct.create('div'));
				div.appendChild(this.okButton.domNode);
			}
			if (this.hasCancelButton) {
				this.cancelButton = new Button({
					label: 'Cancel',
					onClick: lang.hitch(this, function() {
						remember = this.hasSkipCheckBox ? this.skipCheckBox.get('checked') : false;
						this.hide();
						this.dfd.cancel(remember);
					})
				}, construct.create('div'));
				div.appendChild(this.cancelButton.domNode);
			}
		},

		/**
		 * Shows the dialog.
		 * @return {Deferred}
		 */
		show: function() {
			this.inherited('show', arguments);
			if (!this.hasUnderlay) {
				construct.destroy(this.id + '_underlay');	// remove underlay
			}
			this.dfd = new Deferred();
			return this.dfd;
		}
	});
});