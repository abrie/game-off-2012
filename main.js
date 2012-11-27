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

var DEBUG = false;
var FPS = 30;
var PPM = 150;

var manager = (function(){
    var objectives = [
        {title:"baby step", targetVelocity:0.2},
        {title:"little steps", targetVelocity:0.5},
        {title:"all three legs", targetVelocity:1.0},
        {title:"boing!", targetVelocity:1.3}
        ];
    var currentObjective = objectives[0];

    return {
        playerVelocity: 0,
        ballVelocity: 0,
        onObjectiveComplete: undefined,
        recordPlayerVelocity: function(velocity) {
            this.playerVelocity = Math.abs( velocity );
            hud.setPlayerVelocity( this.playerVelocity );
        },
        recordBallVelocity: function(velocity) {
            this.ballVelocity = Math.abs( velocity );
            hud.setBallVelocity( this.ballVelocity );
        },
        advance: function(playerVelocity, ballVelocity) {
            if( currentObjective.targetVelocity - this.ballVelocity <= 0 ) {
                this.onObjectiveComplete(currentObjective);
            }
        },
        setObjective: function(objectiveIndex) {
            currentObjective = objectives[objectiveIndex];
            hud.setTargetVelocity( currentObjective.targetVelocity );
        },
        initialize: function() {
        }
    }
}());

var hud = (function() {
    var context, gradient, textSprite, announceSprite,announceFrames;
    var normalize = function(value, range) {
        return Math.min( value/range, 1);
    }          
    var drawMeter = function(stroke, width, level) {
        context.strokeStyle=stroke;
        context.lineWidth=width;
        context.beginPath();
        context.arc(100,100,45,Math.PI-0.25,Math.PI-0.25+level*(Math.PI+0.5),false);
        context.stroke();
    };
    return {
        setTargetVelocity: function(velocity) {
            this.targetVelocity = Math.abs( velocity );
        },
        setPlayerVelocity: function(velocity) {
            this.playerVelocity = Math.abs( velocity );
            this.playerNormalizedVelocity = normalize( this.playerVelocity, this.targetVelocity);
        },
        setBallVelocity: function(velocity) {
            this.ballVelocity = Math.abs( velocity );
            this.ballNormalizedVelocity = normalize( this.ballVelocity, this.targetVelocity);
        },
        announce : function(message, seconds) {
            if( announceSprite ) {
                this.container.removeChild(announceSprite);
            }
            announceSprite = new createjs.Text(message,"bold 32px Arial", "#FFF");
            announceSprite.rX = announceSprite.getMeasuredWidth()/2;
            announceSprite.rY = announceSprite.getMeasuredHeight()/2;
            announceSprite.x = this.container.canvas.width/2;
            announceSprite.y = this.container.canvas.height/2;
            announceFrames = FPS*seconds;
            this.container.addChild(announceSprite);
        },
        update: function() {
            drawMeter( "#AAA", 30, 1 );
            drawMeter( gradient, 20, this.ballNormalizedVelocity );
            drawMeter( "#B7FA00", 10, this.playerNormalizedVelocity );
            textSprite.text = "b:"+this.ballVelocity.toFixed(1)+"p:"+this.playerVelocity.toFixed(1);
            if(announceFrames>0) {
                announceFrames--;
            }
            else {
                this.container.removeChild(announceSprite);
            }
            this.container.update();
        },
        initialize : function(canvas) {
            this.container = new Stage(canvas);
            context = canvas.getContext("2d");
            this.container.autoClear = false;
            gradient = context.createLinearGradient(0,100,100,100);
            gradient.addColorStop(0.5, '#B7FA00');
            gradient.addColorStop(1, '#FA9600');
            textSprite = new createjs.Text(0,"bold 16px Arial","#FFF");
            textSprite.x = 10;
            textSprite.y = 10;
            this.container.addChild(textSprite);
            this.announce("Push, Chinchilla!",10);
        }
    };
}());

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
        removeBody: function(body) {
            world.DestroyBody(body);
        },
		createPlayerFixture: function(x,y,width,height,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);
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
		createBallFixture: function(x,y,radius,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 10.0;
			fixtureDef.friction = 1.0;
			fixtureDef.restitution = 0.2;
            fixtureDef.filter.maskBits = mask;
			fixtureDef.shape = new b2CircleShape(radius/PPM);

			return body.CreateFixture(fixtureDef);
		},
		createMarkerFixture: function(x,y,width,height,mask) {
			var bodyDef = new b2BodyDef;
			bodyDef.type = b2Body.b2_dynamicBody;
            bodyDef.position.Set(x,y);
			var body = world.CreateBody(bodyDef);

			var fixtureDef = new b2FixtureDef;
			fixtureDef.density = 1.0;
			fixtureDef.friction = 0.5;
			fixtureDef.restitution = 1.0;
            fixtureDef.filter.maskBits = mask;
			fixtureDef.shape = new b2PolygonShape;
			fixtureDef.shape.SetAsBox( width/2, height/2 );

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
		setDebugDraw: function(canvas) {
            var context = canvas.getContext("2d");
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
                    this.envelope.gain.linearRampToValueAtTime(0.90, now+1/FPS);
                    this.envelope.gain.linearRampToValueAtTime(0, now+2/FPS);
                    this.oscillator.noteOn(now);
                    this.oscillator.noteOff(now+2/FPS);
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
		initialize: function () {
			document.onkeydown = handleKeyDown;
			document.onkeyup = handleKeyUp;
		},
        setActionDelegate: function (delegate) {
            actionDelegate = delegate;
        },
        reset: function() {
            actionTime.recovery = 0;
            actionTime.expiration = 0;
            thisAction = rootAction;
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
        {
            name: "ball",
            images: ["assets/ball.png"],
            frames: {count:2, width:50, height:50,regX:25,regY:25},
            animations: {
                ready: {frames:[0,1], next:"ready", frequency:2},
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
        ball: {body:undefined, skin:undefined, origin:undefined},
        layers: {},
        markers: [],
        container: new Container,
        initialize: function() {},
        addPlayer: function(entity) {
            this.player = entity;
            this.container.addChild(this.player.skin);
        },
        addBall: function(entity) {
            this.ball = entity;
            this.container.addChild(this.ball.skin);
        },
        addMarker: function(fixture, skin) {
            var entity = {frames:30,fixture:fixture, body:fixture.GetBody(), skin:skin};
            this.markers.push(entity);
            this.container.addChild(skin);
        },
        addStaticBody: function(body,skin,layerNumber) {
            var layer = this.getLayer(layerNumber);
            var origin = body.GetWorldCenter();
            layer.push( {body:body,skin:skin, origin:{x:origin.x, y:origin.y}} );
            this.container.addChild(skin);
        },
        addItem: function(item,skin,layerNumber) {
            var layer = this.getLayer(layerNumber);
            var body = item.GetBody();
            var origin = body.GetWorldCenter();
            layer.push( {body:body, skin:skin, origin:{x:origin.x, y:origin.y}});
            this.container.addChildAt(skin,0);
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
        updatePlayer: function() {
            this.player.skin.rotation = this.player.body.GetAngle() * (180 / Math.PI);
            this.player.skin.x = this.player.body.GetWorldCenter().x * PPM;
            this.player.skin.y = this.player.body.GetWorldCenter().y * PPM;
        },
        updateBall: function() {
            this.ball.skin.rotation = this.ball.body.GetAngle() * (180 / Math.PI);
            this.ball.skin.x = this.ball.body.GetWorldCenter().x * PPM;
            this.ball.skin.y = this.ball.body.GetWorldCenter().y * PPM;
        },
        advance: function() {
            this.updatePlayer();
            this.updateBall();
            _.each( this.layers, function(layer, key) {
                _.each( layer, function(piece) {
                    piece.skin.rotation = piece.body.GetAngle() * (180 / Math.PI);
                    piece.skin.x = piece.body.GetWorldCenter().x * PPM;
                    piece.skin.y = piece.body.GetWorldCenter().y * PPM;
                });
            }, this);
            // filter seems fairly inefficient here, garbage collection might present a problem
            this.markers = _.filter( this.markers, function(entity) {
                if( entity.frames-- === 0 ) {
                    this.container.removeChild(entity.skin);
                    physics.removeBody( entity.body );
                    return false;
                }
                var center = entity.body.GetWorldCenter();
                entity.skin.rotation = entity.body.GetAngle() * (180 / Math.PI);
                entity.skin.x = center.x * PPM;
                entity.skin.y = center.y * PPM;
                entity.skin.alpha -= 0.05;
                return true;
            },this);
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
        zoomFactorTarget: 1.0,
        subjectOfInterest: undefined,
        onCamera: function(x,y) { console.log("override onCamera"); },
        onParallax: function(d) { console.log("override onParallax"); },
        requiredTranslation: {x:0, y:0},
		initialize: function( stage ) {
            this.stage = stage;
            this.target = {x:0, y:0};
            this.setZoom(0.01);
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
            this.offset = {x:this.stage.canvas.width/2/factor, y:(this.stage.canvas.height/2+200)/factor};
			physics.debugDraw.SetDrawScale(PPM*factor);
            this.lookAt(this.target);

        },
        lookAt: function(point) {
            this.target.x = point.x;
            this.target.y = point.y;
            this.updateRequiredTranslation();
        },
        watch: function(entity) {
            this.entityOfInterest = entity;
        },
        advance: function() {
            if( this.zoomFactorTarget != this.zoomFactor ) {
                if( this.zoomFactorTarget > this.zoomFactor ) {
                    this.setZoom( Math.min(this.zoomFactor+0.01, this.zoomFactorTarget) );
                }
                else {
                    this.setZoom( Math.max(this.zoomFactor-0.01, this.zoomFactorTarget) );
                }
            }
            this.lookAt(this.entityOfInterest.body.GetWorldCenter());
        }
    }

}());

var ball = (function() {
    return {
        skin: undefined,
        body: undefined,
		initialize: function() {
            this.fixture = physics.createBallFixture(-1,1,25,1);
            this.body = this.fixture.GetBody();
            this.skin = assets.getAnimation("ball");
            this.skin.gotoAndPlay("ready");
		},
        reset: function() {
            var position = this.body.GetWorldCenter();
            position.x = -1;
            position.y = 1;
            this.body.SetPositionAndAngle(position,0);
            var velocity = this.body.GetLinearVelocity();
            velocity.x = 0;
            velocity.y = 0;
            this.body.SetLinearVelocity(velocity);
            this.body.SetAngularVelocity(0);
            this.skin.gotoAndPlay("ready");
        },
        advance: function() {
            manager.recordBallVelocity( this.body.GetLinearVelocity().x );
        }
    }
    
}());

var player = (function() {
	return {
		skin: undefined,
        body: undefined,
        impulse: function(direction, rate, max) {
            var velocity = this.body.GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - rate, -max ) : b2Math.Min( -velocity + rate, max ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body.GetMass() * velChange;
            this.body.ApplyImpulse( new b2Vec2(impel,0), this.body.GetWorldCenter() );
        },
        brake: function(direction) {
            var velocity = this.body.GetLinearVelocity().x;
            var targetVelocity = direction < 0 ?
                b2Math.Max( velocity - 0.5, 0 ) : b2Math.Min( velocity + 0.5, 0 ); 
            var velChange = targetVelocity - velocity;
            var impel = this.body.GetMass() * velChange;
            this.body.ApplyImpulse( new b2Vec2(impel,0), this.body.GetWorldCenter() );
        },
        jump: function(magnitude) {
            var velocity = this.body.GetLinearVelocity();
            velocity.y = -0.75*magnitude;
            this.body.SetLinearVelocity(velocity);
        },
		initialize: function() {
            this.fixture = physics.createPlayerFixture(0,0,75,75,1);
            this.body = this.fixture.GetBody();
            this.skin = assets.getAnimation("player");
            this.skin.gotoAndPlay("still");
		},
        reset: function() {
            var position = this.body.GetWorldCenter();
            position.x = 0;
            position.y = 0;
            this.body.SetPositionAndAngle(position,0);
            var velocity = this.body.GetLinearVelocity();
            velocity.x = 0;
            velocity.y = 0;
            this.body.SetLinearVelocity(velocity);
            this.body.SetAngularVelocity(0);
            this.skin.gotoAndPlay("still");
        },
		advance: function() {
            manager.recordPlayerVelocity( this.body.GetLinearVelocity().x );
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

var trails = (function (){
    return {
        addMessage: function(body,message) {
            var bodyCenter = body.GetWorldCenter();
            var fixture = physics.createMarkerFixture( bodyCenter.x, bodyCenter.y, 0.5, 0.5, 0 );
            fixture.GetBody().ApplyImpulse( new b2Vec2(0.5,-0.5), bodyCenter );
            var sprite = new createjs.Text(0,"bold 32px Arial","#FFF");
            sprite.text = message;
            playspace.addMarker(fixture, sprite);
        }
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
                player.skin.gotoAndPlay("step1");
                trails.addMessage(player.body, ".");
				break;
			case "FWD_STEP2": 
                actionTime.expiration = 15;
                audio.soundOn(2);
                player.actionStep(-1,1.2);
                player.skin.gotoAndPlay("step2");
                trails.addMessage(player.body, ".");
				break;
			case "FWD_STEP3": 
                actionTime.expiration = 15;
                audio.soundOn(3);
                player.actionStep(-1,1.5);
                player.skin.gotoAndPlay("step3");
                trails.addMessage(player.body, ".");
				break;
			case "BWD_STEP1": 
                actionTime.expiration = 15;
                audio.soundOn(3);
                player.actionStep(1,1);
                player.skin.gotoAndPlay("step1");
				break;
			case "BWD_STEP2": 
                actionTime.expiration = 15;
                audio.soundOn(2);
                player.actionStep(1,1);
                player.skin.gotoAndPlay("step2");
				break;
			case "BWD_STEP3": 
                actionTime.expiration = 15;
                audio.soundOn(1);
                player.actionStep(1,1);
                player.skin.gotoAndPlay("step3");
				break;
            case "FORWARD":
                actionTime.expiration = 15;
                audio.soundOn(3);
                audio.soundOn(2);
                audio.soundOn(1);
                player.actionForward();
                player.skin.gotoAndPlay("jump");
                trails.addMessage(player.body, "boing!");
                break;
            case "STAND":
                actionTime.expiration = 15;
                audio.soundOn(4);
                player.skin.gotoAndPlay("stand");
                break;
            case "LAND":
                actionTime.expiration = 15;
                player.skin.gotoAndPlay("land");
                break;
            case "USE":
                actionTime.expiration = 0;
                console.log("use item");
                actionTime.recovery = 15;
                player.skin.gotoAndPlay("use");
                break;
            case "EXPIRED":
                player.skin.gotoAndPlay("land");
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

    function generateFloorSprite(width,height, fill,depth) {
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
        var floorSkin = generateFloorSprite(10000,10,colors[0],10);
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

    var handleObjectiveComplete = function(objective) {
        hud.announce(objective.title,10);
        input.reset();
        ball.reset();
        player.reset();
    };

	return {
        preload: function() {
            assets.onReady = this.start.bind(this);
            assets.initialize();
        },
		start: function () {
            manager.initialize();
            manager.onObjectiveComplete = handleObjectiveComplete;
            initializeAudio();
            initializeCanvas();
            input.initialize();
            physics.initialize();
            physics.setDebugDraw(canvas);
            camera.initialize(stage);

            playspace.initialize();
            populatePlayspace();
            playspace.bindCamera(camera);
            playspace.bindParallax(camera);

            player.initialize();
            playspace.addPlayer( player );
            camera.watch( player );

            ball.initialize();
            playspace.addBall( ball );

            stage.addChild(playspace.container);

            hud.initialize(canvas);

            Ticker.setFPS(FPS);
            Ticker.useRAF = true;
            Ticker.addListener(this);
            input.setActionDelegate(fireAction);
            manager.setObjective(0);
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
        debugUpdate: function(elapsedTime) {
            this.debugClear();
            this.update(elapsedTime);
            this.drawDebug();
        },
        update: function(elapsedTime) {
			audio.advance();
			input.advance();
			physics.advance();
			player.advance();
            ball.advance();
            camera.advance();
            playspace.advance();
            manager.advance();
			stage.update();
            hud.update();
        },
		tick: function (elapsedTime) {
            if(DEBUG) {
                this.debugUpdate();
            }
            else {
                this.update(elapsedTime);
            }
        }
	};
}());
