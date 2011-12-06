var lights = function() {
	return {
		
		socket: null,
		my_id: null,
		strand_id: null,
		
		init : function () {
			
			var width = $(window).width();

			lights.windowResize();
			
			$(window).resize(function(){ lights.windowResize(); });

			$('a#close').click(function(){$(this).parent().remove(); return false;});

			lights.socket = io.connect('http://deckthescreens.com');					

			lights.socket.on('connect', function () {				
																						
			});			
			
			lights.socket.on('set_id', function (id) {				
				lights.my_id = id;

			});			
			
			lights.socket.on('set_strand_id', function (id) {				
				lights.strand_id = id;

			});		
			
			lights.socket.on('alert_count', function (vals) {				
				if (vals.strand_id == lights.strand_id) {																													
					if (vals.count != 1) {
						$('#count').text(vals.count + ' strings of lights');
					} else {
						$('#count').text(vals.count + ' string of lights');
					}
				}
			});
			
			lights.socket.on('play', function(id){
				if (lights.my_id == id) {
					$('.lights li').removeClass('on');
					$('.lights li:first').addClass('on');				
					var time = setTimeout("lights.nextLight()", 150);					
				}
			
			});
			
			
			$('ul.lights div').live('click', function(){
				var colors = new Array('real', 'red', 'green', 'yellow', 'blue', 'real');
				for(var i = 0; i<colors.length-1; i++) {
					if ($(this).hasClass(colors[i])) {
						$(this).removeClass(colors[i]).addClass(colors[i+1]);
						break;
					}
				}
			});
			
			
			$('a#more').click(function(){
				if ($(this).text() == '?') { 	
					$('#header').slideDown(100);
					$(this).text('hide');
					$(this).css({'color': '#333'});
				} else {
					$('#header').slideUp(100);
					$(this).text('?');			
					$(this).css({'color': '#f1f1f1'});							
				}
				return false;
			});
		},
		
		nextLight : function() {
			$('.lights li.on').removeClass('on').next('li').addClass('on');						
			if ($('.lights li.on').length == 0){ 
				// do nothing
				lights.socket.emit('done');
			} else if ($('.lights li.on').nextAll('li').length == 1) { 
//				setTimeout("lights.socket.emit('done')", 100);
				setTimeout("lights.nextLight()", 150);
			} else {
				setTimeout("lights.nextLight()", 150);				
			}
		},
		
		initIndex: function() {
			
			$('#join').click(function(){
				$('#prompt').slideDown(200, function(){ 
								$('html, body').animate({
				                    scrollTop: $("#prompt").offset().top
				                     }, 500); });
				return false;
			});
			
			$('#join_action').click(function(){				
				window.location = '/lights/' + $('#theid').val();
			});
			
			$('#theid').focus(function(){				
				$('#theid').val('');
			});			
		},
		
		iPhoneInit: function() {
			
			$('#join').click(function(){
				$('#prompt').slideDown(200);
				return false;
			});
			
			$('#join_action').click(function(){				
				window.location = '/lights/' + $('#theid').val();
			});
			
			$('#theid').focus(function(){				
				$('#theid').val('');
			});			
		},		
		
		windowResize: function() {
			var width = $(window).width();
			if (width >= ($('.lights li').length * 120) + 120)  { 
				while (width >= ($('.lights li').length * 120) + 120)  {

					var degrees = 0;
					degrees = Math.floor(Math.random() * 20);
					if (degrees % 2 == 0) {
						degrees = degrees * -1;
					}	
					
					if (degrees % 7 == 0) {
						degrees = degrees + 180;
					}					

					var color = 0;
					var color_defs = new Array("real", "real", "real", "real", "real", "real");
					x = (Math.floor(Math.random() * 6));
					color = color_defs[x];

					var offset = 0;

					x = (Math.floor(Math.random() * 20));
					offset = -1 * x;
					
					if (degrees >= 160 ) {
						offset = offset - 90;
					}

					var li = '<li style="position: relative; top:'+ offset +'px;"><div class="'+color+'" style="-webkit-transform: rotate('+ degrees +'deg);-moz-transform: rotate('+ degrees +'deg);"></div></li>';
					$('.lights').append(li);
				}
			} else {
				while (width < $('.lights li').length * 120) {
					$('.lights li:last').remove();
				}
			}
		}
		
	};
}();