/**
 * So far the sole purpose of extending the _dndSelector are two things:
 * 1. Prevent deselecting the last selected node when dragging a node different from the last selected one
 * 2. Do not select a node when only dragging it
 * @see conversation on http://dojo-toolkit.33424.n3.nabble.com/Reason-behind-selecting-treeNode-onMouseDown-and-not-onMouseUp-td3021149.html#a3066447
 *
 * Solution: The idea is to defer de-/selection on mouseDown to mouseUp (@see setSelection())
 */

define([
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/_base/event',
	'dojo/_base/connect',
	'dojo/mouse',
	'original/dijit/tree/_dndSelector'
], function(array, lang, event, connect, mouse, _dndSelector) {

	// set references to call be able to call overriden methods
	var ref = _dndSelector.prototype;
	var oldMouseUp = ref.onMouseUp;

	// TODO: make right click (context menu) select the tree node (also see dnd/GridSelector.js)
	return _dndSelector.extend({
		_oldSelection: [],

		_selectByMouse: false,
		getSelectedNodes: ref.getSelectedTreeNodes,	// map two dnd method

		onMouseDown: function(evt) {
			// note: Overriding to remove doing nothing on right click and also to remove stopping event (we need to bubble up
			// to know where user clicked at in FileExplorer.getWidget
			this._selectByMouse = true;

			// ignore click on expando node
			if(!this.current || this.tree.isExpandoNode(evt.target, this.current)){ return; }

			var treeNode = this.current,
			  copy = connect.isCopyKey(evt), id = treeNode.id;

			// if shift key is not pressed, and the node is already in the selection, delay deselection until mouseUp
			// -> in the case of DND, deselection will be canceled by mouseMove.
			if (!this.singular && !evt.shiftKey && this.selection[id]) {
				this._doDeselect = true;
				return;
			} else {
				this._doDeselect = false;
			}
			this.userSelect(treeNode, copy, evt.shiftKey);
		},

		onMouseUp: function(evt) {
			// selecting/deselecting does not work correctly when in multiselect mode after dragging unselected node
			oldMouseUp.apply(this, arguments);
			// Prevent selecting onMouseDown -> move to onMouseUp, but not when dragging (-> set to false onMouseMove())
			var selection = this._oldSelection;
			var i = 0, len = selection.length;
			for (; i < len; i++) {
				selection[i].setSelected(false);
			}
			selection = this.getSelectedTreeNodes();
			i = 0, len = selection.length;
			for (; i < len; i++) {
				selection[i].setSelected(true);
			}
			this._oldSelection = selection;
			this._selectByMouse = false;
		},

		setSelection: function(newSelection) {
			// note: Parent method does two things: Add/remove nodes from/to selection and set them selected.
			// To make 1. and 2. (see class comment) work, this should be rewritten and split into two separated methods.
			// Unfortunately that's not possible since this method is also used by other methods, such as tree.set('path').
			// Therefore we use a flag when using it with the mouse and thne defer the selecting to mouseUp
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
