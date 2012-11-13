var FOOT1 = 1, FOOT2 = 2, FOOT3 = 3, STAND = 4;
var audio = (function () {
	"use strict";

	function newOscillator( id, frequency, duration ) {
		var result = {
			id: id,
			duration: duration,
			frequency: frequency,
			volumeNode: audioContext.createGainNode(),
			o : undefined,
			createOscillator : function() {
				this.duration = duration;
				this.o = audioContext.createOscillator();
				this.o.frequency.value = frequency;
				this.o.connect(this.volumeNode);
			},
			initialize : function() {
				this.volumeNode.connect(audioContext.destination);
				this.createOscillator();
			},
			active : false,
			start : function() {
				if (this.active)
					return;
				this.volumeNode.gain.value = 1.0;
				this.active = true;
				this.o.noteOn(0);
			},
			stop : function() {
				if (!this.active)
					return;
				this.volumeNode.gain.value = 0.0;
				this.o.noteOff(audioContext.currentTime+0.01);
				this.active = false;
			},
			reset : function() {
				this.o.disconnect();
				this.o = undefined;
				this.createOscillator();
			},
			advance : function() {
				if (this.o.playbackState === this.o.FINISHED_STATE) {
					this.reset();
				}
				else if(this.active) {
					this.duration--;
					if (this.duration == 0) {
						this.stop();
					}
				}
			},
		}
		result.initialize();
		return result;
	}

	var oscillators = {}

	var audioContext = undefined;
	return {
		initialize: function() {
			try {
				audioContext = new (window.AudioContext || window.webkitAudioContext);
			} catch (e) {
				alert('There is no audio oscillator support in this browser');
			}
		},
		addSound: function( id, frequency, duration ) {
			oscillators[id] = newOscillator(id, frequency, duration);
		},
		soundOn: function (which, length) {
			oscillators[which].start();
		},
		advance: function () {
			_.each(oscillators, function(v,k) {
				v.advance();
			});
		}
	}
}());

var input = (function () {
	"use strict";

	var ACTIONS = [
		{action:"FORWARD",	sequence:[[3],[2],[1]]},
		{action:"BACKWARD",	sequence:[[1],[2],[3]]},
		{action:"STAND",	sequence:[[4]]}
	];

	var currentInputFrame = [],
		inputState = {},
		inputHistory = [];

	function inputOn(id) {
		if (!inputState[id]) {
			currentInputFrame.push(id);
			inputDelegate(id);
		}
		inputState[id] = true;
	}

	function inputOff(id) {
		inputState[id] = false;
	}

	function clearInputHistory() {
		inputHistory.length = 0;
	}

	var idleInputFrameCount = 0;
	function pushInputFrame() {
		if(currentInputFrame.length > 0) {
			inputHistory.push(currentInputFrame.sort());
			currentInputFrame = [];
			idleInputFrameCount = 0;
		}
		else {
			idleInputFrameCount++;
		}
	}

	function scanForAction() {
		ACTIONS.every( function(element) {
			if(matchSequence(element.sequence)) {
				clearInputHistory();
				actionDelegate(element.action);
				return false;
			}
			else {
				return true;
			}
		});
	}

	// thanks to http://stackoverflow.com/a/5115066
	function arrays_equal(a,b) { return !(a<b || b<a); }

	function matchSequence(sequence) {
		var inputHistoryIndex = inputHistory.length - 1;
		return sequence.every( function(element,index) {
			var frame = inputHistory[ inputHistoryIndex - index];
			return frame ? arrays_equal(element,frame) : false;
		});
	}

	var keyMap = {76:FOOT1, 75:FOOT2, 74:FOOT3, 72:STAND};

	function onKeyDown(keyCode) {
		var mapped = keyMap[keyCode];
		if (mapped) {
			inputOn(mapped);
			return false;
		}
	}

	function onKeyUp(keyCode) {
		var mapped = keyMap[keyCode];
		if (mapped) {
			inputOff(mapped);
			return false;
		}
	}

	function handleKeyDown(e) {
		if(!e){ var e = window.event; }
		return onKeyDown(e.keyCode);
	}

	function handleKeyUp(e) {
		if(!e){ var e = window.event; }
		return onKeyUp(e.keyCode);
	}

	var actionDelegate;
	var inputDelegate;
	return {
		initialize: function (onAction,onInput) {
			actionDelegate = onAction;
			inputDelegate = onInput;
			document.onkeydown = handleKeyDown;
			document.onkeyup = handleKeyUp;
		},
		advance: function () {
			pushInputFrame();
			scanForAction();
		}
	};
}());

var projector = (function () {
	return {
		screen: {width:undefined,height:undefined,centerX:undefined,centerY:undefined},
		cell: {width:150,height:150},
		initialize: function(width,height) {
			this.screen.width = width;
			this.screen.height = height;
			this.screen.centerX = width/2;
			this.screen.centerY = height/2;
		},
		projectX: function(i) {
			return i*this.cell.width+this.screen.centerX;
		},
		projectY: function(layer) {
			return layer*this.cell.height;
		}
	}
}());

var player = (function() {
	return {
		virtual: {pX:0,pY:1.5,tX:0,tY:1.5},
		screen: {pX:75, pY:175, tX:75, tY:175},
		sprite: undefined,
		shiftForward: function() {console.log("override player.shiftForward");},
		shiftBackward: function() {console.log("override player.shiftBackward");},
		spriteParameters: {
			images: ["assets/chin.png"],
			frames: {count:6, width:150, height:150, regX:0, regY:0},
			animations: {
				stand: {frames:[0], next:false, frequency:3},
				still: {frames:[1], next:false, frequency:1 },
				step1: {frames:[2,3,4,5,3,1], next:"land", frequency:2 },
				land: {frames:[1], next:false, frequency:1},
			}
		},
		initialize: function() {
			var spriteSheet  = new createjs.SpriteSheet(this.spriteParameters);
			if (!spriteSheet.complete) {
					spriteSheet.onComplete = function(e) {
						console.log("preloading needed. this is a big issue.",e);
						this.generatePlayerSpriteAnimation(spriteSheet);
					}
			}
			else {
				this.generatePlayerSpriteAnimation( spriteSheet );
			}
		} ,

		generatePlayerSpriteAnimation: function(spriteSheet) {
			this.screen.pX = this.screen.tX = projector.projectX(this.virtual.pX);
			this.screen.pY = this.screen.tY = projector.projectY(this.virtual.pY);
			this.sprite = new createjs.BitmapAnimation(spriteSheet);
			this.sprite.gotoAndPlay("still");		
			this.sprite.x = player.screen.pX;
			this.sprite.y = player.screen.pY;
		},
		advance: function() {
			if (this.virtual.pX != this.virtual.tX) {
				this.virtual.pX += (this.virtual.tX - this.virtual.pX);
				this.screen.tX = projector.projectX(this.virtual.pX);
				this.screen.pY = projector.projectY(this.virtual.pY);
			}
		    if (this.screen.pX != this.screen.tX) {
				this.screen.pX += (this.screen.tX - this.screen.pX)/2 ;
			}
			this.sprite.x = this.screen.pX;
			this.sprite.y = this.screen.pY;
		},
		actionForward: function() {
			if (this.virtual.tX == -2)
			{
				this.shiftForward();
			}
			else
			{
				this.virtual.tX = this.virtual.tX - 1;
			}
			this.sprite.gotoAndPlay("step1");		
		},
		actionBackward: function() {
			if (this.virtual.tX == 2) {
				this.shiftBackward();
			}
			else
			{
				this.virtual.tX = this.virtual.tX + 1;
			}
			// no sprite currently exists for backsteps...
		},
		actionStand: function() {
			this.sprite.gotoAndPlay("stand");		
		}
	}
}());

var grid = (function () {
	return {
		layers: [],
		layerMaps:[ 
			[0,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1],
			[1,0,0,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1],
			[0,0,1,0,0,0,0,1,1,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1,1,0,0,1,1],
			[0,1,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1,1,0,0,1,1,0,1,0,0,0,1],
			[0,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1],
			[1,0,0,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,1],
			[0,0,1,0,0,0,0,1,1,1,0,1,1,1,0,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1,1,0,0,1,1],
			[0,1,0,1,1,0,1,0,0,0,0,1,1,1,0,1,0,0,1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,1,0,0,1,1,1,0,0,1,1,0,1,0,0,0,1],
			],
		initialize: function() {
			_.each(this.layerMaps, function(layerMap,layerIndex) {
				var g = new Graphics();
				g.setStrokeStyle(1);
				g.beginStroke(Graphics.getRGB(0,0,0));
				g.beginFill(Graphics.getRGB(100,0,100));
				_.each(layerMap, function(mapElement,mapIndex) {
					if( mapElement > 0 ) {
						g.rect(mapIndex*75,0,75,75);
					}
				}, this);
				var layer = { x:-75*10, y:layerIndex*65, xT:-75*10, yT:layerIndex*65, shape:new Shape(g) };
				this.layers.push( layer );
			},this);
		},
		shiftForward: function() {
			_.each(this.layers, function(layer,index) {
				layer.xT+=250/(this.layers.length+1-index);
			},this);
		},
		shiftBackward: function() {
			_.each(this.layers, function(layer,index) {
				layer.xT-=250/(this.layers.length+1-index);
			},this);
		},
		advance: function() {
			_.each(this.layers, function(layer,index) {
				if (layer.x != layer.xT) {
					layer.x += (layer.xT - layer.x)/2;
				}
				layer.shape.x = layer.x;
				layer.shape.y = layer.y;
			});
		},
	}
}());

var main = (function () {
	"use strict";

	function initBackground() {
		var g = new Graphics();
		g.setStrokeStyle(1);
		g.beginStroke(Graphics.getRGB(255,255,255));
		g.beginFill(Graphics.getRGB(100,100,100));
		g.rect(0,0,stage.canvas.width,stage.canvas.height);
		var s = new Shape(g);
		s.x = 0;
		s.y = 0;
		stage.addChild(s);
		stage.update();
	}


	function fireAction(action) {
		switch(action) {
			case "FORWARD": 
				player.actionForward();
				break;
			case "BACKWARD":
				player.actionBackward();
				break;
			case "STAND":
				player.actionStand();
				break;
			default:
				console.log("action unhandled:",action);
				break;
		}
	}

	function notifyOnInput(id) {
		audio.soundOn(id,3);
	}

	var stage = undefined;
	return {
		init: function () {
			audio.initialize();
			audio.addSound(FOOT1, 261.63, 3); 
			audio.addSound(FOOT2, 329.63, 3); 
			audio.addSound(FOOT3, 392.00, 3); 
			audio.addSound(STAND, 400.00, 3); 
			var canvas = document.getElementById("testCanvas");
			stage = new Stage(canvas);
			projector.initialize(stage.canvas.width,800);
			input.initialize(fireAction,notifyOnInput);
			initBackground();
			grid.initialize();
			player.initialize();
			player.shiftForward = grid.shiftForward.bind(grid);
			player.shiftBackward = grid.shiftBackward.bind(grid);

			_.each(grid.layers, function(layer,layerIndex) {
				stage.addChild(layer.shape);
				if(layerIndex==5) {
					stage.addChild(player.sprite);
				}
			});
			stage.update();
			Ticker.setFPS(30);
			Ticker.useRAF = true;
			Ticker.addListener(this);
		},
		tick: function (elapsedTime) {
			input.advance();
			audio.advance();
			grid.advance();
			player.advance();
			stage.update();
		}
	}
}());
