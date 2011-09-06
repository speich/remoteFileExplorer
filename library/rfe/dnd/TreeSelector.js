define([
	'dojo/_base/array',
	'dojo/_base/lang',
	'original/dijit/tree/_dndSelector'
], function(array, lang, _dndSelector) {

	// set references to call be able to call overriden methods
	var ref = _dndSelector.prototype;
	var oldMouseDown = ref.onMouseDown;
	var oldMouseUp = ref.onMouseUp;
	var oldMouseMove = ref.onMouseMove;


	// TODO: make right click (context menu) select the tree node (also see dnd/GridSelector.js)
	return _dndSelector.extend({
		_markedNode: null,
		_doMarkNode: false,
		getSelectedNodes: ref.getSelectedTreeNodes,  // TODO: why doesn' tree._dndSelector not use this instead?

		onMouseDown: function(e) {
			oldMouseDown.apply(this, arguments);
			this._doMarkNode = true;
		},

		onMouseUp: function(e) {
			// Prevent selecting onMouseDown -> move to onMouseUp, but not when dragging (-> set to false onMouseMove())
			if (this._doMarkNode) {
				var selection = this.getSelectedTreeNodes();
				var i = 0, len = selection.length;
				if (this._markedNode) {
					this._markedNode.setSelected(false);
				}
				for (; i < len; i++) {
					selection[i].setSelected(true);
				}
				this._markedNode = this.current;
			}
			this._doMarkNode = false;
			oldMouseUp.apply(this, arguments);
		},

		onMouseMove: function(e) {
			oldMouseMove.apply(this, arguments);
			this._doMarkNode = false;
		},

		setSelection: function(newSelection) {
			var oldSelection = this.getSelectedTreeNodes();
			array.forEach(this._setDifference(oldSelection, newSelection), lang.hitch(this, function(node) {
				if (this._markedNode != node) {
					node.setSelected(false);
				}
				if (this.anchor == node) {
					delete this.anchor;
				}
				delete this.selection[node.id];
			}));
			array.forEach(this._setDifference(newSelection, oldSelection), lang.hitch(this, function(node) {
				this.selection[node.id] = node;
			}));
			this._updateSelectionProperties();
		}
	});

});
