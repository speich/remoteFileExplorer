/**
 * So far the sole purpose of extending the _dndSelector are two things:
 * 1. Prevent deselecting the last selected node when dragging a node different from the last selected one, because grid would update display to selected folder
 * 2. Do not select a node when only dragging it
 * @see conversation on http://dojo-toolkit.33424.n3.nabble.com/Reason-behind-selecting-treeNode-onMouseDown-and-not-onMouseUp-td3021149.html#a3066447
 *
 * Solution: The idea is to defer de-/selection from mouseDown to mouseUp (@see setSelection())
 */

define([
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/_base/connect',
	'dijit/tree/_dndSelector'
], function(array, lang, connect, _dndSelector) {

	// set references to be able to call overridden methods
	var  ref = _dndSelector.prototype,
		oldMouseUp = ref.onMouseUp,
		oldMouseMove = ref.onMouseMove;

	// TODO: make right click (context menu) select the tree node (also see dnd/GridSelector.js)
	// TODO: emit events tree-select and tree-deselect as dgrid
	return _dndSelector.extend({
		_oldSelection: [],
		_selectByMouse: false,
		_dragged: false,
		getSelectedNodes: ref.getSelectedTreeNodes, // map two dnd method

		onMouseDown: function(evt) {
			// Note: Overriding to remove doing nothing on right click
			this._selectByMouse = true;
			this._dragged = false;

			// ignore click on expando node
			if(!this.current || this.tree.isExpandoNode(evt.target, this.current)){ return; }

			evt.preventDefault(); // prevent browser from selecting text in tree, but still allows to bubble

			var treeNode = this.current,
			  copy = connect.isCopyKey(evt), id = treeNode.id;

			// _doDeselect is the flag to indicate that the user wants to either ctrl+click on
			// a already selected item (to deselect the item), or click on a not-yet selected item
			// (which should remove all current selection, and add the clicked item). This can not
			// be done in onMouseDown, because the user may start a drag after mousedown. By moving
			// the deselection logic here, the user can drag an already selected item.
			if (!this.singular && !evt.shiftKey && this.selection[id]) {
				this._doDeselect = true;
				return;
			} else {
				this._doDeselect = false;
			}
			this.userSelect(treeNode, copy, evt.shiftKey);	// add node to selection and calls setSelection()
		},

		onMouseMove: function() {
			oldMouseMove.apply(this, arguments);
			this._dragged = true;
		},

		onMouseUp: function(evt) {
			var i, len, selection;

			// selecting/deselecting does not work correctly when in multiselect mode after dragging unselected node
			oldMouseUp.apply(this, arguments);
			// Prevent selecting onMouseDown -> move to onMouseUp, but not when dragging (-> set to false onMouseMove())
			if (!this._dragged) {	// set to false on mousemove
				selection = this._oldSelection;
				i = 0;
				len = selection.length;
				for (; i < len; i++) {
					selection[i].setSelected(false);
				}
				selection = this.getSelectedTreeNodes();
				i = 0;
				len = selection.length;
				for (; i < len; i++) {
					selection[i].setSelected(true);
				}
				this._oldSelection = selection;
			}
			this._selectByMouse = false;
			this._dragged = false;
		},

		setSelection: function(newSelection) {
			// Note: Overriden (parent) method would do two things: Add/remove nodes from/to selection and set them selected.
			// To make 1. and 2. (see class comment) work, this should be rewritten and split into two separated methods.
			// Unfortunately that's not possible since this method is also used by other methods, such as tree.set('path').
			// Therefore we use a flag when using it with the mouse, which will skip selecting/deselecting a node here, so we
			// can do it in mouseUp if there was no drag in between
			var oldSelection = this.getSelectedTreeNodes();
			array.forEach(this._setDifference(oldSelection, newSelection), lang.hitch(this, function(node){
				if (!this._selectByMouse) {
					node.setSelected(false);
				}
				if(this.anchor == node){
					delete this.anchor;
				}
				delete this.selection[node.id];
			}));
			array.forEach(this._setDifference(newSelection, oldSelection), lang.hitch(this, function(node){
				if (!this._selectByMouse) {
					node.setSelected(true);
					this._oldSelection.push(node);
				}
				this.selection[node.id] = node;
			}));
			this._updateSelectionProperties();
		}

	});
});
