var FOOT1 = 1, FOOT2 = 2, FOOT3 = 3, STAND = 4;

var   b2Vec2 = Box2D.Common.Math.b2Vec2
,  b2AABB = Box2D.Collision.b2AABB
,	b2BodyDef = Box2D.Dynamics.b2BodyDef
,	b2Body = Box2D.Dynamics.b2Body
,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
,	b2Fixture = Box2D.Dynamics.b2Fixture
,	b2World = Box2D.Dynamics.b2World
,	b2MassData = Box2D.Collision.Shapes.b2MassData
,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
,	b2Math = Box2D.Common.Math.b2Math
;

var world = new b2World(
   new b2Vec2(0, 10)    //gravity
,  true                 //allow sleep
);

var fixDef = new b2FixtureDef;
fixDef.density = 1.0;
fixDef.friction = 0.5;
fixDef.restitution = 0.2;

var bodyDef = new b2BodyDef;

//create ground
bodyDef.type = b2Body.b2_staticBody;
fixDef.shape = new b2PolygonShape;
fixDef.shape.SetAsBox(20, 2);
bodyDef.position.Set(10, 400 / 30 + 1.8);
world.CreateBody(bodyDef).CreateFixture(fixDef);
bodyDef.position.Set(10, -1.8);
world.CreateBody(bodyDef).CreateFixture(fixDef);
fixDef.shape.SetAsBox(2, 14);
bodyDef.position.Set(-1.8, 13);
world.CreateBody(bodyDef).CreateFixture(fixDef);
bodyDef.position.Set(21.8, 13);
world.CreateBody(bodyDef).CreateFixture(fixDef);
 
//create object
bodyDef.type = b2Body.b2_dynamicBody;
fixDef.shape = new b2PolygonShape;
fixDef.friction = 1.5;
fixDef.shape.SetAsBox( 0.1, 0.1 );
bodyDef.position.x = Math.random() * 10;
bodyDef.position.y = Math.random() * 10;
var playerFixture = world.CreateBody(bodyDef).CreateFixture(fixDef);

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
		{action:"JUMPUP",	sequence:[[2,3]]},
		{action:"JUMPDOWN",	sequence:[[1,2]]},
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
		cell: {width:150,height:150,overlap:150/3},
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
			return this.screen.height - this.cell.height - layer*(this.cell.height-this.cell.overlap);
		},
		scaleX: function(cellCount, layer) {
			return this.cell.width/(layer+1);
		}
	}
}());

var player = (function() {
	return {
		virtual: {pX:0,pY:1,tX:0,tY:1},
		screen: {pX:75, pY:175, tX:75, tY:175},
		sprite: undefined,
		debugSprite: undefined,
		shiftForward: function() {console.log("override player.shiftForward");},
		shiftBackward: function() {console.log("override player.shiftBackward");},
		spriteParameters: {
			images: ["assets/chin.png"],
			frames: {count:6, width:150, height:150,regX:75,regY:75},
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
			var g = new Graphics();
			g.setStrokeStyle(1);
			g.beginStroke(Graphics.getRGB(255,255,255));
			g.rect(0,0,projector.cell.width,projector.cell.height);
			this.debugSprite = new Shape(g);
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
			this.sprite.x = playerFixture.GetBody().GetWorldCenter().x * 30;
			this.sprite.y = playerFixture.GetBody().GetWorldCenter().y * 30;

		},
		actionForward: function() {
			var body = playerFixture.GetBody();
			var velocity = body.GetLinearVelocity().x;
			var targetVelocity = b2Math.Max( velocity - 5.0, -10.0 );
			var velChange = targetVelocity - velocity;
			var impel = body.GetMass() * velChange;
			console.log(body.GetMass()*velChange);
			body.ApplyImpulse( new b2Vec2(impel,0), body.GetWorldCenter() );
			this.sprite.gotoAndPlay("step1");		
		},
		actionBackward: function() {
			var body = playerFixture.GetBody();
			if( body.GetLinearVelocity().x < 7 ) {
				body.ApplyImpulse( new b2Vec2(0.25,0), playerFixture.GetBody().GetWorldCenter() );
			}
			// no sprite currently exists for backsteps...
		},
		actionStand: function() {
			this.sprite.gotoAndPlay("stand");		
		},
		actionJumpUp: function() {
			this.virtual.tY = this.virtual.tY + 1;
		},
		actionJumpDown: function() {
			this.virtual.tY = this.virtual.tY - 1;
		}
	}
}());

var grid = (function () {
	return {
		layers: [],
		layerMaps:[],
		maxLayers:4,
		virtual: {x:-30},
		initialize: function() {
			for(var layer=0;layer<this.maxLayers;layer+=1) {
				var map = [];
				for(var index=0;index<60;index+=1) {
					map.push(Math.floor(Math.random() * 2));
				}
				this.layerMaps.push(map);
			}
			_.each(this.layerMaps, function(layerMap,layerIndex) {
				var g = new Graphics();
				g.setStrokeStyle(1);
				g.beginStroke(Graphics.getRGB(0,0,0));
				g.beginFill(Graphics.getRGB(100,0,100));
				_.each(layerMap, function(mapElement,mapIndex) {
					if( mapElement > 0 ) {
						var height = projector.cell.height/(Math.floor(Math.random()*5)+1);
						g.rect(
							mapIndex*projector.cell.width,
							height,
							projector.cell.width,
							projector.cell.height-height);
					}
				}, this);
				var layer = {
					x:projector.projectX(this.virtual.x),
					y:projector.projectY(layerIndex),
					xT:projector.projectX(this.virtual.x),
					yT:projector.projectY(layerIndex),
					shape:new Shape(g)
				};
				layer.shape.x = layer.x;
				layer.shape.y = layer.y;
				this.layers.push( layer );
			},this);
		},
		shiftForward: function() {
			_.each(this.layers, function(layer,index) {
				layer.xT+=projector.scaleX(1,index);
			},this);
		},
		shiftBackward: function() {
			_.each(this.layers, function(layer,index) {
				layer.xT-=projector.scaleX(1,index);
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
		return;
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
			case "JUMPUP":
				player.actionJumpUp();
				break;
			case "JUMPDOWN":
				player.actionJumpDown();
				break;
			default:
				console.log("action unhandled:",action);
				break;
		}
	}

	function notifyOnInput(id) {
		audio.soundOn(id,3);
	}

    function initBox2D(canvas) {
		//setup debug draw
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(canvas.getContext("2d"));
		debugDraw.SetDrawScale(30.0);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		world.SetDebugDraw(debugDraw);
	}

	function advancePhysics() {
		var FPS = 30;
		world.ClearForces();
		world.Step(1 / FPS, 10, 10);
		world.DrawDebugData();
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
			projector.initialize(stage.canvas.width,500);
			input.initialize(fireAction,notifyOnInput);
			initBackground();
			grid.initialize();
			player.initialize();
			player.shiftForward = grid.shiftForward.bind(grid);
			player.shiftBackward = grid.shiftBackward.bind(grid);

			for(var rIndex=grid.layers.length-1; rIndex>=0; rIndex-=1)
			{
				var layer = grid.layers[rIndex];
				stage.addChild(layer.shape);
				if(rIndex==player.virtual.pY) {
					stage.addChild(player.sprite);
				}
			}

			stage.addChild(player.debugSprite);
			initBox2D(canvas);
			stage.update();
			Ticker.setFPS(30);
			Ticker.useRAF = true;
			Ticker.addListener(this);
		},

		tick: function (elapsedTime) {
			input.advance();
			audio.advance();
			grid.advance();
			advancePhysics();
			player.advance();
			stage.update();
		}
	}
}());
