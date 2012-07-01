define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dojo/dom-construct',
	'dojo/query',
	'dojo/date/locale',
   'dijit/_WidgetBase'
], function(lang, declare, connect, construct, query, locale, WidgetBase) {

	return declare([WidgetBase], {

		baseClass: 'rfeConsole',

		constructor: function(props) {

			lang.mixin(this, props || {});

			// it seems I cannot extract methods GET, POST, PUT DELETE from topics
			connect.subscribe("/dojo/io/done", lang.hitch(this, function(dfd, response) {
				var xhr = dfd.ioArgs.xhr;
				this.netLog((dfd.ioArgs.error ? 'Error: ' : '') + xhr.status + ' ' + xhr.statusText + '<br>' + xhr.responseText)
			}));
			connect.subscribe("/dojo/io/send", lang.hitch(this, function(dfd) {
				this.netLog(dfd.ioArgs.url, dfd)
			}));


		},

		postCreate: function() {
			this.inherited('postCreate', arguments);
			construct.create('ul', {}, this.domNode);
		},

		netLog: function(msg, data) {
			this.print(msg)

		},

		log: function(msg, data) {
			this.print(msg);

		},

		/**
		 * Write own message or io error message to log container.
		 * @param {String} response message
		 */
		extract: function(response) {
			var i = 0, len = 0, msg;

			if (response instanceof Array) {
				len = response.length;
				for (; i < len; i++) {
					msg = response[i].msg;
					if (msg && msg != undefined) {
						this.print(msg);
					}
      		}
			}
			else if (typeof response == 'object') {
				if (response.responseText) {  // prefer own msg over dojo.message
					msg = json.parse(response.responseText);
				}
				else if (response.message) {   // dojo xhr message
					msg = response.message;
				}

				if (msg && msg != undefined) {
					if (msg instanceof Array) {
						this.log(msg);
					}
					else {
						this.print(msg.msg || msg);
					}
				}
			}
		},

		/**
		 * Print message to HTMLDivElement
		 * @param {String} msg message to print
		 */
		print: function(msg) {
			var ul = null;
			var date = locale.format(new Date(), {
				selector: 'time',
				timePattern: 'HH:mm:ss'
			});

			ul = this.domNode.firstChild;

			construct.create('li', {
				'class': 'logMsg',
				innerHTML: date + ' ' + msg + '<br/>'
			}, ul, 'first');
		},

		/**
		 * Clear all logged messages.
		 */
		clear: function() {
			this.domNode.innerHTML = '';
		}



	});
});