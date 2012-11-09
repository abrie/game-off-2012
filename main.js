var audio = (function () {
	"use strict";

	var FOOT1 = 1, FOOT2 = 2, FOOT3 = 3, STAND = 4;
	var frequencyMap = {};
	function initFrequencyMap() {
		frequencyMap[FOOT1] = 261.63;
		frequencyMap[FOOT2] = 329.63;
		frequencyMap[FOOT3] = 392;
		frequencyMap[STAND] = 400;
	}

	function newOscillator( id, duration ) {
		var result = {
			id: id,
			duration: duration,
			volumeNode: audio_context.createGainNode(),
			o : undefined,
			createOscillator : function() {
				this.duration = duration;
				this.o = audio_context.createOscillator();
				this.o.frequency.value = frequencyMap[id];
				this.o.connect(this.volumeNode);
			},
			initialize : function() {
				this.volumeNode.connect(audio_context.destination);
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
				this.o.noteOff(audio_context.currentTime+0.01);
				this.active = false;
				this.needsReset = true;
			},
			needsReset:false,
			reset : function() {
				this.o.disconnect();
				this.o = undefined;
				this.createOscillator();
				this.needsReset = false;
			},
			advance : function() {
				if (this.needsReset) {
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
	function initOscillators() {
		oscillators[FOOT1] = newOscillator(FOOT1, 3);
		oscillators[FOOT2] = newOscillator(FOOT2, 3);
		oscillators[FOOT3] = newOscillator(FOOT3, 3);
		oscillators[STAND] = newOscillator(STAND, 3);
	}



	var audio_context = undefined;
	return {
		initialize : function() {
			try {
				audio_context = new (window.AudioContext || window.webkitAudioContext);
			} catch (e) {
				alert('There is no audio oscillator support in this browser');
			}
			initFrequencyMap();
			initOscillators();
		},
		soundOn : function (which, length) {
			oscillators[which].start();
		},
		advanceSounds : function () {
			_.each(oscillators, function(v,k) {
				v.advance();
			});
		}
	}
}());

var main = (function () {
	"use strict";

	var currentInputFrame = [],
		inputState = {},
		inputHistory = [];
	function notifyOnInput(id) {
		currentInputFrame.push(id);
	}

	function inputOn(id) {
		if (!inputState[id]) {
			notifyOnInput(id);
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

	var ACTIONS = [
		{action:"COMBO",	sequence:[[3],[1,2],[1]]},
		{action:"FORWARD",	sequence:[[3],[2],[1]]},
		{action:"WOBBLE",	sequence:[[3],[1],[2]]},
		{action:"BACKWARD",	sequence:[[1],[2],[3]]},
	];

	function scanForAction() {
		ACTIONS.every( function(element) {
			if(matchSequence(element.sequence)) {
				fireAction(element.action);
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
		return sequence.every( function(element,index) {
			var frame = inputHistory[ inputHistory.length - 1 - index];
			return frame ? arrays_equal(element,frame) : false;
		});
	}

	var FOOT1 = 1, FOOT2 = 2, FOOT3 = 3, STAND = 4;
	var keyMap = {76:FOOT1, 75:FOOT2, 74:FOOT3, 72:STAND};

	function onKeyDown(keyCode) {
		var mapped = keyMap[keyCode];
		if (mapped) {
			inputOn(mapped);
			audio.soundOn(mapped,3);
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
		//cross browser issues exist, says EaselJS
		if(!e){ var e = window.event; }
		return onKeyDown(e.keyCode);
	}

	function handleKeyUp(e) {
		//cross browser issues exist, says EaselJS
		if(!e){ var e = window.event; }
		return onKeyUp(e.keyCode);
	}

	var player = {pX:500,pY:100,tX:500,tY:100}
	function initPlayer() {
		var playerSpriteParameters = {
			images: ["assets/chin.png"],
			frames: {count:6, width:150, height:150, regX:75, regY:75},
			animations: {
				stand: {frames:[0], next:false, frequency:3},
				still: {frames:[1], next:false, frequency:1 },
				step1: {frames:[2,3,4,5,3,1], next:"land", frequency:2 },
				land: {frames:[1], next:false, frequency:1},
			}
		};
		var spriteSheet  = new createjs.SpriteSheet(playerSpriteParameters);
		if (!spriteSheet.complete) {
				spriteSheet.onComplete = function() {
					generatePlayerSpriteAnimation(spriteSheet);
				}
		}
		else {
			generatePlayerSpriteAnimation( spriteSheet );
		}
	}
	var playerSprite = undefined;
	function generatePlayerSpriteAnimation( spriteSheet ) {
		playerSprite = new createjs.BitmapAnimation(spriteSheet);
		playerSprite.gotoAndPlay("still");		
		playerSprite.x = player.pX;
		playerSprite.y = player.pY;
		stage.addChild(playerSprite);
	}


	function fireAction(action) {
		switch(action) {
			case "FORWARD": 
				playerSprite.gotoAndPlay("step1");		
				player.tX = player.tX - 100;
				clearInputHistory();
				break;
			case "BACKWARD":
				player.tX = player.tX + 100;
				clearInputHistory();
				break;
			case "STAND":
				playerSprite.gotoAndPlay("stand");		
				clearInputHistory();
				break;
			default:
				console.log("action unhandled:",action);
				clearInputHistory();
				break;
		}
	}

var stage = undefined;
		return {
			init: function () {
				audio.initialize();
				document.onkeydown = handleKeyDown;
				document.onkeyup = handleKeyUp;
				var canvas = document.getElementById("testCanvas");

				stage = new Stage(canvas);
				initPlayer();

				stage.update();
				Ticker.setFPS(30);
				Ticker.useRAF = true;
				Ticker.addListener(this);
			},
			tick: function (elapsedTime) {
				pushInputFrame();
				scanForAction();
				audio.advanceSounds();
				if (player.pX != player.tX) {
					player.pX += (player.tX - player.pX)/2 ;
				}
				playerSprite.x = player.pX;
				playerSprite.y = player.pY;
				if (player.tX > stage.canvas.width) { player.tX = 0; }
				if (player.tX < 0) { player.tX = stage.canvas.width; }
				stage.update();
			}
		}

}());
