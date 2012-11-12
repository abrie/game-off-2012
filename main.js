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
	var cell,vanish;
	return {
		width:undefined,
		height:undefined,
		initialize: function(width,height) {
			this.width = width;
			this.height = height;
			cell = {w:150,h:150};
			vanish = {x:this.width/2,y:this.height};
		},
		projectX: function(i,level) {
			return i*cell.w/level+vanish.x;
		},
		projectY: function(level) {
			return vanish.y/level;
		}
	}
}());

var player = (function() {
	return {
		virtual: {pX:10,pY:3.5,tX:10,tY:1},
		pX:75,
		pY:175,
		tX:75,
		tY:175,
		sprite: undefined,
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
			this.pY = projector.projectY(this.virtual.pY)-150;
		} ,

		generatePlayerSpriteAnimation: function(spriteSheet) {
			this.sprite = new createjs.BitmapAnimation(spriteSheet);
			this.sprite.gotoAndPlay("still");		
			this.sprite.x = player.pX;
			this.sprite.y = player.pY;
		},
		advance: function() {
			if (this.virtual.pX != this.virtual.tX) {
				this.virtual.pX += (this.virtual.tX - this.virtual.pX);
				this.tX = projector.projectX(this.virtual.pX,this.virtual.pY);
				this.pY = projector.projectY(this.virtual.pY)-150;
			}
			if (this.pX != this.tX) {
				this.pX += (this.tX - this.pX)/2 ;
			}
			this.sprite.x = this.pX;
			this.sprite.y = this.pY;
		},
		actionForward: function() {
			this.virtual.tX = this.virtual.tX - 1;
			if (this.virtual.tX < -5) {
				this.virtual.tX = 5;
			}
			this.sprite.gotoAndPlay("step1");		
		},
		actionBackward: function() {
			this.virtual.tX = this.virtual.tX + 1;
			if (this.virtual.tX > 5) {
				this.virtual.tX = -5;
			}
		},
		actionStand: function() {
			this.sprite.gotoAndPlay("stand");		
		}
	}
}());

var grid = (function () {
	return {
		shape: undefined,
		initialize: function() {
			var g = new Graphics();
			g.setStrokeStyle(1);
			g.beginStroke(Graphics.getRGB(255,255,255));
			for(var level=2;level<=4;level+=1) {
				g.moveTo(0,projector.projectY(level));
				g.lineTo(projector.width ,projector.projectY(level));
				for(var i = -30, end = 30; i <= end; i+=1) {
					var baseX = projector.projectX(i,level), baseY = projector.projectY(level);
					var headX = projector.projectX(i,level+1), headY = projector.projectY(level+1);
					g.moveTo(baseX, baseY);
					g.lineTo(headX, headY);
					g.moveTo(baseX, baseY);
					g.lineTo(baseX, baseY-25);
				}
			}
			for(var level=2;level<=5;level+=1) {
				g.moveTo(0,projector.projectY(level));
				g.lineTo(projector.width, projector.projectY(level));
				for(var i = -30, end = 30; i <= end; i+=1) {
					var baseX = projector.projectX(i,level), baseY = projector.projectY(level);
					var baseWidth = projector.projectX(i+1,level) - projector.projectX(i,level);
					var headX = projector.projectX(i,level+1), headY = projector.projectY(level+1);
					g.beginFill(Graphics.getRGB(100,0,100));
					g.rect(baseX, baseY-100/level, baseWidth, 100/level);
				}
			}
			g.moveTo(0,projector.projectY(5));
			g.lineTo(projector.width, projector.projectY(5));
			this.shape = new Shape(g);
			this.shape.x = 0;
			this.shape.y = 0;
		}
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
			stage.addChild(grid.shape);
			player.initialize();
			stage.addChild(player.sprite);
			stage.update();
			Ticker.setFPS(30);
			Ticker.useRAF = true;
			Ticker.addListener(this);
		},
		tick: function (elapsedTime) {
			input.advance();
			audio.advance();
			player.advance();
			stage.update();
		}
	}
}());
