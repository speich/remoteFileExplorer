define(['dojo/_base/declare', 'dgrid/Grid', 'put-selector/put'], function(declare, Grid, put) {
	return declare(null, {

		view: 'icons',

		rowRenderers: {
			list: Grid.prototype.renderRow,
			icons: function(obj) {
				var div, parent = put('div');

				div = put(parent, 'div.gridIcon', {
					innerHTML: '<img src="library/rfe/js/resources/images/icons-64/' +
						(obj.dir ? 'folder.png' : 'file.png') + '" width="64" height="64"><br><span>' + obj.name + '</span>',
					columnId: 'name'
				});
				return parent;
			}
		},
		cellRenderers: {
			list: {
				name: function(obj, data, containerEl) {
					containerEl.innerHTML = '<span class="' + (obj.dir ? 'dijitFolderClosed' : 'dijitLeaf') + '"></span><span>' + obj.name + '</span>';
				//	containerEl.innerHTML = '<span>' + obj.name + '</span>';
				}
			},
			icons: {
				name: function(obj, data, containerEl) {
					containerEl.innerHTML = '<span>' + obj.name + '</span>';
				}
			}
		},

		_setRenderer: function(view) {
			var i, cssClassRemove = '',
				cssClass = 'gridView' + view.charAt(0).toUpperCase() + view.slice(1);

			// update class on grid domNode for correct row css
			for (i in this.rowRenderers) {
				if (this.rowRenderers.hasOwnProperty(i)) {
					cssClassRemove += '!gridView' + i.charAt(0).toUpperCase() + i.slice(1);
				}
			}
			this.renderRow = this.rowRenderers[view];

			// set correct cell renderer for current view
			for (i in this.cellRenderers[view]) {
				if (this.cellRenderers[view].hasOwnProperty(i)) {
					this.columns[i].renderCell = this.cellRenderers[view][i];
				}
			}

			this.view = view;
			put(this.domNode, "!gridViewList!gridViewIcons!gridViewDetails." + cssClass);
			this.set('showHeader', view == "list");
			this.refresh();
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
			if (this.view === 'icons') {
				cell.element = cell.element || this.row(target).element;
				//cell.column = cell.column ||
			}
			return cell;
		},

		_getEditableElement: function(id, columnId) {
			var cell = this.cell(id, columnId);

			if (this.view === 'icons') {
				cell.element.contents = cell.element.getElementsByTagName('span')[0];
			}
			else {
				cell.element.contents = cell.element.getElementsByTagName('span')[1];
			}

			return cell;
		}
	})
});