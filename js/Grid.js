define([
	'dojo/_base/lang',
	'dojo/Deferred',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/on',
	'dojo/aspect',
	'dojo/topic',
	'dojo/query',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/editor',
	'dgrid/Keyboard',
	'dgrid/extensions/DnD',
	'dgrid/extensions/ColumnResizer',
	'dgrid/extensions/ColumnHider',
	'rfe/grid/View'
], function(lang, Deferred, declare, array, on, aspect, topic, query, Grid, Selection, editor, Keyboard, DnD, ColumnResizer, ColumnHider, View) {

	/**
	 * Format integer to display file size in kilobyte.
	 * @param {string} value
	 */
	function formatFileSize(value) {
		return Math.round(value / 1000 * 10) / 10 + 'kb';
	}

	/**
	 * Return file type.
	 * @param {string} value
	 */
	function formatType(value) {
		return value ? 'directory' : 'file';
	}

	/**
	 * @class
	 * @name rfe.Grid
	 * @extends {OnDemandGrid} Grid
	 * @extends {dgrid/Selection} Selection
	 * @extends {dgrid.editor} editor
	 * @extends {dgrid/Keyboard} Keyboard
	 * @extends {dgrid.extensions.DnD} DnD
	 * @extends {dgrid.extensions.ColumnResizer} ColumnResizer
	 * @property {string} selectionMode
	 * @property {string} allowSelectAll
	 * @property {object} columns
	 */
	return declare([Grid, Selection, editor, Keyboard, ColumnResizer, ColumnHider, DnD, View], /** @lends rfe.Grid.prototype */ {

		selectionMode: 'extended',
		allowSelectAll: true,
		maintainOddEven: false,
		showHeader: false,
		columns: {
			name: editor({
				editor: 'textarea',
				editOn: 'dummyEvent',
				sortable: false, // lets us apply own header click sort
				autoSave: false,
				label: "name"
			}),
			size: {
				sortable: false, // lets us apply own header click sort
				label: 'size',
				formatter: function(value) {
					return formatFileSize(value);
				}
			},
			dir: {
				sortable: false, // lets us apply own header click sort
				label: 'type',
				formatter: function(value) {
					return formatType(value);
				}
			},
			mod: {
				sortable: false, // lets us apply own header click sort
				label: 'last modified'
			}
		},

		postCreate: function() {
			this.inherited('postCreate', arguments);
			// prevent bubbling of double click on editor content to allow selecting of words,
			// otherwise on a folder object its contents would be loaded and displayed instead.
			aspect.after(this, 'edit', function(promise) {
				promise.then(function(widget) {
					if (!widget.signal) {
						widget.signal = on(widget, 'dblclick', function(evt) {
							evt.stopPropagation();
						});
					}
				});
			});
			this.bodyNode.tabIndex = this.tabIndex;

			this.initEvents();

			topic.subscribe('grid/views/state', lang.hitch(this, function(view) {
				this.set('view', view);
			}));
			this.set('showHeader', true);	// if headers are renderered is taken car of in setView
			this.set('view', this.view);
		},

		initEvents: function() {
			var rfe = this.rfe;

			on(this.contentNode, 'keydown', function(evt) {
				var fnc, keyCode = evt.keyCode,
					nodeType = evt.target.nodeName.toLowerCase();

				if (nodeType === 'input' || nodeType === 'textarea') {
					// prevent calling delete
					return;
				}
				fnc = {
					46: rfe.del // delete key // TODO: mac is same keyCode?
				}[keyCode];

				if (typeof(fnc) !== 'undefined') {
					fnc.apply(rfe, arguments);
				}
			});
		},

		/**
		 * Returns the first row object or false if none.
		 * A row object has the properties:
		 *      id: the data object's id
		 *      data: the data object represented by the row
		 *      element: the row's DOM element
		 * @return {object}
		 */
		_getFirstRow: function() {
			var nodes = query('.dgrid-row', this.bodyNode);
			return nodes.length > 0 ? this.row(nodes[0]) : false;
		}


	});
});