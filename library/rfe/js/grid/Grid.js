define(['dojo/_base/declare', 'dgridOriginal/Grid'], function(declare, Grid) {

	var Grid = declare(Grid, {

		appendIfNode: function appendIfNode(parent, subNode) {
			if (subNode && subNode.nodeType) {
				parent.appendChild(subNode);
			}
		},
		defaultRenderCell: function(object, data, td, options) {
			if (data != null) {
				td.appendChild(document.createTextNode(data));
			}
		}
	});

	return Grid;
});
