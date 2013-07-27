define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/request/xhr',
	'dojo/on',
	'dojo/aspect',
	'dgrid/Grid',
	'put-selector/put'
], function(declare, lang, xhr, on, aspect, Grid, put) {

	return declare(null, {

		/** default view */
		view: 'icons',
		iconWidth: 80,
		services: {
			thumbnail: require.toUrl('rfe-php') + '/services/image.php'
		},
		rowRenderers: {
			list: Grid.prototype.renderRow,
			icons: function(obj) {
				var div, img, parent;

				img = this.get('iconType', obj);
				parent = put('div', img);
				div = put(parent, 'div', {columnId: 'name'});
				this.cellRenderers.icons.name(obj, obj.name, div);
				return parent;
			}
		},
		// cell is only part with editable text
		cellRenderers: {
			list: {
				name: function(obj, data, containerEl) {
					containerEl.innerHTML = '<span class="' + (obj.dir ? 'dijitFolderClosed' : 'dijitLeaf') + '"></span><span>' + obj.name + '</span>';
				}
			},
			icons: {
				name: function(obj, data, containerEl) {
					containerEl.innerHTML = '<span class="dgrid-column-name field-name">' + obj.name + '</span>';
				}
			}
		},

		headerRenderers: {
			list: function() {
				this.renderHeaderList();
			},
			icons: function() {
				this.renderHeaderIcons();
			}
		},

		/**
		 * Rerender headings and rows
		 * @param {String} view
		 */
		_setView: function(view) {
			this._destroyColumns();
			this.set('renderer', view);
			this._updateColumns();
			this.refresh();
		},

		/**
		 * Return the icon according to provided mime type of object.
		 * @param {Object} obj
		 * @returns {HTMLImageElement}
		 */
		_getIconType: function(obj) {
			var mime, img = put('img', {
				width: 64,
				height: 64
			});

			mime = obj.mime ? obj.mime.split('/')[0] : null;
			switch (mime) {
				case 'image':
					img.className = 'iconImage';
					img.src = this.services.thumbnail + obj.id + '?w=' + this.iconWidth;
					img.width = this.iconWidth;
					img.removeAttribute('height');
					break;
				case 'video':
					img.src = require.toUrl('rfe') + '/resources/images/icons-64/file-video.png';
					break;
				case 'audio':
					img.src = require.toUrl('rfe') + '/resources/images/icons-64/file-audio.png';
					break;
				case 'text':
					img.src = require.toUrl('rfe') + '/resources/images/icons-64/file-text.png';
					break;
				default:
					img.src = require.toUrl('rfe') + '/resources/images/icons-64/'+ (obj.dir ? 'folder.png' : 'file.png');
			}
			return img;
		},

		_setRenderer: function(view) {
			var prop, cssClassRemove = '',
				cssClass = 'gridView' + view.charAt(0).toUpperCase() + view.slice(1);

			// update class on grid domNode for correct row css
			for (prop in this.rowRenderers) {
				if (this.rowRenderers.hasOwnProperty(prop)) {
					cssClassRemove += '!gridView' + prop.charAt(0).toUpperCase() + prop.slice(1);
				}
			}
			this.renderHeader = this.headerRenderers[view];
			this.renderRow = this.rowRenderers[view];

			// set correct cell renderer for current view
			for (prop in this.cellRenderers[view]) {
				if (this.cellRenderers[view].hasOwnProperty(prop)) {
					this.columns[prop].renderCell = this.cellRenderers[view][prop];
				}
			}

			this.view = view;
			put(this.domNode, "!gridViewList!gridViewIcons!gridViewDetails." + cssClass);
		},

		renderHeaderIcons: function() {
			var headerNode = this.headerNode,
				i = headerNode.childNodes.length;

			headerNode.setAttribute("role", "row");

			// clear out existing header in case we're resetting (changing view)
			while(i--){
				put(headerNode.childNodes[i], "!");
			}
		},

		renderHeaderList: function() {
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
		 * Override to make cell work with other views than lists (table)
		 * @param target event, node, object id
		 * @param [columnId] column id
		 * @returns {Object}
		 */
		cell: function(target, columnId) {
			var cell = this.inherited('cell', arguments);

			// note: cell is also called when clicking on the grid, but not on a row, e.g. cell is an empty object
			if (this.view === 'icons' && this.row(target)) {
				cell.element = cell.element || this.row(target).element.getElementsByClassName('field-name')[0];
			}
			return cell;
		},

		_getEditableElement: function(id, columnId) {
			var cell = this.cell(id, columnId);

/*
			if (this.view === 'icons') {
				cell.element.contents = cell.element.getElementsByTagName('span')[0];
			}
			else {
				cell.element.contents = cell.element.getElementsByTagName('span')[1];
			}
*/

			return cell;
		}

	})
});