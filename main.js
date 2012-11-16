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
			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 1.5;
			fixtureDef.restitution = 0.2;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( 150/PPM/2, 150/PPM/2 );

			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);

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
		setDebugDraw: function(context) {
			var debugDraw = new b2DebugDraw();
			debugDraw.SetSprite(context);
			debugDraw.SetDrawScale(PPM);
			debugDraw.SetFillAlpha(0.5);
			debugDraw.SetLineThickness(1.0);
			debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
			world.SetDebugDraw(debugDraw);
		},
        drawDebug: function() {
            // note that drawing in debug mode does not account for the player camera position.
            world.DrawDebugData();
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

var playspace = (function() {
    return {
        pieces: [],
        container: new Container,
        initialize: function() {},
        addStaticBody: function(body,skin) {
            this.pieces.push( {body:body,skin:skin} );
            this.container.addChild(skin);
        },
        advance: function() {
            _.each( this.pieces, function(piece) {
                piece.skin.x = piece.body.GetWorldCenter().x * PPM;
                piece.skin.y = piece.body.GetWorldCenter().y * PPM;
            });
        },
        bindCamera: function(camera) {
            camera.onCamera = this.updateCamera.bind(this);
        },
        bindParallax: function(reference) {
            reference.onParallax = this.updateParallax.bind(this);
        },
        updateCamera: function(x,y) {
            this.container.x = x;
            this.container.y = y;
        },
        updateParallax: function(amount) {
            console.log("parallax update:",amount);
        }
    }
}());

var assets = (function() {
    var loadCount = 0, spriteSheetDescriptions = [{
        name: "player",
        images: ["assets/chin.png"],
        frames: {count:6, width:150, height:150,regX:75,regY:75},
        animations: {
            stand: {frames:[0], next:false, frequency:3},
            still: {frames:[1], next:false, frequency:1 },
            step1: {frames:[2,3,4,5,3,1], next:"land", frequency:2 },
            land: {frames:[1], next:false, frequency:1},
        }
    }];

    return {
        onReady: undefined,
        animations: {},
        initialize: function() {
            _.each( spriteSheetDescriptions, function(description) {
                this.load(description);
            }, this);

        },
        load: function(description) {
            var spriteSheet  = new createjs.SpriteSheet(description);
            var processor = this.process.bind(this, description, spriteSheet);
            if (!spriteSheet.complete) {
                spriteSheet.onComplete = processor;
            }
            else {
                processor();
            }
        },
        process: function(description, spriteSheet) {
			var animation = new createjs.BitmapAnimation(spriteSheet);
            this.animations[description.name] = animation;
            loadCount += 1;
            if( loadCount == spriteSheetDescriptions.length ) {
                this.onReady();
            }
        },
        getAnimation: function(name) {
            return this.animations[name];
        }
    }
}());


var player = (function() {
	return {
		sprite: undefined,
        body: undefined,
        origin: {},
        onCamera: function(x,y) { console.log("override onCamera"); },
        onParallax: function(d) { console.log("override onParallax"); },
        impulse: function(direction) {
            var velocity = this.body.GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - 5.0, -10.0 ) : b2Math.Min( velocity + 5.0, 10.0 ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body.GetMass() * velChange;
            this.body.ApplyImpulse( new b2Vec2(impel,0), this.body.GetWorldCenter() );
        },
		initialize: function(body,skin) {
            this.body = body;
            this.sprite = skin;
            this.sprite.gotoAndPlay("still");
            this.origin.x = this.body.GetWorldCenter().x;
            this.origin.y = this.body.GetWorldCenter().y;
		},
		advance: function() {
            var center = this.body.GetWorldCenter();
            var x = (this.origin.x - center.x) * PPM; 
            var y = (this.origin.y - center.y) * PPM;
            this.onCamera(x,y);
            this.onParallax(this.origin.x - center.x);
            this.sprite.x = 1000/2;
            this.sprite.y = 500/2;
		},
		actionForward: function() {
			this.impulse(-1);
            this.sprite.gotoAndPlay("step1");
		},
		actionBackward: function() {
			this.impulse(1);
			// no sprite currently exists for backsteps...
		},
		actionStand: function() {
			this.sprite.gotoAndPlay("stand");		
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
			default:
				console.log("action unhandled:",action);
				break;
		}
	}

	function notifyOnInput(id) {
		audio.soundOn(id,3);
	}

    function initializeAudio() {
        audio.initialize();
        audio.addSound(FOOT1, 261.63, 3); 
        audio.addSound(FOOT2, 329.63, 3); 
        audio.addSound(FOOT3, 392.00, 3); 
        audio.addSound(STAND, 400.00, 3); 
    }

    var context, stage = undefined;
    function initializeCanvas() {
        var canvas = document.getElementById("testCanvas");
        context = canvas.getContext("2d");
        stage = new Stage(canvas);
    }

    function generateTestSprite(width,height) {
        var g = new Graphics();
        g.setStrokeStyle(1);
        g.beginStroke(Graphics.getRGB(0,0,0));
        g.beginFill(Graphics.getRGB(100,0,100));
        g.rect(0,0,width,height);
        return new Shape(g);
    }

	return {
        preload: function() {
            assets.onReady = this.start.bind(this);
            assets.initialize();
        },
		start: function () {
            initializeAudio();
            initializeCanvas();
            physics.initialize();
            physics.setDebugDraw(context);

            var playerBody = physics.createDynamicBody(1000/2/PPM,500/2/PPM);
            var playerSkin = assets.getAnimation("player");
            player.initialize( playerBody, playerSkin );
            stage.addChild(player.sprite);

            var body = physics.createStaticBody(1000/2/PPM,300/2/PPM);
            var skin = generateTestSprite(50,50);
            playspace.initialize();
            playspace.bindCamera(player);
            playspace.bindParallax(player);
            playspace.addStaticBody( body, skin ); 
            stage.addChild(playspace.container);
            
            input.initialize(fireAction,notifyOnInput);
            Ticker.setFPS(FPS);
            Ticker.useRAF = true;
            Ticker.addListener(this);
		},

		tick: function (elapsedTime) {
			input.advance();
			audio.advance();
			player.advance();
            playspace.advance();
			physics.advance();
			stage.update();
		}
	}
}());
