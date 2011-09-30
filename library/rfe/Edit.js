define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/aspect',
	'dojo/mouse',
	'dojo/dom',
	'dojo/dom-class',
	'dijit/registry',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/PopupMenuItem'
], function(lang, array, declare, Deferred, on, aspect, mouse, dom, domClass, registry, Menu, MenuItem, PopupMenuItem) {

	// TODO: prevent dnd when editing

	return declare('rfe.Edit', null, {
		edit: {
			contextMenu: null,   // reference to the context menu
			context: null  // reference to the widget the context menu was created on (right clicked on)
		},

		/**
		 * Initialize context menu for the file explorer.
		 * @target {object} target domNode
		 */
		initContextMenu: function() {
			var menu = Menu({
				id: 'rfeContextMenu',
				targetNodeIds: ['rfeContentPaneTree','rfeGrid'],   // grid extends to same size as pane, tree not
				popUpDelay: 0
			});
			var subMenu = Menu();

			// Override to enable context menu, since grid stops this event by default
			this.grid.onCellContextMenu = function() {};

			// Enable/disable menu items before displaying it:
			array.forEach(menu.targetNodeIds, function(id) {
				var context, domNode = dom.byId(id);
				on(domNode, 'mousedown', lang.hitch(this, function(evt) {
					if (!mouse.isRight(evt)) {
						return;
					}
					context = this.getContext(evt);
					this.enableContextMenuItems(menu, context);
					this.edit.context = context;
				}));
			}, this);

			menu.addChild(PopupMenuItem({
				label: 'New',
				popup: subMenu,
				iconClass: "dijitEditorIcon dijitEditorIconNewPage"
			}));
			menu.addChild(MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this, this.renameItem)
			}));
			menu.addChild(MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this, this.deleteItems)
			}));

			// subMenu new
			subMenu.addChild(MenuItem({
				label: 'Directory',
				onClick: lang.hitch(this, function() {
					this.createRenameItem({
						dir: true
					});
				})
			}));
			subMenu.addChild(MenuItem({
				label: 'File',
				onClick: lang.hitch(this, this.createRenameItem)
			}));

			menu.startup();
			this.edit.contextMenu = menu;
		},

		/**
		 * Enables or disables context menu items depending on the clicked context.
		 * @param {dijit.Menu} menu
		 * @param {object} context
		 */
		enableContextMenuItems: function(menu, context) {
			// If not clicked on a item (tree.node or grid.row), but below widget and nothing is selected,
			// then set all menuItems to disabled except create/upload
			if (context.isOnTree || context.isOnTreePane) {
				array.filter(menu.getChildren(), function(item) {
					if (item.get('label') != 'New' && item.get('label') != 'Upload') {
						item.set('disabled', true);
					}
				});
			}
			else {
				array.forEach(menu.getChildren(), function(item) {
					item.set('disabled', false);
				});
			}
		},

		/**
		 * Delete selected item(s).
		 * @return {dojo.DeferredList}
		 */
		deleteItems: function() {
			// Notes:
			// A. When deleting from toolbar we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu use source to decide which selected items to use
			var self = this, store = this.store;
			var context = this.edit.context;
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
		 * Rename item
		 * @param {object} item dojo.store.object
		 * @return {object} dojo.Deferred
		 */
		renameItem: function() {
			var self = this;
			var store = this.store;
			var grid = this.grid;
			// TODO: do not hard code, find column from item.name since name might not always be first column
			var cell = grid.getCell(0);
			var item = this.getLastSelectedItem(); // rename item is either called through contextMenu or createRenameItem

			// grid calls editor.apply onBlur on the grid -> add id to row/cell?
/*			var cnn = on(cell, 'onBlur', this, function() {
				console.log('done editing')   
				dojo.disconnect(cnn);
				grid.edit.apply();
				grid.edit.save();
				cell.editable = false;
			});*/

			var cnns = [];
			var i = 0;
			cnns[cnns.length] = on(grid, 'applyCellEdit', function(value) {
				if (item.name !== value) {	// user just pressed enter but didn't change the name
					item.name = value;
					item.mod = self.getDate();

					Deferred.when(store.put(item), function() {
//						grid.edit.apply();
						console.log('applying edit on cell', cell)
//						grid.edit.save();
						cell.editable = false;
					},
					function(err) {
						grid.edit.cancel();
						cell.editable = false;
					});
				}
				for (; i < cnns.length; i++) {
					cnns[i].remove();
				}
			});
			cnns[cnns.length] = on(grid, 'cancelEdit', function() {
				for (; i < cnns.length; i++) {
					console.log('removing cnn', i);
					cnns[i].remove();
				}
			});
			cnns[cnns.length] = on(dom.byId(this.id), 'mousedown', function(evt) {
				// TODO: does not work yet
				console.log('cnnExtraCancel')
				// editing is not canceled when clicking on the scrollbox
				if (!domClass.contains(evt.target, 'dojoxGridCell')) {
					grid.edit.cancel();
				}
			});

			cell.editable = true;	// enable editing
			//grid.focus.setFocusCell(cell, grid.getItemIndex(item));
			grid.edit.setEditCell(cell, grid.getItemIndex(item));

		},

		/**
		 * Creates a new file object.
		 * @param {object} itemProps
		 * @return {object} dojo.store object
		 */
		createItem: function(itemProps) {
			var store = this.store;
			var parId = this.currentTreeItem.id;

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
		 */
		createRenameItem: function(itemProps) {

			// createItem makes the grid update all its rows -> we cant rename the new item right away since it's not rendered yet
			// Connect to endUpdate to time it right
			return Deferred.when(this.createItem(itemProps), lang.hitch(this, function(item) {
				var grid = this.grid;
				// store.add calls onNew() before returning. The grid listens to onNew() and calls grid._addItem() in turn.
				// So item is added to internal grid index before it is rendered, e.g. rowIndex is available right away
				var itemRowIndex = grid.getItemIndex(item);
				var cnn = aspect.after(grid, 'renderRow', lang.hitch(this, function(rowIndex) {
					if (rowIndex == itemRowIndex) {
						cnn.remove();
						grid.selection.setSelected(rowIndex, true);	// new item in grid needs to be selected before it can be renamed
						this.currentGridItem = item;	// TODO use grid.selection instead ?
						this.renameItem(item);
					}
				}), true);
			}))
		}
	});

});