define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/aspect'
], function(lang, array, declare, Deferred, on, aspect) {

	return declare(null, {

		/**
		 * Delete selected file(s) or folder(s).
		 */
		del: function() {
			// Note: delete is a reserved word -> del
            // TODO: return deferred list of all deleted items
			// Notes:
			// A. When deleting from toolbar we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu use source to decide which selected items to use
			var self = this, store = this.store;
			var context = this.editor.context;
			var i = 0, len;
			var item, items, widget;

			widget = context.isOnGrid || context.isOnGridPane ? this.grid : this.tree;
            items = widget.selection.getSelected();	// TODO: make this work also for the tree which doesn't have the same selection object
			len = items.length;
			for (; i < len; i++) {
				item = items[i];
				Deferred.when(store.remove(item.id), function() {
					self.removeHistory(item.id);
					// When deleting folder in tree, grid is not updated by store.onDelete() since grid only contains folders children!
					if (item.dir && (context.isOnTree || context.isOnTreePane)) {
						console.log('deleteItems: refreshing grid');
						self.grid._refresh();   // note: grid._refresh has a timeout, so it doesn't matter to call it in rapid succession (in a loop)
					}
				}, function(err) {
					console.log(err);
				});
			}
		},

		/**
		 * Creates a new file object.
		 * @param {object} itemProps
		 * @return {object} dojo.store object
		 */
		create: function(itemProps) {
			var store = this.store;
			var parId = this.currentTreeObject.id;
			var item = {
				size: 0,
				parId: parId,
				mod: this.getDate()
			};
			if (itemProps && itemProps.dir) {
				item.dir = true;
				item.name = 'new directory';
			}
			else {
				item.name = 'new text file.txt';
			}

			return Deferred.when(store.add(item), function() {
				return item;
			})
		},

		/**
		 * Create and rename an item
		 * Creates a new item, selects it in the grid and switches to edit mode.
		 * @param {object} itemProps
         *
		 */
		createRename: function(itemProps) {
            // TODO: return item after it is renamed
			// createItem makes the grid update all its rows -> we cant rename the new item right away since it's not rendered yet
			// Connect to endUpdate to time it right
			return Deferred.when(this.createItem(itemProps), lang.hitch(this, function(item) {
				var grid = this.grid;
				// store.add calls onNew() before returning. The grid listens to onNew() and calls grid._addItem() in turn.
				// So item is added to internal grid index before it is rendered, e.g. rowIndex is available right away
				var itemRowIndex = grid.getItemIndex(item);
				var itemRowIndex = grid.getItemIndex(item);
				var signal = aspect.after(grid, 'renderRow', lang.hitch(this, function(rowIndex) {
					if (rowIndex == itemRowIndex) {
						signal.remove();
						grid.selection.setSelected(rowIndex, true);	// new item in grid needs to be selected before it can be renamed
						this.currentGridItem = item;	// TODO use grid.selection instead ?
						this.edit();
					}
				}), true);
			}))
		}

	})


});