define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dojo/request/xhr',
	'dojo/aspect',
	'dgrid/Grid',
	'put-selector/put'
], function(declare, lang, xhr, aspect, Grid, put) {

	return declare(null, {

		view: 'icons',
		services: {
			thumbnail: require.toUrl('rfe-php/php/fs/thumbnail.php/')
		},
		rowRenderers: {
			list: Grid.prototype.renderRow,
			icons: function(obj) {
				var src, div, parent;

				if (obj.mime && /image\//.test(obj.mime)) {
					src = this.services.thumbnail + obj.id + '?w=64&h=64'
				}
				else {
					src = require.toUrl('rfe/resources/images/icons-64/'+ (obj.dir ? 'folder.png' : 'file.png'));
				}
				parent = put('div', {
					innerHTML: '<img src="' + src + '" width="64" height="64"><br>'
				});
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

		_setRenderer: function(view) {
			var prop, cssClassRemove = '',
				cssClass = 'gridView' + view.charAt(0).toUpperCase() + view.slice(1);

			// update class on grid domNode for correct row css
			for (prop in this.rowRenderers) {
				if (this.rowRenderers.hasOwnProperty(prop)) {
					cssClassRemove += '!gridView' + prop.charAt(0).toUpperCase() + prop.slice(1);
				}
			}
			this.renderRow = this.rowRenderers[view];

			// set correct cell renderer for current view
			for (prop in this.cellRenderers[view]) {
				if (this.cellRenderers[view].hasOwnProperty(prop)) {
					this.columns[prop].renderCell = this.cellRenderers[view][prop];
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