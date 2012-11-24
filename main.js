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
        debugDraw: undefined,
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
			fixtureDef.friction = 0.5;
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
			this.debugDraw = new b2DebugDraw();
			this.debugDraw.SetSprite(context);
			this.debugDraw.SetDrawScale(PPM);
			this.debugDraw.SetFillAlpha(0.5);
			this.debugDraw.SetLineThickness(1.0);
			this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
			world.SetDebugDraw(this.debugDraw);
		},
        drawDebug: function() {
            world.DrawDebugData();
        }
	}
	
}());

var audio = (function () {
	"use strict";

	function newOscillator( id, frequency ) {
		var result = {
			id: id,
			frequency: frequency,
			envelope: audioContext.createGainNode(),
			oscillator : undefined,
			createOscillator : function() {
				this.oscillator = audioContext.createOscillator();
				this.oscillator.frequency.value = frequency;
				this.oscillator.connect(this.envelope);
			},
			initialize : function() {
				this.envelope.connect(audioContext.destination);
				this.createOscillator();
			},
			active : false,
			start : function() {
                if( this.oscillator.playbackState != this.oscillator.UNSCHEDULED_STATE ) {
                    return;
                }
                else {
                    var now = audioContext.currentTime;
                    this.envelope.gain.linearRampToValueAtTime(0, now);
                    this.envelope.gain.linearRampToValueAtTime(0.25, now+1/FPS);
                    this.envelope.gain.linearRampToValueAtTime(0, now+3/FPS);
                    this.oscillator.noteOn(now);
                    this.oscillator.noteOff(now+3/FPS);
                }
			},
			reset : function() {
				this.oscillator.disconnect();
				this.oscillator = undefined;
				this.createOscillator();
			},
			advance : function() {
				if (this.oscillator.playbackState === this.oscillator.FINISHED_STATE) {
					this.reset();
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
				alert('There is no AudioContext support in this browser, thus sound is disabled.');
                this.addSound = function() {};
                this.soundOn = function() {};
                this.advance = function() {};
			}
		},
		addSound: function( id, frequency ) {
			oscillators[id] = newOscillator(id, frequency);
		},
		soundOn: function (which) {
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

    var ActionNode = function(key, action) {
        this.action = action;
        this.looped = undefined;
        this.branch = {};
        this.get = function( key ) {
            return this.branch[key];
        }
        this.add = function( key, action ) {
            var newNode = new ActionNode(key, action);
            this.branch[key] = newNode;
            return newNode;
        }
        this.loop = function( node ) {
            this.looped = node;
        }
        this.seek = function( sequence ) {
            var branch = this.branch[ sequence.shift() ];
            return branch ? branch.seek(sequence) : this;
        }
    }

    var rootAction = new ActionNode();
    var thisAction = rootAction;

    rootAction.add(1, "FWD_STEP1").add(2, "FWD_STEP2").add(3, "FWD_STEP3");
    rootAction.seek([1,2,3]).add(1, "FWD_STEP1").add(2, "FWD_STEP2").add(3, "FWD_STEP3").add(1, "FWD_STEP1").add(2, "FWD_STEP2").add(3, "FORWARD");
    rootAction.add(3, "BWD_STEP1").add(2, "BWD_STEP2").add(1, "BWD_STEP3");
    rootAction.add(4, "STAND").add(4, "LAND");
    rootAction.seek([4]).add(3, "USE").loop( rootAction.seek([4]));

    var actionTime = {recovery:0,expiration:15};
    function notifyThenNext() {
        actionDelegate(thisAction.action, actionTime);
        return thisAction.looped ? thisAction.looped : thisAction;
    }

    var isInputOn = {};
	function inputOn(id) {
		if (isInputOn[id]) {
            return;
        }
        else {
            isInputOn[id] = true;
        }
        if (actionTime.recovery > 0) {
            return;
        }

        thisAction = thisAction.get(id);
        if(thisAction) {
            thisAction = notifyThenNext();
        }
        else {
            thisAction = rootAction.get(id);
            thisAction = thisAction ? notifyThenNext() : rootAction;
        }
	}

	function inputOff(id) {
		isInputOn[id] = false;
	}

	var keyMap = {76:1, 75:2, 74:3, 72:4, 32:5};

	function onKeyDown(keyCode) {
		var mapped = keyMap[keyCode];
		if (mapped) {
			inputOn(mapped);
			return false;
		}
        else {
            console.log("unmapped key down:", keyCode);
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
	return {
		initialize: function (onAction) {
			actionDelegate = onAction;
			document.onkeydown = handleKeyDown;
			document.onkeyup = handleKeyUp;
		},
		advance: function () {
            if( actionTime.recovery > 0) {
                actionTime.recovery--;
            }
            else if( actionTime.expiration > 0 ) {
                if( --actionTime.expiration === 0) {
                    actionDelegate("EXPIRED", actionTime);
                    thisAction = rootAction;
                }
            }
		}
	};
}());

var assets = (function() {
    var loadCount = 0;
    var spriteSheetDescriptions = [
        {
            name: "player",
            images: ["assets/chin.png"],
            frames: {count:8, width:150, height:150,regX:75,regY:110},
            animations: {
                stand:  {frames:[0], next:false, frequency:1},
                land:   {frames:[1], next:false, frequency:1},
                still:  {frames:[1], next:false, frequency:1 },
                step1:  {frames:[1,2,1], next:"still", frequency:3 },
                step2:  {frames:[3,4,3,2,1], next:"still", frequency:3 },
                step3:  {frames:[3,5,5,3,2], next:"still", frequency:1 },
                jump:   {frames:[4,5,5,5,3,2,1], next:false, frequency:2},
                use:    {frames:[6,7], next:"stand", frequency:5},
            }
        },
        {
            name: "building",
            images: ["assets/building.png"],
            frames: {count:4, width:110, height:380,regX:55,regY:190},
            animations: {
                a: {frames:[0], next:false, frequency:1},
                b: {frames:[1], next:false, frequency:1},
                c: {frames:[2], next:false, frequency:1},
                d: {frames:[3], next:false, frequency:1},
            }
        },
    ];

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
        updateCamera: function(translation) {
            this.container.x = translation.x;
            this.container.y = translation.y;
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

var camera = (function() {
    return {
        onCamera: function(x,y) { console.log("override onCamera"); },
        onParallax: function(d) { console.log("override onParallax"); },
        requiredTranslation: {x:0, y:0},
		initialize: function( target, stage ) {
            this.stage = stage;
            this.origin = {x:target.x, y:target.y};
            this.target = {x:target.x, y:target.y};
            this.setZoom(1.0);
            this.updateRequiredTranslation();
        },
        updateRequiredTranslation: function() {
            this.requiredTranslation.x = this.offset.x - this.target.x*PPM;
            this.requiredTranslation.y = this.offset.y - this.target.y*PPM;
            this.onCamera(this.requiredTranslation);
        },
        setZoom: function(factor) {
            this.zoomFactor = factor;
            this.stage.scaleX = factor;
            this.stage.scaleY = factor;
            this.offset = {x:this.stage.canvas.width/2/factor, y:this.stage.canvas.height/2/factor};
			physics.debugDraw.SetDrawScale(PPM*factor);
            //this.lookAt(this.target);

        },
        lookAt: function(point) {
            this.target.x = point.x;
            this.target.y = point.y;
            this.updateRequiredTranslation();
        }
    }

}());

var player = (function() {
    var zoomLevel = 1;
    var zoomDirection = 1;
	return {
		sprite: undefined,
        body: undefined,
        impulse: function(direction, rate, max) {
            var velocity = this.body().GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - rate, -max ) : b2Math.Min( -velocity + rate, max ); 
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
        jump: function(magnitude) {
            var velocity = this.body().GetLinearVelocity();
            velocity.y = -0.75*magnitude;
            this.body().SetLinearVelocity(velocity);
        },
		initialize: function( fixture, skin ) {
            this.fixture = fixture;
            this.body = function() { return fixture.GetBody(); }
            this.sprite = skin;
            this.sprite.gotoAndPlay("still");
		},
		advance: function() {
            var current = this.body().GetWorldCenter();
            var velocity = this.body().GetLinearVelocity().x+1;
            camera.lookAt( current );
		},
        actionStep: function(direction,mag) {
            this.impulse(direction, mag, mag);
        },
		actionForward: function() {
			this.impulse(-1, 2, 5);
            this.jump(1);
		},
		actionSuperforward: function() {
			this.impulse(-1, 2, 5);
            this.jump(1.5);
		},
		actionBackward: function() {
			this.impulse(1, 1, 5);
		},
		actionStand: function() {
		},
		actionBrake: function() {
            this.brake();
            console.log("brake!");
		},
	}
}());

var main = (function () {
	"use strict";

	function fireAction(action, actionTime) {
		switch(action) {
			case "FWD_STEP1": 
                actionTime.expiration = 15;
                audio.soundOn(1);
                player.actionStep(-1,1);
                player.sprite.gotoAndPlay("step1");
				break;
			case "FWD_STEP2": 
                actionTime.expiration = 15;
                audio.soundOn(2);
                player.actionStep(-1,1.2);
                player.sprite.gotoAndPlay("step2");
				break;
			case "FWD_STEP3": 
                actionTime.expiration = 15;
                audio.soundOn(3);
                player.actionStep(-1,1.5);
                player.sprite.gotoAndPlay("step3");
				break;
			case "BWD_STEP1": 
                actionTime.expiration = 15;
                audio.soundOn(3);
                player.actionStep(1,1);
                player.sprite.gotoAndPlay("step1");
				break;
			case "BWD_STEP2": 
                actionTime.expiration = 15;
                audio.soundOn(2);
                player.actionStep(1,1);
                player.sprite.gotoAndPlay("step2");
				break;
			case "BWD_STEP3": 
                actionTime.expiration = 15;
                audio.soundOn(1);
                player.actionStep(1,1);
                player.sprite.gotoAndPlay("step3");
				break;
            case "FORWARD":
                actionTime.expiration = 15;
                audio.soundOn(3);
                audio.soundOn(2);
                audio.soundOn(1);
                player.actionForward();
                player.sprite.gotoAndPlay("jump");
                break;
            case "STAND":
                actionTime.expiration = 15;
                audio.soundOn(4);
                player.sprite.gotoAndPlay("stand");
                break;
            case "LAND":
                actionTime.expiration = 15;
                player.sprite.gotoAndPlay("land");
                break;
            case "USE":
                actionTime.expiration = 0;
                console.log("use item");
                actionTime.recovery = 15;
                player.sprite.gotoAndPlay("use");
                break;
            case "EXPIRED":
                console.log("action time expired.");
                player.sprite.gotoAndPlay("land");
                break;
			default:
				console.log("action unhandled:",action);
				break;
		}
	}

    function initializeAudio() {
        audio.initialize();
        audio.addSound(1, 261.63); 
        audio.addSound(2, 329.63); 
        audio.addSound(3, 392.00); 
        audio.addSound(4, 400.00); 
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
            
        var floorBody = physics.createStaticBody(0,500,100000,10,255);
        var floorSkin = generateTestSprite(10000,10,colors[0],10);
        playspace.addStaticBody( floorBody, floorSkin, 255 );
        var buildingNames = ["a","b","c","d"]
        for( var count=0; count<100; count+=1 ) {
            var buildingBody = physics.createStaticBody(5000-count*125,300-380/2,110,380,2);
            var buildingSkin = assets.getAnimation("building").clone();
            buildingSkin.gotoAndPlay( buildingNames[Math.floor( Math.random() * 4 )] );
            playspace.addStaticBody( buildingBody, buildingSkin, 1000 );
        }
        for( var count=0; count<100; count+=1 ) {
            var buildingBody = physics.createStaticBody(5000-count*125,500-380/2,110,380,2);
            var buildingSkin = assets.getAnimation("building").clone();
            buildingSkin.gotoAndPlay( buildingNames[Math.floor( Math.random() * 4 )] );
            playspace.addStaticBody( buildingBody, buildingSkin, 3 );
        }
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
            player.initialize( playerFixture, playerSkin );

            playspace.initialize();
            playspace.bindCamera(camera);
            playspace.bindParallax(camera);

            populatePlayspace();

            playspace.addPlayer( playerFixture, playerSkin );
            stage.addChild(playspace.container);

            camera.initialize( player.body().GetWorldCenter(), stage );
            input.initialize(fireAction);
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
            context.translate(camera.requiredTranslation.x*camera.zoomFactor,camera.requiredTranslation.y*camera.zoomFactor);
            physics.drawDebug();
            context.restore();
        },
		tick: function (elapsedTime) {
            this.debugClear();
			input.advance();
			audio.advance();
			player.advance();
            playspace.advance();
			physics.advance();
			stage.update();
            //this.drawDebug();
		}
	}
}());
