/**
 * Module containing a class to create a search box in the toolbar.
 */
define([
	'dojo/_base/declare',
	'dijit/form/ComboBox',
	'dojo/store/JsonRest',
	'dojo/when',
	'rfe/util/stringUtil'
], function(declare, ComboBox, JsonRest, when, stringUtil) {

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
		labelType: 'html',

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

			// display selected folder or file in grid and tree
			this.on('change', function() {
				var file = this.item;

				if (!file) {
					// nothing selected
					return;
				}

				if (file.dir) {
					rfe.display(file);
					// TODO: set focus in tree
					//focusNode()
				}
				else {
					when(rfe.store.get(file.parId), function(object) {
						rfe.display(object).then(function() {
							var grid = rfe.grid,
								row = grid.row(file.id),
								cell = grid.cell(file, 'name');

							grid.select(row);
							grid.focus(grid.cellNavigation ? cell : row);
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
		},

		labelFunc: function(obj) {
			return obj.name + '<br>' +
				this.target + '/' + obj.path + '<br>' +
				'<span class="rfeSearchBoxItemLabel">Date created:</span> ' + stringUtil.formatDate(obj.cre) +
				', <span class="rfeSearchBoxItemLabel">Date modified:</span> ' + stringUtil.formatDate(obj.mod) + '<br>' +
				'<span class="rfeSearchBoxItemLabel">Size:</span> ' + stringUtil.formatFileSize(obj.size);
		}

	});
});

