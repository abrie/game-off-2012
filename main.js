var FOOT1 = 1, FOOT2 = 2, FOOT3 = 3, STAND = 4;

var b2Vec2 = Box2D.Common.Math.b2Vec2
,   b2AABB = Box2D.Collision.b2AABB
,	b2BodyDef = Box2D.Dynamics.b2BodyDef
,	b2Body = Box2D.Dynamics.b2Body
,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
,	b2Fixture = Box2D.Dynamics.b2Fixture
,	b2World = Box2D.Dynamics.b2World
,	b2MassData = Box2D.Collision.Shapes.b2MassData
,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
,   b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
,	b2Math = Box2D.Common.Math.b2Math
;

var FPS = 30;
var PPM = 30;

var physics = (function() {
	"use strict";
	var world = undefined;
	return {
		advance: function() {
			world.ClearForces();
			world.Step(1 / FPS, 10, 10);
			world.DrawDebugData();
		},
		initialize: function() {
			world = new b2World( new b2Vec2(0, 10),  true );

			var fixDef = new b2FixtureDef;
			fixDef.density = 1.0;
			fixDef.friction = 0.5;
			fixDef.restitution = 0.2;

			var bodyDef = new b2BodyDef;

			bodyDef.type = b2Body.b2_staticBody;
			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(1000/2/PPM, 10/2/PPM);
			bodyDef.position.Set(1000/2/PPM, 500/PPM);
			world.CreateBody(bodyDef).CreateFixture(fixDef);
			bodyDef.position.Set(1000/2/PPM, 0);
			world.CreateBody(bodyDef).CreateFixture(fixDef);

			fixDef.shape = new b2PolygonShape;
			fixDef.shape.SetAsBox(100/2/PPM, 100/2/PPM);
			bodyDef.position.Set(0,0);
			world.CreateBody(bodyDef).CreateFixture(fixDef);
		},
		createDynamicBody: function(x,y) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
			bodyDef.position.x = x;
			bodyDef.position.y = y;

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 1.5;
			fixtureDef.restitution = 0.2;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( 150/PPM/2, 150/PPM/2 );

			var body = world.CreateBody(bodyDef);
			body.CreateFixture(fixtureDef);
			return body;
		},
		createStaticBody: function(x,y) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_staticBody;
            bodyDef.position.Set(x,y);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 1.5;
			fixtureDef.restitution = 0.2;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( 150/PPM/2, 150/PPM/2 );

			var body = world.CreateBody(bodyDef);
			body.CreateFixture(fixtureDef);
			return body;
		},
		setDebugDraw: function(canvas) {
			var debugDraw = new b2DebugDraw();
			debugDraw.SetSprite(canvas.getContext("2d"));
			debugDraw.SetDrawScale(PPM);
			debugDraw.SetFillAlpha(0.5);
			debugDraw.SetLineThickness(1.0);
			debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
			world.SetDebugDraw(debugDraw);
		}
	}
	
}());

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

var relativeX = 0;
var relativeY = 0;
var dressedBody = function(physicsBody, sprite) {
	this.body = physicsBody;
	this.skin = sprite;
    this.originX = this.body.GetWorldCenter().x * PPM;
    this.originY = this.body.GetWorldCenter().y * PPM;
	this.animate = function(label) {
		this.skin.gotoAndPlay(label);
	};

	this.getBody = function() {
		return this.body;
	};

	this.impulse = function(direction) {
		var velocity = this.body.GetLinearVelocity().x;
		var targetVelocity = direction < 0 ?
			b2Math.Max( velocity - 5.0, -10.0 ) : b2Math.Min( velocity + 5.0, 10.0 ); 
		var velChange = targetVelocity - velocity;
		var impel = this.body.GetMass() * velChange;
		this.body.ApplyImpulse( new b2Vec2(impel,0), this.body.GetWorldCenter() );
	};

    this.getSkinX = function() {
        return this.skin.x;
    },

	this.update = function() {
        relativeX = this.originX - this.body.GetWorldCenter().x * PPM; 
        relativeY = this.originY - this.body.GetWorldCenter().y * PPM;
		this.skin.x = 1000/2;
		this.skin.y = 500/2;
        console.log(relativeX,relativeY);
	};
}

var dressedStaticBody = function(physicsBody, sprite) {
	this.body = physicsBody;
	this.skin = sprite;

	this.getBody = function() {
		return this.body;
	};

	this.update = function() {
		this.skin.x = this.body.GetWorldCenter().x * PPM + relativeX;
		this.skin.y = this.body.GetWorldCenter().y * PPM + relativeY;
	};
}

var player = (function() {
	return {
		virtual: {pX:0,pY:1,tX:0,tY:1},
		screen: {pX:75, pY:175, tX:75, tY:175},
		sprite: undefined,
		dressedBody: undefined,
		shiftForward: function(amount) {console.log("override player.shiftForward");},
		shiftBackward: function(amount) {console.log("override player.shiftBackward");},
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
		initialize: function(physicsBody) {
			var spriteSheet  = new createjs.SpriteSheet(this.spriteParameters);
			if (!spriteSheet.complete) {
					spriteSheet.onComplete = function(e) {
						console.log("preloading needed. this is a big issue.",e);
						this.generatePlayerSpriteAnimation(physicsBody, spriteSheet);
					}
			}
			else {
				this.generatePlayerSpriteAnimation(physicsBody, spriteSheet);
			}
		},
		generatePlayerSpriteAnimation: function(physicsBody, spriteSheet) {
			this.screen.pX = this.screen.tX = projector.projectX(this.virtual.pX);
			this.screen.pY = this.screen.tY = projector.projectY(this.virtual.pY);
			this.sprite = new createjs.BitmapAnimation(spriteSheet);
			this.dressedBody = new dressedBody(physicsBody, this.sprite);
			this.dressedBody.animate("still");		
		},
		advance: function() {
			this.dressedBody.update();
		},
		actionForward: function() {
			this.dressedBody.impulse(-1);
			this.dressedBody.animate("step1");
		},
		actionBackward: function() {
			this.dressedBody.impulse(1);
			// no sprite currently exists for backsteps...
		},
		actionStand: function() {
			this.dressedBody.animate("stand");		
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

	var stage = undefined;
    var context = undefined;
    var otherBodies = [];
	return {
		init: function () {
			audio.initialize();
			audio.addSound(FOOT1, 261.63, 3); 
			audio.addSound(FOOT2, 329.63, 3); 
			audio.addSound(FOOT3, 392.00, 3); 
			audio.addSound(STAND, 400.00, 3); 
			var canvas = document.getElementById("testCanvas");
            context = canvas.getContext("2d");
            var context_x = 0;
			physics.initialize();
			physics.setDebugDraw(canvas);

			player.initialize( physics.createDynamicBody(1000/2/PPM,500/2/PPM) );

			stage = new Stage(canvas);
			stage.addChild(player.sprite);

            var g = new Graphics();
            g.setStrokeStyle(1);
            g.beginStroke(Graphics.getRGB(0,0,0));
            g.beginFill(Graphics.getRGB(100,0,100));
            g.rect(0,0,50,50);
            var r1 = new Shape(g);
            otherBodies.push( new dressedStaticBody( physics.createStaticBody(1000/2/PPM,250/2/PPM), r1 ) );
            stage.addChild(r1);
            
			stage.update();

			input.initialize(fireAction,notifyOnInput);
			Ticker.setFPS(FPS);
			Ticker.useRAF = true;
			Ticker.addListener(this);
		},

		tick: function (elapsedTime) {
			input.advance();
			audio.advance();
			grid.advance();
			player.advance();
            _.each(otherBodies,function(body) { body.update(); });
			physics.advance();
			stage.update();
		}
	}
}());
