if (typeof(ttRoomieV) == "undefined") {
	alert("Please get the new version of this bookmarklet here: http://gilbarbara.com/turntable/");
	if($("#ttRoomieScript").length) $("#ttRoomieScript").remove();
	throw new Error("Old version");
}

var ttRoomie = {
	room: null,
	roomManager: null,
	started: false,
	update: null,
	users: {},
	version: 0.1,
	up: [],
	down: [],
	init: function () {
		for(var a in turntable){
			if (typeof(turntable[a]) === "object"){
				for(var b in turntable[a]){
					if(typeof(turntable[a][b])==="string" && b==="roomId" && turntable[a].roomId.length > 0) {
						this.room = turntable[a];
						break;
					}
				}
			}
		}

		if (this.room !== null) {
			for(var x in this.room) {
				if (typeof(this.room[x]) === "object") {
					for(var y in this.room[x]) {
						if(typeof(this.room[x][y])==="string" && y==="myuserid" && this.room[x].myuserid.length > 0) {
							this.roomManager = this.room[x];
							break;
						}
					}
				}
			}
		}

		turntable.addEventListener("message", function (data) { ttRoomie.message(data); });

		this.update = setInterval(function () {
			ttRoomie.ui.update();
		}, 60 * 1000);

		this.started = true;
		this.up = [];
		this.down = [];
		this.ui.init();
		this.ui.list();
	},
	message: function (data) {
		if (data.command == "registered") {
			if (!$('#user_' + data.user[0].userid).length) {
				this.users[data.user[0].userid] = $.now();
				$("#ttRoomie ._list").append('<div id="user_' + data.user[0].userid + '" class="_user">' + (data.user[0].acl > 0 ? "<cat>&#x265a;</cat>" : (ttRoomie.room.moderators.indexOf(data.user[0].userid) > -1 ? "<cat>&#x2666;</cat>" : (data.user[0].points > 10000 ? "<cat>&#x2605;</cat>" : ""))) + '<a href="#">' + this.htmlEncode(data.user[0].name) + '</a><span></span></div>');

			}
			this.ui.users();
			this.ui.update();

		}
		else if (data.command == "deregistered") {
			$("#user_"+data.user[0].userid).remove();
			delete this.users[data.user[0].userid];
			this.ui.update();
			this.ui.users();
		}
		else if (data.command == "speak") {
			this.users[data.userid] = $.now();
			this.ui.update();
		}
		else if (data.command == "update_votes") {
			this.users[data.room.metadata.votelog[0][0]] = $.now();
			$("#user_" + data.room.metadata.votelog[0][0]).removeClass("up down").addClass(data.room.metadata.votelog[0][1]).effect("highlight", {}, 4500);
			if ($.inArray(data.room.metadata.votelog[0][0], this[data.room.metadata.votelog[0][1]]) == -1) {
				this[data.room.metadata.votelog[0][1]].push(data.room.metadata.votelog[0][0]);
			}
			var opposite = (data.room.metadata.votelog[0][1] == "up" ? "down" : "up");
			this[opposite] = $.map(this[opposite], function (n) {
				return (n == data.room.metadata.votelog[0][0] ? null : n);
			});

			this.ui.votes();
			this.ui.update();
		}
		else if (data.command == "newsong") {
			this.up = [];
			this.down = [];
			$("#ttRoomie ._user").removeClass("down up");
			this.ui.votes();
			this.ui.update();
		}

		if(data.users) {
			$("#ttRoomie").remove();
			setTimeout(function () {
				turntable.eventListeners.message = $.map(turntable.eventListeners.message, function (n) {
					return (n == "function (data) { ttRoomie.message(data); }" ? null : n);
				});
				clearInterval(ttRoomie.update);
				ttRoomie.init();
			}, 1000);
		}
	},
	size: function(obj) {
        var size = 0;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    },
	htmlEncode: function (value){
		return $('<div/>').text(value).html();
	},
	htmlDecode: function (value){
	  return $('<div/>').html(value).text();
	},
	ui: {
		init: function () {
			var css = "";
			if (!$("#ttRoomie").length) {
				$('<div/>').attr('id', 'ttRoomie').css({
					backgroundColor: '#FFF',
					fontFamily: "Helvetica",
					left: Math.round(((($(window).width() - 760)) / 2) - 200),
					position: 'absolute',
					top: 38,
					width: 200,
					zIndex: 5
				}).appendTo('body');
				css += '<style type="text/css">';
				css += '#ttRoomie ._title { background-color: #292929; color: #FFF; font-size: 12px; font-weight: bold; padding: 4px 8px; position: relative; }';
				css += '#ttRoomie ._title a { color: #FFF; font-size: 20px; line-height: 0; text-decoration: none; position: absolute; top: 10px; right: 6px; }';
				css += '#ttRoomie ._list { font-size: 14px; height: 608px; overflow-y: auto; }';
				css += '#ttRoomie ._room { background-color: #81080E; color: #FFF; font-size: 14px; padding: 6px 8px; }';
				css += '#ttRoomie ._room:after { content: "."; display: block; height: 0; clear: both; visibility: hidden;}';
				css += '#ttRoomie ._room ._left { font-style: italic; float: left; width: 92px;  }';
				css += '#ttRoomie ._room ._right { font-weight: bold; float: right; text-align: right; width: 92px; }';
				css += '#ttRoomie ._inactive { background-color: #CCC; color: #666; padding: 4px 8px; }';
				css += '#ttRoomie ._user { color: #333; padding: 4px 8px; position: relative; }';
				css += '#ttRoomie ._user span { color: #CCC; position: absolute; right: 4px; top: 2px; }';
				css += '#ttRoomie ._user cat { margin-right: 4px; }';
				css += '#ttRoomie ._user a { color: #333; text-decoration: none; }';
				css += '#ttRoomie ._user a._idle { color: #999; font-weight: italic; }';
				css += '#ttRoomie ._user.up a { color: #149A00; font-weight: bold; }';
				css += '#ttRoomie ._user.down a { color: #CA0512; font-weight: bold; }';
				css += '#ttRoomie ._user.even { background-color: #EEE; }';
				css += '#ttRoomie ._user:after { content: "."; display: block; height: 0; clear: both; visibility: hidden;}';
				css += '</style>';
				$("#ttRoomie").html(css);
				$('<div/>').addClass('_title').html('TT ROOMIE').appendTo('#ttRoomie');
				$('<a/>').attr({ href: "http://gilbarbara.com/turntable/", target: "_blank" }).html("&#x25D7;").appendTo('#ttRoomie ._title');

				$('<div/>').addClass('_content').appendTo('#ttRoomie');

				$('<div/>').addClass('_room').appendTo('#ttRoomie ._content');
				$('<div/>').addClass('_left').appendTo("#ttRoomie ._room");
				$('<div/>').addClass('_right').appendTo("#ttRoomie ._room");

				$('<div/>').addClass('_list').html('Loading...').appendTo('#ttRoomie ._content');
				$('#ttRoomie').draggable({
					handle: '._title'
				});
				$('#ttRoomie ._title').dblclick(function () {
					$('#ttRoomie ._content').slideToggle();
				});
				$('#ttRoomie ._user a').die().live("click", function (e) {
					e.preventDefault();
					var userid = $(this).parent().attr("id").split("_")[1];
					//ttRoomie.roomManager.callback('profile', userid);
					ttRoomie.roomManager.toggle_listener(userid);
				});
			}
		},
		list: function () {
			var usersList = "";
			var users = ttRoomie.room.users;
			for (var key in users) {
				ttRoomie.users[users[key].userid] = $.now();
				usersList += '<div id="user_' + users[key].userid + '" class="_user">' + (users[key].acl > 0 ? "<cat>&#x265a;</cat>" : (ttRoomie.room.moderators.indexOf(users[key].userid) > -1 ? "<cat>&#x2666;</cat>" : (users[key].points > 10000 ? "<cat>&#x2605;</cat>" : ""))) + '<a href="#">' + ttRoomie.htmlEncode(users[key].name) + '</a><span></span></div>';
			}
			$("#ttRoomie ._list").html(usersList);
			this.users();
			this.votes();
			this.update()
		},
		votes: function () {
			$("#ttRoomie ._room ._right").html("&#x25B2; " + ttRoomie.up.length + " / &#x25BC; " + ttRoomie.down.length);
		},
		users: function () {
			$("#ttRoomie ._room ._left").html(ttRoomie.size(ttRoomie.room.users) + " users");
		},
		update: function () {

			for (var key in ttRoomie.users) {
				if(!ttRoomie.room.users[key]) delete ttRoomie.users[key];
			}
			$("#ttRoomie ._user span").each(function () {
				var userid = $(this).parent().attr("id").split("_")[1];
				if (ttRoomie.room.users[userid]) {
					if ($.now() - ttRoomie.users[userid] > (30 * 60) * 1000) $(this).siblings("a").addClass("_idle");
					else $(this).siblings("a").removeClass("_idle");
					if ($.now() - ttRoomie.users[userid] < (30 * 60) * 1000 && $(this).html() != "") $(this).html("");
					else if ($.now() - ttRoomie.users[userid] > (120 * 60) * 1000) $(this).html("&#x25A0;&#x25A0;&#x25A0;");
					else if ($.now() - ttRoomie.users[userid] > (60 * 60) * 1000) $(this).html("&#x25A0;&#x25A0;");
					else if ($.now() - ttRoomie.users[userid] > (30 * 60) * 1000) $(this).html("&#x25A0;");
				}
				else $(this).remove();
			});
			$("div._inactive").remove();
			$("#ttRoomie ._user").tsort('a[class*=_idle]', { returns: true, place: 'org' });
			$("#ttRoomie ._user").tsort('a[class!=_idle]', { returns: true, place: 'start' });
			$("#ttRoomie ._user").removeClass("even").filter(":even").addClass("even");
			if ($("a._idle").length) $("a._idle").eq(0).parent().before('<div class="_inactive">&#x21ca; IDLE</div>');
		}
	},
	cleanUp: function () {
        $("#ttRoomie").remove();
		$("#ttRoomieScript").remove();
        turntable.eventListeners.message = $.map(turntable.eventListeners.message, function (n) {
            return (n == "function (data) { ttRoomie.message(data); }" ? null : n);
        });
		clearInterval(this.update);
        ttRoomie = null;
    }
};

/*
* jQuery TinySort - A plugin to sort child nodes by (sub) contents or attributes.
*
* Version: 1.1.0
*
* Copyright (c) 2008-2011 Ron Valstar http://www.sjeiti.com/
*
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*/
(function(b){b.tinysort={id:"TinySort",version:"1.1.0",copyright:"Copyright (c) 2008-2011 Ron Valstar",uri:"http://tinysort.sjeiti.com/",defaults:{order:"asc",attr:null,useVal:false,data:null,place:"start",returns:false,cases:false,sortFunction:null}};b.fn.extend({tinysort:function(h,d){if(h&&typeof(h)!="string"){d=h;h=null}var j=b.extend({},b.tinysort.defaults,d);if(!j.sortFunction){j.sortFunction=j.order=="rand"?function(){return Math.random()<0.5?1:-1}:function(z,w){var i=!j.cases&&z.s&&z.s.toLowerCase?z.s.toLowerCase():z.s;var A=!j.cases&&w.s&&w.s.toLowerCase?w.s.toLowerCase():w.s;if(c(z.s)&&c(w.s)){i=parseFloat(z.s);A=parseFloat(w.s)}return(j.order=="asc"?1:-1)*(i<A?-1:(i>A?1:0))}}var u={};var l=!(!h||h=="");var m=!(j.attr===null||j.attr=="");var q=j.data!==null;var e=l&&h[0]==":";var f=e?this.filter(h):this;this.each(function(x){var y=b(this);var A=l?(e?f.filter(this):y.find(h)):y;var z=q?A.data(j.data):(m?A.attr(j.attr):(j.useVal?A.val():A.text()));var w=y.parent();if(!u[w]){u[w]={s:[],n:[]}}if(A.length>0){u[w].s.push({s:z,e:y,n:x})}else{u[w].n.push({e:y,n:x})}});for(var n in u){var r=u[n];r.s.sort(j.sortFunction)}var g=[];for(var n in u){var r=u[n];var s=[];var v=b(this).length;switch(j.place){case"first":b.each(r.s,function(w,x){v=Math.min(v,x.n)});break;case"org":b.each(r.s,function(w,x){s.push(x.n)});break;case"end":v=r.n.length;break;default:v=0}var p=[0,0];for(var t=0;t<b(this).length;t++){var k=t>=v&&t<v+r.s.length;if(a(s,t)){k=true}var o=(k?r.s:r.n)[p[k?0:1]].e;o.parent().append(o);if(k||!j.returns){g.push(o.get(0))}p[k?0:1]++}}return this.pushStack(g)}});function c(e){var d=/^\s*?[\+-]?(\d*\.?\d*?)\s*?$/.exec(e);return d&&d.length>0?d[1]:false}function a(e,f){var d=false;b.each(e,function(h,g){if(!d){d=g==f}});return d}b.fn.TinySort=b.fn.Tinysort=b.fn.tsort=b.fn.tinysort})(jQuery);

ttRoomie.init();