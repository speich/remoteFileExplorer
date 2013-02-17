define([
	'dojo/_base/declare',
	'dijit/form/ComboBox',
	'rfe/_SearchBoxMenu',
	'dojo/store/JsonRest'//,

//	'dijit/_WidgetBase',
//	'dijit/_TemplatedMixin',
//	'dojo/text!rfe/templates/SearchButton.html'
//], function(declare, ComboBox, _WidgetBase, _TemplatedMixin, template) {
], function(declare, ComboBox, _SearchBoxMenu, JsonRest) {

	return declare([ComboBox], {

		//templateString: template,

		searchAttr: 'name',
		pageSize: 4,
		searchDelay: 100,
		highlightMatch: 'all',
		ignoreCase: true,
		autoComplete: false,
		store: null,
		target: '',
		dropDownClass: _SearchBoxMenu,

		constructor: function(args) {
			this.store = new JsonRest({
				target: args.target
			});
		},

		postMixInProperties: function() {
			this.inherited('postMixInProperties', arguments);
			this.baseClass = this.get('baseClass') + ' rfeSearchBox';
		}

	});

});

