define([
	'dojo/_base/lang',
	'dojo/_base/declare',
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
	'rfe/grid/View',
	'rfe/config/fileObject'
], function(lang, declare, on, aspect, topic, query, Grid, Selection, editor, Keyboard, Dnd, ColumnResizer, ColumnHider, View, fileObject) {

	/**
	 * @class rfe.Grid
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
	return declare([Grid, Selection, editor, Keyboard, Dnd, ColumnResizer, ColumnHider, View], /** @lends rfe.Grid.prototype */ {

		selectionMode: 'extended',
		allowSelectAll: true,
		maintainOddEven: false,
		showHeader: false,
		cleanEmptyObservers: false,	// otherwise adding to empty grid will not show added in grid
		columns: {
			name: editor({
				editor: 'textarea',
				editOn: 'dummyEvent',	// lets have an editor, but do not turn it on
				sortable: false, // lets us apply own header click sort
				autoSave: false,
				label: fileObject.label.name
			}),
			size: {
				sortable: false, // lets us apply own header click sort
				label: fileObject.label.size,
				formatter: fileObject.formatter.size
			},
			dir: {
				sortable: false, // lets us apply own header click sort
				label: fileObject.label.dir,
				formatter: fileObject.formatter.dir
			},
			cre: {
				sortable: false, // lets us apply own header click sort
				label: fileObject.label.cre,
				formatter: fileObject.formatter.cre
			},
			mod: {
				sortable: false, // lets us apply own header click sort
				label: fileObject.label.mod,
				formatter: fileObject.formatter.mod
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

		topic.subscribe('grid/views/state', lang.hitch(this, function(view) {
				this.set('view', view);
			}));
			this.set('showHeader', true);	// if headers are re-rendered this taken care of in setView
			this.set('view', this.view);
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
		},

		/**
		 * Set sorting
		 * @param {String} field name of column to sort
		 * @param arrSort
		 */
		_setMultisort: function(field, arrSort) {
			var grid = this, sortObj, descending;

			// remove previous added sorting by childrenAttr, e.g. group by folder
			if (arrSort && arrSort.length === 2) {
				arrSort.shift();
			}
			sortObj = arrSort[0];	// might be undefined

			// if  click is on same as the active sort, reverse direction of corresponding sort object
			descending = sortObj && sortObj.attribute === field && !sortObj.descending;
			sortObj = {
				attribute: field,
				descending: descending
			};

			arrSort = [sortObj];

			// sort by childrenAttr first
			if (sortObj.attribute !== grid.store.childrenAttr) {
				arrSort.unshift({
					attribute: grid.store.childrenAttr,
					descending: descending
				});
			}

			this.set('sort', arrSort);
		}
	});
});