define([
    'dojo/_base/lang',
	'dojo/_base/declare',
    'dojo/_base/Deferred',
    'dojo/date/locale',
    'dojox/grid/DataGrid'
], function(lang, declare, Deferred, locale, DataGrid) {

	return declare('rfe.Grid', DataGrid, {

		dndController: null,
		rowSelector: false,
		selectionMode: 'extended',
		columnReordering: true,
		autoHeight: false,
		height: '100%',
		width: '100%',
		loadingMessage: 'loading data...',
		structure: [{
				name: "name",
				field: 'name',
				width: '35%',
				formatter: function(value, idx) {
					var item = this.grid.getItem(idx);
					return this.grid.formatImg(item);
				}},
			{
				name: "size",
				field: "size",
				width: '15%',
				formatter: function(value) {
					return this.grid.formatFileSize(value);
				}},
			{
				name: 'type',
				field: 'dir',
				width: '20%',
				formatter: function(value) {
					return this.grid.formatType(value);
				}},
			{
				name: 'last modified',
				field: 'mod',
				width: '30%'
			}],

		constructor: function(params) {
			this.id = params.id;
		},

		onStyleRow: function(inRow) {
			// overrides to make all rows look the same when selected
			inRow.customClasses += (inRow.selected ? " dojoxGridRowSelected" : "") + (inRow.over ? " dojoxGridRowOver" : "");
			this.focus.styleRow(inRow);
			this.edit.styleRow(inRow);
		},

		/**
		 * Format integer to display file size in kilobyte.
		 * @param {string} value
		 */
		formatFileSize: function(value) {
			return Math.round(value / 1000 * 10) / 10 + 'kb';
		},

		/**
		 * Return file type.
		 * @param {string} value
		 */
		formatType: function(value) {
			// TODO: return correct file type
			if (value === true || value instanceof Array) {
				value = 'directory';
			}
			else {
				value = 'file';
			}
			return value;
		},

		/**
		 * Create HTML string to display file type icon in grid
		 * @param {string} item
		 */
		formatImg: function(item) {
			var strClass;
			strClass = item.dir ? 'dijitFolderClosed' : 'dijitLeaf';
			var str = '<span>';
			str += '<img class="dijitTreeIcon ' + strClass;
			str += '" alt="" src="library/dojo/dojo/resources/blank.gif"/>' + item.name;
			str += '</span>';
			return str;
        },

        /**
         * Sends the inline editor's data to the server
         * @param value
         * @param rowIndex
         * @param attrName
         */
        doApplyCellEdit: function(value, rowIndex, attrName) {
            var item = this.getItem(rowIndex);
            item[attrName] = value;
            item.mod = locale.format(new Date(), {
                datePattern:'dd.MM.yyyy',
                timePattern:'HH:mm'
            });

            Deferred.when(this.store.put(item), lang.hitch(this, function() {
                var cell = this.getCell(0); // TODO: Better way to get cell. Use item to get cell index?
                this.onApplyCellEdit(value, rowIndex, attrName);
                cell.editable = false;
            }));
        }



        /*
     			cnns[cnns.length] = on(dom.byId(this.id), 'mousedown', function(evt) {
     				// TODO: does not work yet
     				console.log('cnnExtraCancel')
     				// editing is not canceled when clicking on the scrollbox
     				if (!domClass.contains(evt.target, 'dojoxGridCell')) {
     					grid.edit.cancel();
     				}
     			});
                */

        /*
// grid calls editor.apply onBlur on the grid -> add id to row/cell?
cnns[cnns.length] = on(cell, 'blur', function() {
console.log('renameItem cell blur')

grid.edit.apply();
grid.edit.save();
cell.editable = false;
            var i = 0;
            				for (; i < cnns.length; i++) {
            					cnns[i].remove();
            				}

});
          */


    });

});