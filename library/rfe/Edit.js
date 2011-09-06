define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/mouse',
	'dojo/dom',
	'dojo/dom-class',
	'dijit/registry',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/PopupMenuItem'
], function(lang, array, declare, Deferred, on, mouse, dom, domClass, registry, Menu, MenuItem, PopupMenuItem) {

	return declare('rfe.Edit', null, {
		edit: {
			contextMenu: null,   // reference to the context menu
			contextWidget: null  // reference to the widget the context menu was created on (right clicked on)
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

			array.forEach(menu.targetNodeIds, function(id) {
				var domNode = dom.byId(id);
				on(domNode, 'mousedown', lang.hitch(this, function(evt) {
					if (!mouse.isRight(evt)) {
						return;
					}

					var isOnWidget = false;

					var widget = registry.getEnclosingWidget(evt.target);
					console.log(widget, evt.target, widget.item)
					// TODO: find generic solution for this instead of using id
					if (widget.id == 'rfeContentPaneTree') {
						widget = this.tree
					}
					else {
						widget = widget.grid || widget.tree;
					}

					this.edit.contextWidget = widget;
					isOnWidget = widget && widget.dndController.getSelectedNodes().length > 0;
					// If not clicked on a item (tree.node or grid.row), but below widget,
					// and nothing is selected, then set all menuItems to disabled except create/upload
					if (!isOnWidget) {
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
		 * Delete selected item(s).
		 * @return {dojo.DeferredList}
		 */
		deleteItems: function() {
			// Notes:
			// A. When deleting from toolbar we only use selected items from the grid (or use focus?). Currently this
			// happens from the different menu in layout.js -> move here?
			// B. When deleting from context menu use source to decide which selected items to use
			var store = this.store;
			var dnd = this.edit.contextWidget.dndController;
			var self = this;
			var i = 0, item, dndItem, nodes, len;

			// TODO: whould be nice if we didn't depend on dnd for editing.
			// This is out of convenience to have one method to get the selected nodes instead of a widget specific
			nodes = dnd.getSelectedNodes();
			len = nodes.length;
			for (; i < len; i++) {
				dndItem = dnd.getItem(nodes[i].id);
				item = dndItem.data.item;
				Deferred.when(store.remove(item.id), function() {
					self.removeHistory(item.id);
					// When deleting folder in tree, grid is not updated by store.onDelete() since grid only contains folders children!
					if (item.dir && self.edit.contextWidget == self.tree) {
						self.grid._refresh();   // note: grid._refresh has a timeout, so it doesn't matter to call it in rapid succession
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
			var item = this.getLastSelectedItem();
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
			cnns[cnns.length] = on(grid, 'onApplyCellEdit', function(value) {
				if (item.name !== value) {	// user just pressed enter but didn't change the name
					item.name = value;
					item.mod = self.getDate();
					console.log('applying edit')
					Deferred.when(store.put(item), function() {
						//grid.edit.apply();
						//grid.store.save();
						//	grid.edit.save();
						cell.editable = false;
					},
					function(err) {
						grid.edit.cancel();
						cell.editable = false;
					});
				}
				for (; i < cnns.length; i++) {
					dojo.disconnect(cnns[i]);
				}
			});
			cnns[cnns.length] = on(grid, 'onCancelEdit', function() {
				for (; i < cnns.length; i++) {
					dojo.disconnect(cnns[i]);
				}
			});
			cnns[cnns.length] = on(dom.byId(this.id), 'mousedown', this, function(evt) {
				console.log('cnnExtraCancel')
				// editing is not canceled when clicking on the scrollbox
				if (!domClass.contains(evt.target, 'dojoxGridCell')) {
					grid.edit.cancel();
				}
			});

			cell.editable = true;	// enable editing
			grid.edit.setEditCell(cell, grid.getItemIndex(item));
//			grid.doStartEdit(cell, grid.getItemIndex(item));
			//grid.focus.setFocusCell(cell, grid.getItemIndex(item));
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
				var rowIndex = grid.getItemIndex(item);
				var cnn = on(grid, 'endUpdate', this, function() {
					dojo.disconnect(cnn);
					grid.selection.setSelected(rowIndex, true);	// new item in grid needs to be selected before it can be renamed
					this.renameItem(item);
				});
			}))
		}
	});

});