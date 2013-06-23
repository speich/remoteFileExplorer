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
	'put-selector/put',
	'dgrid/extensions/DijitRegistry',
	'xstyle/has-class',
	'xstyle/css'
], function(lang, Deferred, declare, array, on, aspect, topic, query, Grid, Selection, editor, Keyboard, DnD, ColumnResizer, ColumnHider, put) {

	/**
	 * Create HTML string to display file type icon in grid
	 * @param {Object} object
	 * @param {Object} data
	 * @param {Object} td
	 */
	function formatImg(object, data, td) {
		var str, strClass = object.dir ? 'dijitFolderClosed' : 'dijitLeaf';
		str = '<span>';
		str += '<img class="dijitTreeIcon ' + strClass;
		str += '" alt="" src="' + require.toUrl("dojo/resources/blank.gif") + '"/>' + object.name;
		str += '</span>';
		td.innerHTML = str;
	}

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
	return declare([Grid, Selection, editor, Keyboard, ColumnResizer, ColumnHider, DnD/*, Views*/], /** @lends rfe.Grid.prototype */ {

		selectionMode: 'extended',
		allowSelectAll: true,
		maintainOddEven: false,
		columns: {
			id: {
				sortable: false,
				label: 'id'
			},
			name: editor({
				sortable: false, // lets us apply own header click sort
				editor: 'text',
				editOn: 'dummyEvent',
				autoSave: false,
				label: "name",
				renderCell: function(object, data, td) {
					formatImg(object, data, td);
				}
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
		renderers: {
			list: Grid.prototype.renderRow,
			details: function() {

				return;
			},
			icons: function(obj, options) {
				var div = put('div');
				div.innerHTML = '<div class="dialogContentIconImg"><img src="library/rfe/js/resources/images/icons-64/' +
				(obj.dir ? 'folder.png' : 'file.png') + '" width="64" heigh="64">' + obj.name + '</div>';
				return div;
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
				this.setRenderer(view);
			}));
		},

		initEvents: function() {
			var rfe = this.rfe;

			on(this.contentNode, 'keydown', function(evt) {
				var fnc, keyCode = evt.keyCode;
				if (evt.target.type === 'text') {
					// text boxes should be ignored when deleting etc.
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

		renderHeader: function() {
			// Note: overriding to be able to manipulate sorting, when clicking on header
			var grid = this, headerNode;

			//target = grid._sortNode;	// access before sort is called, because Grid._setSort will delete the sort node
			this.inherited('renderHeader', arguments);

			headerNode = this.headerNode;

			// if it columns are sortable, resort on clicks
			on(headerNode.firstChild, 'click, keydown', function(event) {

				// respond to click or space keypress
				if (event.type === "click" || event.keyCode === 32) {
					var target = event.target, field, descending, arrSort, sortObj;

					// remove previous added sorting by childrenAttr, e.g. group by folder
					arrSort = grid._sort;
					if (arrSort && arrSort.length === 2) {
						arrSort.shift();
					}

					do {
						if (target.field) {	// true = found the right node
							// stash node subject to DOM manipulations to be referenced then removed by sort()
							grid._sortNode = target;

							field = target.field || target.columnId;
							sortObj = arrSort[0];	// might be undefined

							// if the click is on same column as the active sort, reverse direction of corresponding sort object
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

							return grid.set("sort", arrSort);
						}
					} while ((target = target.parentNode) && target !== headerNode);
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
		getFirstRow: function() {
			var nodes = query('.dgrid-row', this.bodyNode);
			return nodes.length > 0 ? this.row(nodes[0]) : false;
		},

		setRenderer: function(view) {
			this.renderRow = this.renderers[view];
			//put(grid.domNode, "!table!gallery!details." + view);
			// only show headers if we're in "list" view
			this.set('showHeader', view == "list");
			this.refresh();
		}


	});
});