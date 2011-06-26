/**
 * FileExplorer mixin that provides edit functionality.
 */
dojo.provide('rfe.Edit');
dojo.require("dijit.Menu");
dojo.require("dijit.MenuItem");
dojo.require("dijit.PopupMenuItem");
dojo.require('dijit.InlineEditBox');

dojo.declare('rfe.Edit', null, {
	edit: {
		contextMenu: null
	},

	/**
	 * Create context menu for the file explorer.
	 * @target {object} target domNode
	 */
	createContextMenu: function() {
		var menu = new dijit.Menu({
			id: 'rfeContextMenu',
			targetNodeIds: ['rfeContentPaneTree','rfeContentPaneGrid', 'rfeGrid'],
			popUpDelay: 100
		});
		var subMenu = new dijit.Menu();

		// Override to enable context menu, since grid stops this event by default
		this.grid.onCellContextMenu = function() {
		};

		dojo.forEach(menu.targetNodeIds, function(id) {
			var domNode = dojo.byId(id);
			dojo.connect(domNode, 'oncontextmenu', this, function(evt) {
				// If not clicked on a item (tree.node or grid.row), but below widget,
				// set all menuItems to disabled except create/upload
				var widget = dijit.getEnclosingWidget(evt.target);
				var isSelected = widget.grid && widget.grid.selection.getSelected().length > 0 || false;
				if (!isSelected) {
					dojo.filter(menu.getChildren(), function(item) {
						if (item.get('label') != 'New' && item.get('label') != 'Upload') {
							item.set('disabled', true);
						}
					});
				}
				else {
					dojo.forEach(menu.getChildren(), function(item) {
						item.set('disabled', false);
					});
				}
			});
		}, this);
		menu.addChild(new dijit.PopupMenuItem({
			label: 'New',
			popup: subMenu,
			iconClass: "dijitEditorIcon dijitEditorIconNewPage"
		}));
		menu.addChild(new dijit.MenuItem({
			label: 'Rename',
			onClick: dojo.hitch(this, function() {
				var item = this.getSelectedItem();
				if (item) {
					console.log('renaming after creation', item)
					this.renameItem(item);
				}
			})
		}));
		menu.addChild(new dijit.MenuItem({
			label: 'Delete',
			onClick: dojo.hitch(this, function() {
				var item = this.getSelectedItem();
				if (item) {
					this.deleteItem(item);
				}
			})
		}));

		// subMenu new
		subMenu.addChild(new dijit.MenuItem({
			label: 'Directory',
			onClick: dojo.hitch(this, function() {
				this.createRenameItem({
					dir: true
				});
			})
		}));
		subMenu.addChild(new dijit.MenuItem({
			label: 'File',
			onClick: dojo.hitch(this, function() {
				this.createRenameItem();
			})
		}));

		menu.startup();
		this.edit.contextMenu = menu;
	},

	/**
	 * Delete item.
	 * @param {object} item dojo.data.item
	 * @return {object} dojo.Deferred
	 */
	deleteItem: function(item) {
		var store = this.storeCache;
		var id = store.getIdentity(item);
		var self = this;
		return dojo.when(store.remove(id), function() {
			// TODO: find better design ways of updating this.currentTreeItem. This way is cluttered all over the app.
			if (item == this.currentTreeItem) {
				// so far this is never a problem, because you can't do deleteItem in the tree, only the grid
				alert('settin currentTreeItem to parent');
				return dojo.when(store.get(item.parId), function(newCurrent) {
					this.showItemInTree(newCurrent);
				});
			}
			self.removeHistory(id);
			self.grid.store.fetchItemByIdentity({
				identity: id,
				onItem: function(item) {
					self.grid.store.deleteItem(item);
					self.grid.store.save();
					self.grid.selection.clear();
				}
			});
			store.onDelete(item); // Removes item from tree
		}, function(err) {
			console.log(err);
		});
	},

	/**
	 * Rename item
	 * @param {object} item dojo.store.object
	 * @return {object} dojo.Deferred
	 */
	renameItem: function(item) {
		var self = this;
		var def = new dojo.Deferred();
		var store = this.storeCache;
		var grid = this.grid;
		var cell = grid.getCell(0);
		var cnnEdit, cnnCancel, cnnExtraCancel;

		cnnEdit = dojo.connect(grid, 'onApplyCellEdit', function(value) {
			if (item.name === value) {	// user just pressed enter but didn't change the name
				def.resolve(item);
			}
			else {
				item.name = value;
				item.mod = self.getDate();
				def = dojo.when(store.put(item), function() {
					grid.store.save();
					store.onChange(item); // Updates the tree
				},
				function(err) {
					grid.store.revert();
				});
			}
			dojo.disconnect(cnnEdit);
			dojo.disconnect(cnnCancel);
			cell.editable = false;
		});
		cnnCancel = dojo.connect(grid, 'onCancelEdit', function() {
			dojo.disconnect(cnnEdit);
			dojo.disconnect(cnnCancel);
			dojo.disconnect(cnnExtraCancel);
		});
		cnnExtraCancel = dojo.connect(dojo.byId(this.id), 'mousedown', this, function(evt) {
			// editing is not canceled when clicking on the scrollbox
			if (!dojo.hasClass(evt.target, 'dojoxGridCell')) {
				grid.edit.cancel();
			}
		});
		cell.editable = true;
		grid.edit.setEditCell(cell, grid.selection.selectedIndex);
		return def;
	},

	/**
	 * Creates a new file object.	 *
	 * @param {object} itemProps
	 * @return {object} dojo.store object decorated with a dojo.data.item
	 */
	createItem: function(itemProps) {
		var store = this.storeCache;
		var grid = this.grid;
		var parId = this.currentTreeItem.id;
		var item = {
			name: itemProps && itemProps.dir ? 'new directory' : 'new text file.txt',
			size: 0,
			parId: parId,
			mod: this.getDate()
		};
		dojo.safeMixin(item, itemProps);	// mixes the dir property in

		// add item to the store, the tree and grid.store
		return dojo.when(store.add(item), function(newId) {
			var dfd = new dojo.Deferred();
			var self = this;
			var gridItem;
			item.id = newId;

			// add to tree
			store.onNewItem(item);

			// add to grid (need
			grid.store.newItem(item);
			grid.store.save({
				onComplete: function() {
					console.log('safe completed')
					dfd.resolve(item);
				},
				onError: function(err) {
					console.log('Error when saving new item', err)
				},
				scope: self
			});

			return dfd;
		});
	},

	/**
	 * Create-Rename item sequence.
	 * Creates a new item, selects it in the grid and switches to edit mode.
	 * @param itemProps
	 */
	createRenameItem: function(itemProps) {
		var grid = this.grid, idx;
		return dojo.when(this.createItem(itemProps), dojo.hitch(this, function(item) {
			// there seems to be a lag between calling grid.newItem() -> grid.save() and the grid actually rendering the row
			var cnn = dojo.connect(grid, 'renderRow', this, function() {
				this.renameItem(item);
				dojo.disconnect(cnn);
			});

			grid.store.fetchItemByIdentity({
				identity: item.id,
				onItem: function(gridItem) {
					idx = grid.getItemIndex(gridItem);
					grid.selection.setSelected(idx, true);	// new item in grid needs to be selected before it can be renamed
					grid.selection.clickSelect(idx);	// new item in grid needs to be selected before it can be renamed
				},
				scope: this
			});
		}))
	}

});

