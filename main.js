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
var PPM = 150;

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
		},
		createDynamicBody: function(x,y,width,height,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x/PPM,y/PPM);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.05;
			fixtureDef.restitution = 0.2;
            fixtureDef.filter.maskBits = mask;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( width/2/PPM, height/2/PPM );

			return body.CreateFixture(fixtureDef);
		},
		createStaticBody: function(x,y,width,height,category) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_staticBody;
            bodyDef.position.Set(x/PPM,y/PPM);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.5;
			fixtureDef.restitution = 0.2;
            fixtureDef.filter.categoryBits = category;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( width/2/PPM, height/2/PPM );

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
		{action:"STAND",	sequence:[[4]]},
        {action:"BRAKE",    sequence:[[3]]}
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

var assets = (function() {
    var loadCount = 0, spriteSheetDescriptions = [{
        name: "player",
        images: ["assets/chin.png"],
        frames: {count:6, width:150, height:150,regX:75,regY:110},
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

var playspace = (function() {
    return {
        player: {body:undefined, skin:undefined, origin:undefined},
        layers: {},
        container: new Container,
        initialize: function() {},
        addPlayer: function(fixture,skin) {
            this.player.fixture = fixture;
            this.player.body = function() { return this.fixture.GetBody(); };
            this.player.skin = skin;
            this.container.addChild(this.player.skin);
        },
        addStaticBody: function(body,skin,layerNumber) {
            var layer = this.getLayer(layerNumber);
            var origin = body.GetWorldCenter();
            layer.push( {body:body,skin:skin, origin:{x:origin.x, y:origin.y}} );
            this.container.addChild(skin);
        },
        getLayer: function(layer) {
            var result = this.layers[layer];
            if(result) {
                return result;
            }
            else {
                this.layers[layer] = [];
                return this.layers[layer];
            }
        },
        advance: function() {
            this.player.skin.rotation = this.player.body().GetAngle() * (180 / Math.PI);
            this.player.skin.x = this.player.body().GetWorldCenter().x * PPM;
            this.player.skin.y = this.player.body().GetWorldCenter().y * PPM;
            _.each( this.layers, function(layer, key) {
                _.each( layer, function(piece) {
                    piece.skin.rotation = piece.body.GetAngle() * (180 / Math.PI);
                    piece.skin.x = piece.body.GetWorldCenter().x * PPM;
                    piece.skin.y = piece.body.GetWorldCenter().y * PPM;
                });
            }, this);
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
            _.each( this.layers, function(layer, key) {
                if(key==1) {
                    return;
                }
                _.each( layer, function(piece) {
                    var position = piece.body.GetWorldCenter();
                    position.x = piece.origin.x-amount/key;
                    piece.body.SetPosition(position);
                });
            }, this);
        }
    }
}());

var player = (function() {
	return {
		sprite: undefined,
        body: undefined,
        origin: {},
        camera: {},
        margin: {width:280, height:100},
        onCamera: function(x,y) { console.log("override onCamera"); },
        onParallax: function(d) { console.log("override onParallax"); },
        impulse: function(direction, rate, max) {
            var velocity = this.body().GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - rate, -max ) : b2Math.Min( velocity + rate, max ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body().GetMass() * velChange;
            this.body().ApplyImpulse( new b2Vec2(impel,0), this.body().GetWorldCenter() );
        },
        brake: function(direction) {
            var velocity = this.body().GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - 0.5, 0 ) : b2Math.Min( velocity + 0.5, 0 ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body().GetMass() * velChange;
            this.body().ApplyImpulse( new b2Vec2(impel,0), this.body().GetWorldCenter() );
        },
        jump: function(direction) {
            var velocity = this.body().GetLinearVelocity();
            velocity.y = -5;
            var filter = this.fixture.GetFilterData();
            filter.maskBits = 2;
            this.fixture.SetFilterData(filter);
            this.body().SetLinearVelocity(velocity);
        },
		initialize: function( fixture, skin, cameraOffset ) {
            this.cameraOffset = cameraOffset;
            this.fixture = fixture;
            this.body = function() { return fixture.GetBody(); }
            this.sprite = skin;
            this.sprite.gotoAndPlay("still");
            var current = this.body().GetWorldCenter();
            this.origin = {x:current.x, y:current.y};
            this.camera = {x:current.x * PPM, y:current.y*PPM};
		},
		advance: function() {
            var current = this.body().GetWorldCenter();

            var currentY = current.y * PPM;
            var deltaY = currentY - this.camera.y;
            var absDeltaY = Math.abs(deltaY);
            if (absDeltaY >= this.margin.height ) {
                //thanks to http://stackoverflow.com/a/7624945 for the sign code
                this.camera.y = currentY - (deltaY && deltaY / absDeltaY * this.margin.height);
            }

            var currentX = current.x * PPM;
            var deltaX = currentX - this.camera.x;
            var absDeltaX = Math.abs(deltaX);
            if (absDeltaX >= this.margin.width ) {
                var sign = deltaX && deltaX / absDeltaX;  
                this.camera.x = currentX - (sign * this.margin.width);

                var amount = (current.x - this.origin.x)-(sign*this.margin.width/PPM);
                this.onParallax( amount );
            }

            this.onCamera(-this.camera.x+this.cameraOffset.x,-this.camera.y+this.cameraOffset.y);
		},
		actionForward: function() {
			this.impulse(-1, 1, 5);
            this.sprite.gotoAndPlay("step1");
		},
		actionBackward: function() {
			this.impulse(1, 1, 5);
			// no sprite currently exists for backsteps...
		},
		actionStand: function() {
            this.jump();
			this.sprite.gotoAndPlay("stand");		
		},
		actionBrake: function() {
            this.brake();
            console.log("brake!");
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
			case "BRAKE":
				player.actionBrake();
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

    var canvas, context, stage = undefined;
    function initializeCanvas() {
        canvas = document.getElementById("testCanvas");
        context = canvas.getContext("2d");
        stage = new Stage(canvas);
        stage.autoClear = true;
    }

    function generateTestSprite(width,height, fill,depth) {
        var blurFilter = new createjs.BoxBlurFilter(depth, depth, 1);
        var margins = blurFilter.getBounds();

        var g = new createjs.Graphics();
        g.setStrokeStyle(1);
        g.beginStroke(createjs.Graphics.getRGB(0,0,0));
        g.beginFill(fill);
        g.rect(0,0,width,height);
        var displayObject = new createjs.Shape(g);
        displayObject.regX = width/2;
        displayObject.regY = height/2;
        displayObject.filters = [blurFilter];
        displayObject.cache(margins.x,margins.y,width+margins.width,height+margins.height);
        return displayObject;
    }

    function populatePlayspace() {
        var blurs = [0, 4, 16, 64].reverse();
        var categories = [1, 2, 4, 8].reverse();
        var parallax = [1.5, 1.7, 3, 2.2, 5].reverse();
        var colors = [
            Graphics.getRGB(255,255,255),
            Graphics.getRGB(0,128,0),
            Graphics.getRGB(0,0,128),
            Graphics.getRGB(0,128,128)]; 
            
        var floorBody = physics.createStaticBody(0,500,10000,10,255);
        var floorSkin = generateTestSprite(10000,10,colors[0],10);
        playspace.addStaticBody( floorBody, floorSkin, 1 );
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

            var playerFixture = physics.createDynamicBody(0,0,75,75,1);
            var playerSkin = assets.getAnimation("player");
            player.initialize( playerFixture, playerSkin, {x:canvas.width/2, y:canvas.height/2} );

            playspace.initialize();
            playspace.bindCamera(player);
            playspace.bindParallax(player);

            populatePlayspace();

            playspace.addPlayer( playerFixture, playerSkin );
            stage.addChild(playspace.container);
            
            input.initialize(fireAction,notifyOnInput);
            Ticker.setFPS(FPS);
            Ticker.useRAF = true;
            Ticker.addListener(this);
		},
        debugClear: function() {
            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.restore();
        },
        drawDebug: function() {
            context.save();
            context.translate(-player.camera.x+canvas.width/2,-player.camera.y+canvas.height/2);
            physics.drawDebug();
            context.restore();
        },
		tick: function (elapsedTime) {
            //this.debugClear();
			input.advance();
			audio.advance();
			player.advance();
            playspace.advance();
			physics.advance();
            //this.drawDebug();
			stage.update();
		}
	}
}());
