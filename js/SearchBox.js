define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dijit/form/ComboBox',
	'rfe/_SearchBoxMenu',
	'dojo/store/JsonRest',
	'dojo/when'
], function(lang, declare, ComboBox, _SearchBoxMenu, JsonRest, when) {

	return declare([ComboBox], {
		value: 'search',
		searchAttr: 'name',
		pageSize: 4,
		searchDelay: 100,
		highlightMatch: 'all',
		ignoreCase: true,
		autoComplete: false,
		selectOnClick: true,
		store: null,
		rfe: null,
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
		},

		postCreate: function() {
			this.inherited('postCreate', arguments);

			var rfe = this.rfe;

			this.on('change', function() {
				var file = this.item;

				if (file.dir) {
					rfe.display(file);
				}
				else {
					when(rfe.store.get(file.parId), function(object) {
						rfe.display(object).then(function() {
							var row = rfe.grid.row(file.id);
							rfe.grid.select(row);
						});
					});
				}
			});
			this.on('input', function(evt) {
				if (evt.keyCode === 13) {
					evt.preventDefault();
					evt.stopPropagation();
				}
			});
		}
	});
});

