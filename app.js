var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);

io.configure(function(){
  io.set('heartbeat timeout', 3);
  io.set('heartbeat interval', 2);						
});

MemoryStore = express.session.MemoryStore;
sessionStore = new MemoryStore();


// = Config =

app.configure(function () {
    app.use(express.cookieParser());
    app.use(express.session({store: sessionStore , secret: 'secret' , key: 'express.sid'}));

	app.use(express.methodOverride());
	app.use(express.bodyParser());
	app.use(app.router);
	app.set('view engine', 'ejs');
	app.use(express.static(__dirname + '/public'));
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

io.set('log level', 1); // less verbose

// = Helpers =

// = Routes =

app.get('/', function (req, res) {
	
	var code = "";
	var possible = "123456789";

    for( var i=0; i < 3; i++ ) {
        code += possible.charAt(Math.floor(Math.random() * possible.length));
	}


    if(req.headers['user-agent'].toLowerCase().indexOf('mobile') > -1 && req.headers['user-agent'].toLowerCase().indexOf('ipad') == -1) {
		res.render('iphone', {layout: 'iphone_layout.ejs', code: code});
	} else {
		res.render('index', {code: code});
	}
});

app.get('/iphone', function (req, res) {
	
	var code = "";
	var possible = "123456789";

    for( var i=0; i < 3; i++ ) {
        code += possible.charAt(Math.floor(Math.random() * possible.length));
	}	
	res.render('iphone', {layout: 'iphone_layout.ejs', code: code});
});



app.get('/lights/:strand_id', function (req, res) {
	
	/* hack check block */
	var when = 0;
	if (req.query.s) {
		when = req.query.s;
	}	
	
	var n = new Date().getTime();
	if (n - when > 10000) {
		var code = "";
		var possible = "123456789";

	    for( var i=0; i < 3; i++ ) {
	        code += possible.charAt(Math.floor(Math.random() * possible.length));
		}

	    if(req.headers['user-agent'].toLowerCase().indexOf('mobile') > -1 && req.headers['user-agent'].toLowerCase().indexOf('ipad') == -1) {
			res.render('iphone', {layout: 'iphone_layout.ejs', code: code});
		} else {
			res.render('index', {code: code});
		}
		return;	
	}
	
	var degrees = [];
	for(var i=0; i<20; i++) {
		degrees[i] = Math.floor(Math.random() * 20);
		
		if (degrees[i] % 2 == 0) {
			degrees[i] = degrees[i] * -1;
		}		
		
		if (degrees[i] % 7 == 0) {
			degrees[i] = degrees[i] + 180;
		}		
	}
	
	var colors = [];
	var color_defs = new Array("real", "real", "real", "real", "real", "real");
	for(var i=0; i<20; i++) {
		var x = (Math.floor(Math.random() * 6));
		colors[i] = color_defs[x];
	}	

	var offsets = [];
	for(var i=0; i<20; i++) {
		var x = (Math.floor(Math.random() * 20));
		offsets[i] = -1 * x;
		if (degrees[i] >= 160) {
			offsets[i] = offsets[i] - 90;
		}
	}	
	
	req.session.strand_id = req.params.strand_id;
	res.render('lights', {layout: 'lights_layout.ejs', 'degrees' :degrees, 'colors' : colors, 'offsets': offsets, 'is_new' : 0, 'strand_id' : req.params.strand_id});	
});

app.get('/lights/new/:strand_id', function (req, res) {
		
		
	/* hack check block */
	var when = 0;
	if (req.query.s) {
		when = req.query.s;
	}	
	
	var n = new Date().getTime();
	if (n - when > 10000) {
		var code = "";
		var possible = "123456789";

	    for( var i=0; i < 3; i++ ) {
	        code += possible.charAt(Math.floor(Math.random() * possible.length));
		}

	    if(req.headers['user-agent'].toLowerCase().indexOf('mobile') > -1 && req.headers['user-agent'].toLowerCase().indexOf('ipad') == -1) {
			res.render('iphone', {layout: 'iphone_layout.ejs', code: code});
		} else {
			res.render('index', {code: code});
		}
		return;	
	}
	
	
	var degrees = [];
	for(var i=0; i<20; i++) {
		degrees[i] = Math.floor(Math.random() * 20);
		if (degrees[i] % 2 == 0) {
			degrees[i] = degrees[i] * -1;
		}		
	}
	
	var colors = [];
	var color_defs = new Array("real", "real", "real", "real", "real", "real");
	for(var i=0; i<20; i++) {
		var x = (Math.floor(Math.random() * 6));
		colors[i] = color_defs[x];
	}	

	var offsets = [];
	for(var i=0; i<20; i++) {
		var x = (Math.floor(Math.random() * 20));
		offsets[i] = -1 * x;
	}	
	
	req.session.strand_id = req.params.strand_id;
	res.render('lights', {layout: 'lights_layout.ejs', 'degrees' :degrees, 'colors' : colors, 'offsets': offsets, 'strand_id' : req.params.strand_id, 'is_new' : 1});	
});


// Start server
app.listen(8000);


var Session = require('connect').middleware.session.Session;
var parseCookie = require('connect').utils.parseCookie;
io.set('authorization', function (data, accept) {
    // check if there's a cookie header
    if (data.headers.cookie) {
        // if there is, parse the cookie
        data.cookie = parseCookie(data.headers.cookie);
        // note that you will need to use the same key to grad the
        // session id, as you specified in the Express setup.
        data.sessionID = data.cookie['express.sid'];
    } else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return accept('No cookie transmitted.', false);
    }
    // accept the incoming connection
    accept(null, true);
});

// Socket stuff
var connected = [];
var playing = [];
var playing_started = [];

var lights = [];

io.sockets.on('connection', function (socket) {
	
	var id = socket.handshake.sessionID + '_' + (Math.floor(Math.random() * 100)) ;
	var parts = socket.handshake.headers.referer.split('/');
	var strand_id = parts[parts.length -1].split('?')[0];
	
	if (connected[strand_id]) {
		connected[strand_id] = connected[strand_id] + 1;
	} else {
		connected[strand_id] = 0;
	}
	
	if (!lights[strand_id])  {
		lights[strand_id] = [];
	}
	
	if (!playing[strand_id])  {
		playing[strand_id] = [];
	}
	
	if (!playing_started[strand_id])  {
		playing_started[strand_id] = [];
	}
				
	lights[strand_id].push(id);	
	
	console.log('Client connected! ('+ lights[strand_id].length +') ('+ id +') + ('+ strand_id +')' );
	socket.emit('set_id', id);
	socket.emit('set_strand_id', strand_id);
	
	io.sockets.emit('alert_count', {'strand_id': strand_id, 'count': lights[strand_id].length});	
	
	if (lights[strand_id].length == 1) {
		playing[strand_id] = 0;
		io.sockets.emit('play', lights[strand_id][playing[strand_id]]);
		var d = new Date;
		playing_started[strand_id] = d.getTime();						
	}
		
	socket.on('disconnect', function (data) {	
		console.log('disconnecting');	
		for (var i=0; i< lights[strand_id].length; i++) {
			if (lights[strand_id][i] == id) {
				lights[strand_id].splice(i, 1);
				io.sockets.emit('alert_count', {'strand_id': strand_id, 'count': lights[strand_id].length});
				if (i == playing[strand_id]) {
					if (playing[strand_id] <= lights[strand_id].length - 1) {
						io.sockets.emit('play', lights[strand_id][playing[strand_id]]);			
						var d = new Date;
						playing_started[strand_id] = d.getTime();
					} else {
						playing[strand_id] = 0;
						io.sockets.emit('play', lights[strand_id][playing[strand_id]]);			
						var d = new Date;
						playing_started[strand_id] = d.getTime();						
					}
				}
				
				break;
			}
		}

  });

	socket.on('done', function(socket){
		
		if (playing[strand_id] < lights[strand_id].length - 1) {
			playing[strand_id]++;
			io.sockets.emit('play', lights[strand_id][playing[strand_id]]);	
			var d = new Date;
			playing_started[strand_id] = d.getTime();							
		} else {
			playing[strand_id] = 0;
			io.sockets.emit('play', lights[strand_id][playing[strand_id]]);			
			var d = new Date;
			playing_started[strand_id] = d.getTime();			
		}
	});
	

});













