define([
	'dojo/_base/lang',
	'dojo/_base/Deferred',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/on',
	'dojo/query',
	'dgrid/OnDemandGrid',
	'dgrid/Selection',
	'dgrid/editor',
	'dgrid/Keyboard',
	'dgrid/extensions/DnD',
	'dgrid/extensions/ColumnResizer',
	'dgrid/extensions/DijitRegistry',
	'xstyle/has-class',
	'xstyle/css',
	'put-selector/put'
], function(lang, Deferred, declare, array, listen, query, Grid, Selection, editor, Keyboard, DnD, ColumnResizer) {


	/**
	 * Create HTML string to display file type icon in grid
	 * @param {Object} object
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

	return declare([Grid, Selection, editor, Keyboard, DnD, ColumnResizer], {

		selectionMode: 'extended',
		allowSelectAll: true,
		columns: {
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

		renderHeader: function() {
			// Note: overriding to be able to manipulate sorting, when clicking on header
			var grid = this, headerNode;

			//target = grid._sortNode;	// access before sort is called, because Grid._setSort will delete the sort node
			this.inherited('renderHeader', arguments);

//			console.log(this.get('columns'), this.headerNode)

			headerNode = this.headerNode;

			// if it columns are sortable, resort on clicks
			listen(headerNode.firstChild, "click,keydown", function(event) {

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
		 * Returns the first row object.
		 * A row object has the properties:
		 *      id: the data object's id
		 *      data: the data object represented by the row
		 *      element: the row's DOM element
		 * @return {object}
		 */
		getFirstRow: function() {
			var nodes = query('.dgrid-row', this.bodyNode);
			return this.row(nodes[0]);
		},

		/**
		 * Sort the content
		 * Always sorts by folders then files first (e.g. store.childrenAttr true/false) before sorting according to arguments.
		 * @param {string|array} property field name to sort by, or actual array of objects with attribute and descending properties
		 * @param {boolean} descending whether to sort ascending (false) or descending (true) in case where property is a string
		 * @private
		 */
		_xxxsetSort: function(property, descending) {
			// Note: sorting can be done by the following:
			//		- grid.set('store', query, queryOptions) where queryOptions contains a sort attribute
			//		- grid.set('query', queryOptions)
			//		- store.query(query, queryOptions)
			//		- grid.set('sort', sortOptions);
			//
			// When called from clicking on a grid column, only the first item in the sort array is used, but we
			// always want to also sort by childrenAttr first (e.g. folder, files), we just add it in front before calling sort
			// Order of inheritance:  _StoreMixin->setSort -> Grid._setSort -> List._setSort ->

			var sortObj, sort, store = this.store;
			sortObj = {attribute: store.childrenAttr, descending: descending};
			if (store) {
				if (typeof property === 'string') {   // sorting by clicking on column, where only first array item gets passed to sort
					sort = [
						sortObj,
						{attribute: property, descending: descending}
					];
				}
				else {
					if (property.length === 1 && !property[0][store.childrenAttr]) {
						property.unshift(sortObj);
					}
					sort = property;
				}

			}

			console.log(this.store, property);
			Grid.prototype._setSort.call(this, sort || property, descending);

		}

	});
});