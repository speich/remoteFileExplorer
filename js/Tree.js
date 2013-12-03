define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/cookie',
	'dijit/Tree',
	'rfe/dnd/TreeSource'	// set path to load dnd/TreeSource in dojoConfig
], function(lang, declare, array, cookie, Tree, TreeSource) {

	/**
	 * @name rfe.Grid
	 * @extends {dijit.Tree} Tree
	 */
	return declare([Tree], {
		cookieNameSelNodes: 'dijit/tree/SelectedNodes',
		openOnClick: false, //	If true, clicking a folder node's label will open it, rather than calling onClick()
		openOnDblClick: true, // If true, double-clicking a folder node's label will open it, rather than calling onDblClick()
		showRoot: true,
		tabIndex: 21,
		pathSeparator: ';',	// should be character that does not occur in id
		multiplePathSeparator: ',',
		dndSource: null,	// expose instance of dndController as in dgrid
		dndController: function(arg, params) {
			return new TreeSource(arg, lang.mixin(params || {}, {
				accept: ['dgrid-row'],
				rfe: arg.rfe
			}));
		},

		postCreate: function() {
			this.inherited('postCreate', arguments);
			this.onLoadDeferred.then(lang.hitch(this, function() {
				// start watching for changes on paths only after initial tree load and before setting state,
				// otherwise only root will always be set
				this.watch('paths', lang.hitch(this, function(attr, oldVal, newVal) {
					this.savePaths(newVal);
				}));
			}));
			this.dndSource = this.dndController;
		},

		/**
		 * Returns paths of nodes that were selected previously and saved in a cookie.
		 * If no path is found returns empty array.
		 * @return {Array} paths
		 */
		loadPaths: function() {
			var oreo = cookie(this.cookieNameSelNodes),
				paths = [],
				self = this;

			if (this.persist && oreo) {
				paths = array.map(oreo.split(self.multiplePathSeparator), function(path) {
					return path.split(self.pathSeparator);
				});
			}
			return paths;
		},

		/**
		 * Save selected nodes in a cookie.
		 * Converts the path array to a string separated with slashes. If there are multiple nodes selected, they
		 * are separated by this.multiplePathSeparator.
		 * @param {array} paths
		 */
		savePaths: function(paths) {
			var arr = [], selects = [],
			model = this.tree.model;

			array.forEach(paths, function(path) {
				arr = array.map(path, function(part) {
					return part[model.idProperty];
				}, this);
			});
			selects.push(arr.join(this.pathSeparator));

			if (this.persist && selects.length > 0) {
				cookie(this.cookieNameSelNodes, selects.join(this.multiplePathSeparator), {
					expires: 365,
					path: '/'
				});
			}
		} //,


	//	_setSelectedItemAttr: function(/*Item or id*/ item){
	//		//this.selection[item];
	//		this.set('selectedItems', [item]);
	//	}
	});
});