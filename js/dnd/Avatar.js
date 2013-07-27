define([
	'dojo/_base/lang',
	'dojo/_base/window',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/dom-attr',
	'dojo/query',
	'dojo/dnd/Avatar'],
function(lang, window, array, declare, construct, domClass, attr, query, Avatar) {

	// preloading icons. Note: Can't be done in constructor, because it is only called when used
	var images = {
		folder: new Image(),
		files: new Image(),
		file: new Image()
	};

	images.folder.src = require.toUrl('rfe') + '/resources/images/icons-64/folder.png';
	images.files.src = require.toUrl('rfe') + '/resources/images/icons-64/files.png';
	images.file.src = require.toUrl('rfe') + '/resources/images/icons-64/file.png';


	return declare([Avatar], {

		constructor: function() {
			this.images = images;

			this.isA11y = domClass.contains(window.body(), "dijit_a11y");
			var a = construct.create("table", {
				"class": "dojoDndAvatar",
				style: {
					position: "absolute",
					zIndex: "1999",
					margin: "0px"
				}
			}),
			source = this.manager.source, node,
			b = construct.create("tbody", null, a),
			tr = construct.create("tr", null, b),
			td = construct.create("td", null, tr),
			span = construct.create("span", {
				innerHTML: source.generateText ? this._generateText(): ""
			}, td);

			// we have to set the opacity on IE only after the node is live
			attr.set(tr, {
				"class": "dojoDndAvatarHeader",
				style: {opacity: 0.9}
			});

			node = construct.create('div');
			node.appendChild(this.createIcon());
			node.id = "";
			tr = construct.create("tr", null, b);
			td = construct.create("td", null, tr);
			td.appendChild(node);
			attr.set(tr, {
				"class": "dojoDndAvatarItem",
				style: {opacity: 0.9}
			});

			this.node = a;
		},

		createIcon: function() {
			var img,
			nodes = this.manager.nodes,
			source = this.manager.source,
			isDir = array.some(nodes, function(node) {
				var obj = source.getObject(node);
				return obj.dir;
			}, this);

			if (isDir) {
				img = this.images.folder;
			}
			else if (nodes.length > 1) {
				img = this.images.files;
			}
			else {
				img = this.images.file;
			}
			return img;
		},

		_generateText: function() {
			// summary: generates a proper text to reflect copying or moving of items
			var numItems = this.manager.nodes.length.toString(),
			action = this.manager.copy ? 'Copy to': 'Move to';

			return numItems + ', ' + action;
		}
	});

});
