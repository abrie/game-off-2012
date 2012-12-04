var FASTSTART = false;
var DEBUG = false;
var FPS = 30;
var PPM = 150;
var DEFAULT_FIRST_OBJECTIVE = 0;

var Objective = function(params, encodeActions) {
    "use strict";
    this.title = "untitled";
    this.praise = "";
    this.lesson = "";
    this.finishLine = 10;
    this.startingLine = 0;
    this.targetVelocity = 0;
    this.initialVelocity = 0;
    this.initialRestitution = 0;
    this.article = false;
    this.isInitiated = false;
    this.isConcluded = false;
    this.hasBeenAttempted = false;

    for(var paramName in params) {
        this[paramName] = params[paramName];
    }

    this.encodeActions = encodeActions;

    this.isSuccess = function(measuredVelocity) {
        return this.targetVelocity - Math.abs(measuredVelocity) <= 0; 
    }

    this.isFailure = function(ball, player) {
        var overTaken = player < ball;
        var boundsOut = this.finishLine <= Math.abs(ball);
        return overTaken || boundsOut;
    }
}

var Objectives = [
    new Objective({
            title:"The One Foot Race",
            trophy:"the ugly stick",
            praise:"", 
            lesson:"The first step is learning how to step. Press L repeatedly and learn to use a leg.",
            targetVelocity:0.20,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) {
        root.clear();
        root.add(1, "FWD_STEP1");
        root.add(4, "STAND")
            .add(4, "LAND");
    }),
    new Objective({
            title:"Two Left Feet",
            trophy:"a featureless twig",
            praise:"",
            lesson:"The velocitometer's red mark is the speed the ball must go. Press L, then K, then L, then K..",
            targetVelocity:0.30,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) {
        root.seek([1])
            .add(2, "FWD_STEP2");
    }),
    new Objective({
            title:"All Three Legs",
            trophy:"a spring of basil",
            praise:"",
            lesson:"The needle rises higher as the ball goes faster. Push with 3 legs like this: L, K, J... ",
            startingLine:1,
            targetVelocity:0.50,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) {
        root.seek([1,2])
            .add(3, "FWD_STEP3", {expiration:30, recovery:0});
    }),
    new Objective({
            title:"Velocities and Gauges",
            trophy:"an apple branch",
            praise:"There is push in your ancestory.",
            lesson:"Timing is important, step as fast as possible but not too fast.",
            startingLine:1,
            targetVelocity:0.50,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) { // no new actions
    }),
    new Objective({
            title:"Use The Boing",
            trophy:"a pear branch",
            praise:"You are ready to learn a combo.",
            lesson:"(L,K,J)x3 will give you 1 BOING",
            startingLine:1.5,
            targetVelocity:1.0,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) {
        root.seek([1,2,3])
            .add(1, "FWD_STEP1")
            .add(2, "FWD_STEP2")
            .add(3, "FWD_STEP3")
            .add(1, "FWD_STEP1")
            .add(2, "FWD_STEP2")
            .add(3, "FORWARD", {expiration:30, recovery:5});
    }),
    new Objective({
            title:"Reversing is Useless?",
            trophy:"a branch from blueberry bush",
            praise:"Excellent, but can you move backwards?",
            lesson:"(J,K,L) goes the other way.",
            article: "cape",
            startingLine:1.5,
            targetVelocity:1.2,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) {
        root.add(3, "BWD_STEP1")
            .add(2, "BWD_STEP2")
            .add(1, "BWD_STEP3");
        root.seek([4])
            .add(3, "USE")
            .loop( root.seek([4]));
    }),
    new Objective({
            title:"haz a cape",
            trophy:"a pomegranate branch",
            praise:"Very stylish, little tripod.",
            lesson:"(L,K,J)x3 followed by (J) will give OOMPH to a BOING",
            startingLine:1.5,
            targetVelocity:1.3,
            initialVelocity:0,
            initialRestitution:0
        },
        function(root) {
        root.seek([1,2,3,1,2,3,1,2,3])
            .add(3, "FLIGHT", {expiration:25, recovery:5});
    }),
    new Objective({
            title:"want of wings",
            trophy:"a cedar branch",
            praise:"You must use your fashion.",
            lesson:"(L,K,J)x3 then (J)x2 gives a CAPE DASH",
            targetVelocity:1.5,
            initialVelocity:-0.25,
            initialRestitution:0
        },
        function(root) {
        root.seek([1,2,3,1,2,3,1,2,3,3])
            .add(3, "DASH", {expiration:5, recovery:5});
    }),
    new Objective({
            title:"tough getting going",
            trophy:"a spruce branch",
            praise:"",
            lesson:"You are a natural, and challenges continue to grow.",
            targetVelocity:1.6,
            initialVelocity:-0.55,
            initialRestitution:0
        },
        function(root) { // no new actions
    }),
    new Objective({
            title:"tough getting rough",
            trophy:"a willow whip",
            article:"tailfin",
            praise:"Outstanding.",
            lesson:"There is more to learn, maybe?",
            startingLine:1.3,
            targetVelocity:1.8,
            initialVelocity:-0.7,
            initialRestitution:0
        },
        function(root) { // no new actions
    }),
    new Objective({
            title:"take a step back",
            trophy:"a piece of yew",
            praise:"Outstanding.",
            lesson:"Use your legs like a spring, (J,K,L) x X then K for a good start.",
            startingLine:3.3,
            finishLine:20,
            targetVelocity:2.2,
            initialVelocity:-0.7,
            initialRestitution:0
        },
        function(root) {
        root.seek([3,2,1])
            .add(3, "BWD_STEP1")
            .add(2, "BWD_STEP2")
            .add(1, "BWD_STEP3")
            .add(2, "LAUNCH2");
        root.seek([3,2,1,3,2,1])
            .add(3, "BWD_STEP1")
            .add(2, "BWD_STEP2")
            .add(1, "BWD_STEP3")
            .add(2, "LAUNCH3");
        root.seek([3,2,1,3,2,1,3,2,1])
            .add(3, "BWD_STEP1")
            .add(2, "BWD_STEP2")
            .add(1, "BWD_STEP3")
            .add(2, "LAUNCH4");
    })
];

var manager = (function() {
	"use strict";

    var current = undefined;

    return {
        onInitiateObjective: undefined,
        onCompleteObjective: undefined,
        onRestartObjective: undefined,
        advance: function() {
            if( !current ) {
                return;
            }
            if( !current.isInitiated ) {
                this.onInitiateObjective(current);
                current.isInitiated = true;
                return;
            }
            if( current.isConcluded ) {
                return;
            }
            if( this.ball.isInPlay && current.isSuccess( this.ball.getLinearVelocity().x ) ) {
                this.concludeObjective(current);
                this.onPassedObjective(current);
                current.hasBeenAttempted = true;
                return;
            }           
            if( this.ball.isInPlay && current.isFailure( this.ball.getPosition().x, this.player.getPosition().x ) ) {
                this.concludeObjective(current);
                this.onFailedObjective(current);
                current.hasBeenAttempted = true;
                return;
            }
            if( this.induceComplete ) {
                this.concludeObjective(current);
                this.nextObjective(current);
                return;
            }           
            if( this.induceRestart ) {
                this.concludeObjective(current);
                this.setObjective(current);
                return;
            }
            if( this.induceRollback ) {
                this.onConcludeObjective(current);
                this.previousObjective(current);
                return;
            }
        },
        setPlayer: function(player) {
            this.player = player;
        },
        setBall: function(ball) {
            this.ball = ball;
        },
        gameOver: function() {
            this.onAllObjectivesComplete();
        },
        concludeObjective: function(objective) {
            objective.isConcluded = true;
            this.onConcludeObjective(objective);
        },
        restartObjective: function() {
            this.induceRestart = true;
        },
        completeObjective: function() {
            this.induceComplete = true;
        },
        rollbackObjective: function() {
            this.induceRollback = true;
        },
        firstObjective: function() {
            this.setObjective( Objectives[DEFAULT_FIRST_OBJECTIVE] );
        },
        previousObjective: function( objective ) {
            var previous = Objectives[ Objectives.indexOf(objective)-1 ];
            previous ? this.setObjective(previous) : console.log("no more objectives");
        },
        nextObjective: function( objective ) {
            var next = Objectives[ Objectives.indexOf(objective)+1 ];
            next ? this.setObjective(next) : this.gameOver();
        },
        setObjective: function(newObjective) {
            current = newObjective;
            current.isInitiated = false;
            current.isConcluded = false;
            this.induceRestart = false;
            this.induceComplete = false;
            this.induceRollback = false;
        },
        initialize: function() {
        }
    }
}());

var Teacher = function(stage) {
    var stage = stage;
    var container = undefined;
    var onComplete = undefined;
    var masterChin = undefined;
    var text = undefined;
    var continueText = undefined;
    var isTeaching = false;
    var lessonTime = 5 * FPS;
    var paneHeight = 300;
    var paneWidth = stage.canvas.width;

    var initialize = (function() {
        container = new createjs.Container;
        container.regX = 0;
        container.regY = 0;
        container.x = 0;
        container.y = stage.canvas.height;
        masterChin = assets.getAnimation("masterchin");
        masterChin.regX = 300;
        masterChin.x = stage.canvas.width;
        container.addChild(masterChin);
        text = new createjs.Text("nothing to teach","bold 15px Arial","#FFF");
        text.x = 0;
        text.y = 225;
        container.addChild(text);
        continueText = new createjs.Text("Practice, little chin. Press spacebar when ready for the ball.", "12px Arial", "#FFF");
        continueText.skewX = 13;
        continueText.regX = continueText.getMeasuredWidth();
        continueText.regY = continueText.getMeasuredHeight()/2;
        continueText.x = paneWidth-300;
        continueText.y = paneHeight - continueText.getMeasuredHeight() - 10;
        container.addChild(continueText);
        stage.addChild(container);
    }());

    var alphaTable = [0.85,0.90,0.50,0.77,0.95];
    return {
        open: function(message, whenComplete) {
            container.x = 0;
            container.y = stage.canvas.height;
            onComplete = whenComplete;
            masterChin.gotoAndPlay("up");
            text.text = message;
            text.x = paneWidth-300 - text.getMeasuredWidth();
            text.y = 225;
            isTeaching = true;
            lessonTime = 5 * FPS;
        },
        close: function() {
            if( onComplete ) {
                onComplete();
            }
            isTeaching = false;
        },
        toggle: function() {
            if( isTeaching ) {
                masterChin.gotoAndPlay("down");
                this.close();
            }
        },
        advance: function() {
            if(isTeaching) {
                if( container.y >  stage.canvas.height-paneHeight ) {
                    container.y -= 5;
                }
                var index = Math.floor( Math.random()* 5 );
                masterChin.alpha = alphaTable[index];
            } else if( container.y < stage.canvas.height ) {
                    container.y += 5;
              }
              else {
                  masterChin.stop();
              }
        },
    }
};

var Announcements = function(container) {
    var Announcement = function(message, frames, whenDone) {
        var count = 0;
        var sprite = new createjs.Text(message,"bold 64px Arial", "#FFF");
        sprite.regX = sprite.getMeasuredWidth()/2;
        sprite.regY = sprite.getMeasuredHeight()/2;
        sprite.x = container.canvas.width/2;
        sprite.y = container.canvas.height/2 - sprite.getMeasuredHeight();
        
        return {
            whenDone: whenDone,
            frames: frames,
            initialize: function() {
                return this;
            },
            show: function() {
                container.addChild(sprite);
                return this;
            },
            remove: function() {
                if( this.whenDone ) {
                    this.whenDone();
                }
                container.removeChild(sprite);
            },
            advance: function() {
                if( count == this.frames ) {
                    this.remove();
                    return false;
                }
                else {
                    if(++count > this.frames - this.frames/4) {
                        sprite.alpha -= 0.025;
                    }
                    return true;
                }
            }
        }
    }

    var list = [];
    return {
        add: function(message, seconds, whenDone) {
            var announcement = new Announcement(message, seconds*FPS, whenDone)
            list.push( announcement.show() );
        },
        update: function() {
            list.forEach( function(announcement, index, array) {
                if(!announcement.advance()) {
                    array.splice(index,1);
                }
            });
        }
    };
};

var hud = (function() {
	"use strict";

    var normalize = function(value, range) {
        return Math.min( value/range, 1);
    }          

    var meter = {x:80,y:80};
    var drawMeter = function(radius, stroke, width, level) {
        context.strokeStyle=stroke;
        context.lineWidth=width;
        context.beginPath();
        context.arc(meter.x,meter.y,radius,Math.PI-0.25,Math.PI-0.25+level*(Math.PI+0.5),false);
        context.stroke();
    };

    var drawNeedle = function(radius, stroke, width, level) {
        context.save();
        context.translate(meter.x,meter.y);
        context.rotate(Math.PI-0.25+level*(Math.PI+0.5));
        context.strokeStyle=stroke;
        context.lineWidth=width;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(radius, 0);
        context.stroke();
        context.restore();
    };

    var labelText = undefined;
    var initializeLabelText = function() {
        labelText = new createjs.Text("velocitometer", "bold 16px Arial","#AAA");
        labelText.regX = labelText.getMeasuredWidth()/2;
        labelText.regY = labelText.getMeasuredHeight()/2;
        labelText.x = meter.x;
        labelText.y = meter.y+25;
        labelText.skewX = 10;
        stage.addChild(labelText);
    }

    var gradient = undefined;
    var initializeGradients = function() {
        gradient = context.createLinearGradient(0,100,100,100);
        gradient.addColorStop(0.5, '#B7FA00');
        gradient.addColorStop(1, '#FA9600');
    }

    var menu = undefined;
    var toggleMenu = function() {
        if(!menu) {
            menu = new createjs.Container;
            menu.regX = stage.canvas.width/2;
            menu.regY = stage.canvas.height/2;
            menu.x = stage.canvas.width/2, menu.y = stage.canvas.height/2;

            var items = [
                {
                    title: "previous objective",
                    action: function() { manager.rollbackObjective(); } 
                },
                {
                    title: "next objective",
                    action: function() { manager.completeObjective(); } 
                },
                {
                    title: "restart objective",
                    action: function() { manager.restartObjective(); }
                },
            ];

            items.forEach( function(item, index) {
                var text = new createjs.Text(item.title,"bold 16px Arial","#F00");
                text.regX = text.getMeasuredWidth()/2;
                text.regY = text.getMeasuredHeight()/2;
                text.x = stage.canvas.width/2;
                text.y = stage.canvas.height/2 + index*text.getMeasuredHeight();
                text.onClick = item.action;
                menu.addChild(text);
            });

            stage.addChild(menu);
        }
        else {
            stage.removeChild(menu);
            menu = undefined;
        }
    }

    var stage = undefined;
    var announcements = undefined;
    var teacher = undefined;
    var context = undefined;
    return {
        maximumVelocity: 5.0,
        setTargetVelocity: function(velocity) {
            this.targetVelocity = Math.abs( velocity );
        },
        setPlayer: function(entity) {
            this.player = entity;
        },
        setBall: function(entity) {
            this.ball = entity;
        },
        announce: function(message, seconds, whenDone) {
            announcements.add(message, seconds, whenDone);
        },
        toggleMenu: function() {
            toggleMenu();
        },
        toggleTeacher: function() {
            teacher.toggle();
        },
        flashTeachInput: function(index) {
            teachImages[index-1].text.alpha = 1.0;
        },
        showTeacher: function(message, onComplete) {
            teacher.open( message, onComplete );
        },
        hideTeacher: function() {
            teacher.close();
        },
        update: function() {
            var ballVelocity = Math.abs(this.ball.getLinearVelocity().x); 
            var normalizedBallVelocity = normalize( ballVelocity, this.maximumVelocity);
            var playerVelocity = Math.abs(this.player.getLinearVelocity().x); 
            var normalizedPlayerVelocity = normalize( playerVelocity, this.maximumVelocity);
            var normalizedTargetVelocity = normalize( this.targetVelocity, this.maximumVelocity);

            drawMeter( 40, "#555", 30, 1 );
            drawMeter( 30, gradient, 10, normalizedBallVelocity );
            drawMeter( 40, "#B7FA00", 10, normalizedPlayerVelocity );
            drawMeter( 50, "#F00", 10, normalizedTargetVelocity+0.025);
            drawMeter( 50, "#FFF", 10, normalizedTargetVelocity );
            drawNeedle( 60, "#FFF", 3, normalizedBallVelocity );

            var playerPosition = this.player.getPosition();
            var ballPosition = this.ball.getPosition();
            /*
            labelText.text = "bv:"+ballVelocity.toFixed(3)+
                             "pv:"+playerVelocity.toFixed(3)+
                             "p:("+playerPosition.x.toFixed(3)+",
                             "+playerPosition.y.toFixed(3)+")");
            */
            announcements.update();
            teacher.advance();
            stage.update();
        },
        initialize : function(canvas) {
            stage = new createjs.Stage(canvas);
            stage.autoClear = false;
            announcements = new Announcements(stage);
            teacher = new Teacher(stage);
            context = canvas.getContext("2d");
            initializeGradients();
            initializeLabelText();
        }
    };
}());

/*************************************************************/
var b2Vec2 = Box2D.Common.Math.b2Vec2                        //
,   b2AABB = Box2D.Collision.b2AABB                          //
,   b2ContactListener = Box2D.Dynamics.b2ContactListener     //
,	b2BodyDef = Box2D.Dynamics.b2BodyDef                     //
,	b2Body = Box2D.Dynamics.b2Body                           //
,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef               //
,	b2Fixture = Box2D.Dynamics.b2Fixture                     //
,	b2World = Box2D.Dynamics.b2World                         //
,	b2MassData = Box2D.Collision.Shapes.b2MassData           //
,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape   //
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape     //
,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw                 //
,   b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef //
,	b2Math = Box2D.Common.Math.b2Math                        //
;                                                            //
;/*************************************************************/

var physics = (function() {
	"use strict";
	var world = undefined;

    // world.CreateBody() fails if made in a contact callback 
    // function, thus contact events are queued and processed
    // here. More research required when time permits it.....
    var contactEventQueue = (function(){
        var beginContactEvents = [];
        var dequeueBeginContactEvents = function() {
            var count = beginContactEvents.length;
            for( var index = 0; index < count; index+=2 ) {
                var a = beginContactEvents.shift();
                var b = beginContactEvents.shift();
                a.handleBeginContact(b);
                b.handleBeginContact(a);
            }
        }

        var endContactEvents = [];
        var dequeueEndContactEvents = function() {
            var count = endContactEvents.length;
            for( var index = 0; index < count; index+=2 ) {
                var a = endContactEvents.shift();
                var b = endContactEvents.shift();
                a.handleEndContact(b);
                b.handleEndContact(a);
            }
        }

        var dequeueContactEvents = function() {
            dequeueBeginContactEvents();
            dequeueEndContactEvents();
        }

        var enqueueBeginContact = function(contact) {
            var a = contact.GetFixtureA().GetBody().GetUserData();
            var b = contact.GetFixtureB().GetBody().GetUserData();
            if( a != undefined && b != undefined ) {
                beginContactEvents.push(a);
                beginContactEvents.push(b);
            }
        }

        var enqueueEndContact = function(contact) {
            var a = contact.GetFixtureA().GetBody().GetUserData();
            var b = contact.GetFixtureB().GetBody().GetUserData();
            if( a != undefined && b != undefined ) {
                endContactEvents.push(a);
                endContactEvents.push(b);
            }
        }

        var listener = new b2ContactListener;
        listener.BeginContact = enqueueBeginContact;
        listener.EndContact = enqueueEndContact;

        return {
            listener: listener,
            onBeginContact: enqueueBeginContact,
            onEndContact: enqueueEndContact,
            dequeue: dequeueContactEvents,
        }

    }());

	return {
		advance: function() {
			world.ClearForces();
			world.Step(1 / FPS, 10, 10);
            contactEventQueue.dequeue();
		},
		initialize: function() {

			world = new b2World( new b2Vec2(0, 10),  true );
            world.SetContactListener(contactEventQueue.listener);
		},
        destroyBody: function(body) {
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
			fixtureDef.shape = new b2CircleShape(radius);

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
    var Oscillator = function(audioContext, destination) {
        var context = audioContext;
        var envelope = context.createGainNode();
        envelope.connect( destination );
        var oscillator = context.createOscillator();
        oscillator.connect( envelope );

        return {
            play: function(frequency) {
                var now = context.currentTime;
                envelope.gain.value = 0.05;
                envelope.gain.linearRampToValueAtTime(0.3, now+0.5/FPS);
                envelope.gain.linearRampToValueAtTime(0, now+1.5/FPS);
                oscillator.frequency.value = frequency;
                oscillator.noteOn(now);
                oscillator.noteOff(now+1.6/FPS);
            },
            isDead: function() {
                return oscillator.playbackState === oscillator.FINISHED_STATE;
            }
        }
    }

	var oscillators = [];
	var audioContext = undefined;
    var masterGain = undefined;
    var frequency = {};
    frequency[1]= 261.63; 
    frequency[2]= 329.63; 
    frequency[3]= 392.00; 
    frequency[4]= 440.00; 
    frequency[5]= 349.23; 
    frequency[6]= 223.08

	return {
		initialize: function() {
			try {
				audioContext = new (window.AudioContext || window.webkitAudioContext);
			} catch (e) {
				alert('To me there appears to be no AudioContext support in this browser, thus sound is sadly disabled.');
                this.addSound = function() {};
                this.soundOn = function() {};
                this.advance = function() {};
                return;
			}
            masterGain = audioContext.createGainNode();
            masterGain.connect( audioContext.destination );
            masterGain.gain.value = 2.5;
		},
		soundOn: function (which) {
            var newOscillator = new Oscillator( audioContext, masterGain );
            oscillators.push( newOscillator );
            newOscillator.play( frequency[which] );
		},
		advance: function () {
            oscillators.forEach( function(oscillator, index, array) {
                if( oscillator.isDead() ) {
                    array.splice(index,1);
                }
            });
		}
	}
}());

var menuInput = (function () {
	"use strict";

	function inputOn(id) {
        if (!isEnabled) {
            return;
        }

        switch(id) {
            case 1: actionDelegate("TOGGLE");
                    break;
            case 2: actionDelegate("LESSON");
                    break;
        }
	}

	function inputOff(id) {
        // nothing here except a comment.
	}

    var isEnabled = false;
	var actionDelegate = undefined;
	return {
		initialize: function () {
            this.reset();
            isEnabled = false;
		},
        setActionDelegate: function (delegate) {
            actionDelegate = delegate;
        },
        enable: function() {
            isEnabled = true;
            this.reset();
        },
        disable: function() {
            isEnabled = false;
        },
        reset: function() {
        },
        inputOn: function(input) {
            inputOn(input);
        },
        inputOff: function(input) {
            inputOff(input);
        },
		advance: function () {
		}
	};
}());

var playInput = (function () {
	"use strict";

    var ActionNode = function(key, action, timing) {
        this.action = action;
        this.timing = timing ? timing : {expiration:15, recovery:0};
        this.looped = undefined;
        this.branch = {};
        this.clear = function() {
            this.looped = false;
            this.branch = {};
        }
        this.getTiming = function(into) {
            into.expiration = this.timing.expiration;
            into.recovery = this.timing.recovery;
            return into;
        }
        this.get = function( key ) {
            return this.branch[key];
        }
        this.add = function( key, action, timing ) {
            var newNode = new ActionNode(key, action, timing);
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
    var actionTime = rootAction.getTiming({});

    function notifyThenNext() {
        thisAction.getTiming(actionTime);
        actionDelegate(thisAction.action);
        return thisAction.looped ? thisAction.looped : thisAction;
    }

	function inputOn(id) {
        if (!isEnabled) {
            return;
        }

        if (actionTime.recovery > 0) {
            return;
        }

        thisAction = thisAction.get(id);
        if (thisAction) {
            thisAction = notifyThenNext();
        }
        else {
            thisAction = rootAction.get(id);
            thisAction = thisAction ? notifyThenNext() : rootAction;
        }
	}

	function inputOff(id) {
        // nothing here except a comment.
	}

    var isEnabled = false;
	var actionDelegate = undefined;
	return {
		initialize: function () {
            this.reset();
            isEnabled = false;
		},
        getRootAction: function() {
            return rootAction;
        },
        setActionDelegate: function (delegate) {
            actionDelegate = delegate;
        },
        enable: function() {
            isEnabled = true;
            this.reset();
        },
        disable: function() {
            isEnabled = false;
        },
        reset: function() {
            thisAction = rootAction;
            thisAction.getTiming(actionTime);
        },
        inputOn: function(input) {
            inputOn(input);
        },
        inputOff: function(input) {
            inputOff(input);
        },
		advance: function () {
            if( actionTime.recovery > 0) {
                if( --actionTime.recovery === 0) {
                    actionDelegate("RECOVERED");
                }
            }
            else {
                if( actionTime.expiration > 0 ) {
                    if( --actionTime.expiration === 0) {
                        actionDelegate("EXPIRED");
                        thisAction = rootAction;
                        thisAction.getTiming(actionTime);
                    }
                }
            }
		}
	};
}());

var input = (function () {
	"use strict";

    var isInputOn = {};
	function inputOn(id, destination) {
		if (isInputOn[id] ) {
            return;
        }

        isInputOn[id] = true;
        destination.inputOn(id);
	}

	function inputOff(id, destination) {
        if( isInputOn[id] ) {
            destination.inputOff(id);
        }
        isInputOn[id] = false;
	}

    var menuKey = {27:1, 32:2};
	var playKey = {76:1, 75:2, 74:3, 72:4};
	function onKeyDown(keyCode) {
        if(menuKey[keyCode]) {
            inputOn(menuKey[keyCode], menuInput);
            return false;
        }

		if(playKey[keyCode]) {
            inputOn(playKey[keyCode], playInput);
            return false;
        }

        console.log("unmapped key down:", keyCode);
	}

	function onKeyUp(keyCode) {
        if(menuKey[keyCode]) {
            inputOff(menuKey[keyCode], menuInput);
            return false;
        }

		if(playKey[keyCode]) {
            inputOff(playKey[keyCode], playInput);
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
    
	return {
		initialize: function () {
            playInput.initialize();
            menuInput.initialize();
			document.onkeydown = handleKeyDown;
			document.onkeyup = handleKeyUp;
		},
		advance: function () {
            playInput.advance();
            menuInput.advance();
		}
	};
}());

var assets = (function() {
    var loadCount = 0;
    var spriteSheetDescriptions = [
        {
            name: "player",
            images: ["assets/chin.png"],
            frames: {count:9, width:150, height:150},
            animations: {
                stand:  {frames:[0], next:false, frequency:1},
                land:   {frames:[1], next:false, frequency:1},
                still:  {frames:[1], next:false, frequency:1 },
                step1:  {frames:[1,2,1], next:"still", frequency:3 },
                step2:  {frames:[3,4,3,2,1], next:"still", frequency:3 },
                step3:  {frames:[3,5,5,3,2], next:"still", frequency:1 },
                jump:   {frames:[4,5,5,5,3,2,1], next:false, frequency:2},
                fly:    {frames:[6,6,6,5,4], next:"still", frequency:2},
                use:    {frames:[7,8], next:"stand", frequency:5},
            }
        },
        {
            name: "cape",
            images: ["assets/cape.png"],
            frames: {count:9, width:150, height:150},
            animations: {
                stand:  {frames:[0], next:false, frequency:1},
                land:   {frames:[1], next:false, frequency:1},
                still:  {frames:[1], next:false, frequency:1 },
                step1:  {frames:[1,2,1], next:"still", frequency:3 },
                step2:  {frames:[3,4,3,2,1], next:"still", frequency:3 },
                step3:  {frames:[3,5,5,3,2], next:"still", frequency:1 },
                jump:   {frames:[4,5,5,5,3,2,1], next:false, frequency:2},
                fly:    {frames:[6,6,6,5,4], next:"still", frequency:2},
                use:    {frames:[7,8], next:"stand", frequency:5},
            }
        },
        {
            name: "tailfin",
            images: ["assets/tailfin.png"],
            frames: {count:9, width:150, height:150},
            animations: {
                stand:  {frames:[0], next:false, frequency:1},
                land:   {frames:[1], next:false, frequency:1},
                still:  {frames:[1], next:false, frequency:1 },
                step1:  {frames:[1,2,1], next:"still", frequency:3 },
                step2:  {frames:[3,4,3,2,1], next:"still", frequency:3 },
                step3:  {frames:[3,5,5,3,2], next:"still", frequency:1 },
                jump:   {frames:[4,5,5,5,3,2,1], next:false, frequency:2},
                fly:    {frames:[6,6,6,5,4], next:"still", frequency:2},
                use:    {frames:[7,8], next:"stand", frequency:5},
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
        {
            name: "masterchin",
            images: ["assets/masterchin.png"],
            frames: {count:4, width:300, height:300,regX:0,regY:0},
            animations: {
                up: {frames:[0,1,2,3], next:true, frequency:2},
                down: {frames:[3,2,1,0], next:true, frequency:1},
            }
        },
        {
            name: "background",
            images: ["assets/trees.png"],
            frames: {count:3, width:600, height:250,regX:600/2,regY:250/2},
            animations: {
                a: {frames:[0], next:false, frequency:1},
                b: {frames:[1], next:false, frequency:1},
                c: {frames:[2], next:false, frequency:1},
            }
         }
    ];

    return {
        onReady: undefined,
        onUpdate: undefined,
        animations: {},
        initialize: function() {
            spriteSheetDescriptions.forEach( function(description) {
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
            var expected = spriteSheetDescriptions.length;
            loadCount += 1;
            this.onUpdate(loadCount, expected); 
            if( loadCount == expected ) {
                this.onReady();
            }
        },
        getAnimation: function(name) {
            return this.animations[name];
        }
    }
}());

var Blings = function (container) {
    var list = [];
 
    var g = new createjs.Graphics()
            .beginFill("#FF0")
            .drawPolyStar(0, 0, 25, 5, 0.6, -90);

    var starShape = new createjs.Shape(g);
    starShape.regX = 0;
    starShape.regY = 0;

    return {
        container: container,
        addStar: function(body) {
            var origin = body.GetWorldCenter();
            var fixture = physics.createMarkerFixture( origin.x, origin.y, 0.5, 0.5, 0 );
            fixture.GetBody().ApplyImpulse( new b2Vec2(0.5,-0.5), origin );
            var sprite = starShape.clone();
            sprite.alpha = 0;
            sprite.rotation = body.GetAngle() * (180 / Math.PI);
            this.container.addChild(sprite);

            list.push( {
                body:fixture.GetBody(),
                skin:sprite,
                frames:30,
                fixture:fixture,
                rotate:true,
                velocity:body.GetLinearVelocity().x
            });

        },
        addMessage: function(body, message) {
            var origin = body.GetWorldCenter();
            var fixture = physics.createMarkerFixture( origin.x, origin.y, 0.5, 0.5, 0 );
            fixture.GetBody().ApplyImpulse( new b2Vec2(0.5,-0.5), origin );
            var sprite = new createjs.Text(message,"bold 32px Arial","#FFF");
            sprite.alpha = 0;
            this.container.addChild(sprite);

            list.push( {
                body:fixture.GetBody(),
                skin:sprite,
                frames:30,
                fixture:fixture,
                rotate:false
            });

        },
        advance: function() {
            list.forEach( function(entity, index, array) {
                if( entity.frames-- === 0 ) {
                    this.container.removeChild(entity.skin);
                    physics.destroyBody( entity.body );
                    array.splice(index, 1);
                }
                else {
                    var center = entity.body.GetWorldCenter();
                    if( entity.rotate ) {
                        entity.skin.skewX += 4*entity.velocity;
                        entity.skin.rotation += 30-entity.frames;
                    }
                    entity.skin.x = center.x * PPM;
                    entity.skin.y = center.y * PPM;
                    entity.skin.alpha += entity.frames < 25 ? -0.05 : 0.20;
                }
            }, this);
        }
    }
}

var playspace = (function() {
	"use strict";

    var utility = (function (){
        return {
            generateFloorSprite: function( width, height, fill, depth ) {
                var blurFilter = new createjs.BoxBlurFilter(depth,depth,depth);
                var margins = blurFilter.getBounds();
                var g = new createjs.Graphics()
                        .setStrokeStyle(1)
                        .beginStroke(createjs.Graphics.getRGB(0,0,0))
                        .beginFill(fill)
                        .rect(0,0,width,height);
                var s = new createjs.Shape(g);
                s.regX = width/2;
                s.regY = height/2;
                s.filters = [blurFilter];
                s.cache(margins.x,margins.y,width+margins.width,height+margins.height);
                return s;
            }
        }
    }());

    var rotate = function(p,theta) {
        var cos = Math.cos(theta);
        var sin = Math.sin(theta);
        var x = p.x*cos-p.y*sin;
        var y = p.x*sin+p.y*cos;
        return {x:x,y:y};
    }

    var generateBearings = function(center, radius, angle, angularVelocity) {
        var points = [
            rotate({x:1, y:1}, angle),
            rotate({x:-1, y:1}, angle),
            rotate({x:-1, y:-1}, angle),
            rotate({x:1, y:-1}, angle)
        ];
        
        points.forEach( function(point) {
            var rotationalDirection = angularVelocity && angularVelocity / Math.abs(angularVelocity);
            var tangent = rotate(point, rotationalDirection * Math.PI/4); 
            point.vX = angularVelocity * tangent.x;
            point.vY = angularVelocity * tangent.y;
            point.x = center.x + radius*point.x;
            point.y = center.y + radius*point.y;
        });

        var entities = points.map( function(p) {
            var result = {};
            result.fixture = physics.createBallFixture(p.x,p.y,radius/2,8);
            result.body = result.fixture.GetBody();
            result.fixture.SetRestitution(0.9);
            var velocity = result.body.GetLinearVelocity();
            velocity.x = p.vX;
            velocity.y = p.vY;
            result.body.SetLinearVelocity(velocity);

            result.destruct = function() { physics.destroyBody(result.body); };
            var g = new createjs.Graphics()
                    .setStrokeStyle(1)
                    .beginStroke(createjs.Graphics.getRGB(0,0,0))
                    .beginFill(createjs.Graphics.getRGB(255,0,0))
                    .drawCircle(0,0,(radius/2)*PPM);
            result.skin = new createjs.Shape(g);
            return result.skin;
        },this);

        return entities;
    }

    return {
        layers: [],
        bearings: [],
        blings: undefined,
        leftLine: undefined,
        rightLine: undefined,
        playerArticles: [],
        container: new createjs.Container,
        initialize: function() {
            this.blings = new Blings(this.container);
            this.setScene();
        },
        setScene: function() {
            var stack = [];
            var backgroundAnimationNames = ["b","c","a"];
            for(var parallax = 4; parallax > 1; parallax-=1) {
                for(var index=-3; index<3; index++) {
                    var offset = Math.floor( Math.random() * 3 ) * 123;
                    var body = physics.createStaticBody(index*650+offset,475-250/2-25*(4-parallax),600,250,2);
                    var skin = assets.getAnimation("background").clone();
                    skin.gotoAndPlay( backgroundAnimationNames[parallax-2] );
                    stack.push( [body,skin,1/(parallax*parallax)] );
                }
            }

            stack.reverse().forEach( function(i) {
                this.addStaticBody( i[0], i[1], i[2]);
            },this);

            var world = {width:20000, height:1000};
            var floorBody = physics.createStaticBody(0,world.height/2,world.width,10,255);
            var floorSkin = utility.generateFloorSprite(world.width,10,createjs.Graphics.getRGB(255,255,255),6);
            this.addStaticBody( floorBody, floorSkin, 1 );

            var leftWallBody = physics.createStaticBody(-world.width/2,0,10,world.height,255);
            var leftWallSkin = utility.generateFloorSprite(10,world.height,createjs.Graphics.getRGB(255,255,255),12);
            this.addStaticBody( leftWallBody, leftWallSkin, 1 );

            var rightWallBody = physics.createStaticBody(world.width/2,0,10,world.height,255);
            var rightWallSkin = utility.generateFloorSprite(10,world.height,createjs.Graphics.getRGB(255,255,255),12);
            this.addStaticBody( rightWallBody, rightWallSkin, 1 );

            this.leftLine = {};
            this.leftLine.body = physics.createStaticBody(-world.width/2,0,10,world.height,2);
            this.leftLine.skin = utility.generateFloorSprite(10,world.height,createjs.Graphics.getRGB(240,240,75),10);
            this.addStaticBody( this.leftLine.body, this.leftLine.skin, 1 );

            this.rightLine = {};
            this.rightLine.body = physics.createStaticBody(world.width/2,0,10,world.height,2);
            this.rightLine.skin = utility.generateFloorSprite(10,world.height,createjs.Graphics.getRGB(240,240,75),10);
            this.addStaticBody( this.rightLine.body, this.rightLine.skin, 1 );
        },
        addPlayer: function(entity) {
            this.player = entity.makePhysical();
            this.container.addChild(this.player.container);
            this.playerPresent = true;
        },
        addBall: function(entity) {
            this.ball = entity.makePhysical();
            this.container.addChild(this.ball.skin);
            this.ballPresent = true;
        },
        removeBall: function(entity) {
        },
        addBlingMessage: function(body, message) {
            this.blings.addMessage(body, message);
        },
        addBlingStar: function(body, message) {
            this.blings.addStar(body, message);
        },
        addBearings: function(source) {
            this.bearings = generateBearings(source.getPosition(), 24/PPM, source.getAngle(), source.getAngularVelocity());
            this.bearings.forEach( function(entity) {
                this.container.addChild(entity.skin);
            },this);
        },
        removeBearings: function(source) {
            this.bearings.forEach( function(entity,index,array) {
               this.container.removeChild(entity.skin);
               entity.destruct();
               array.splice(index,0);
            },this);
        },
        addStaticBody: function(body,skin,parallax) {
            var origin = body.GetWorldCenter();
            this.layers.push( {
                body:body,
                skin:skin,
                origin:{x:origin.x, y:origin.y},
                parallax:parallax
            });
            this.container.addChild(skin);
        },
        setFinishLine: function(x) {
            var position = this.leftLine.body.GetWorldCenter();
            position.x = -x;
            this.leftLine.body.SetPosition(position);
            this.leftLine.skin.x = this.leftLine.body.GetWorldCenter().x * PPM;
            this.leftLine.skin.y = this.leftLine.body.GetWorldCenter().y * PPM;

            position = this.rightLine.body.GetWorldCenter();
            position.x = -x;
            this.rightLine.body.SetPosition(position);
            this.rightLine.skin.x = this.rightLine.body.GetWorldCenter().x * PPM;
            this.rightLine.skin.y = this.rightLine.body.GetWorldCenter().y * PPM;
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
            if( this.playerPresent ) {
                this.player.container.rotation = this.player.body.GetAngle() * (180 / Math.PI);
                this.player.container.x = this.player.body.GetWorldCenter().x * PPM;
                this.player.container.y = this.player.body.GetWorldCenter().y * PPM;
            }
        },
        updateBall: function() {
            if( this.ballPresent ) {
                this.ball.skin.rotation = this.ball.body.GetAngle() * (180 / Math.PI);
                this.ball.skin.x = this.ball.body.GetWorldCenter().x * PPM;
                this.ball.skin.y = this.ball.body.GetWorldCenter().y * PPM;
            }
        },
        updateLayer: function(layer) {
            layer.skin.rotation = layer.body.GetAngle() * (180 / Math.PI);
            layer.skin.x = layer.body.GetWorldCenter().x * PPM;
            layer.skin.y = layer.body.GetWorldCenter().y * PPM;
        },
        updateLayers: function() {
            this.layers.forEach( this.updateLayer, this); 
        },
        updateBearing: function(bearing) {
            bearing.skin.rotation = bearing.body.GetAngle() * (180 / Math.PI);
            bearing.skin.x = bearing.body.GetWorldCenter().x * PPM;
            bearing.skin.y = bearing.body.GetWorldCenter().y * PPM;
        },
        updateBearings: function() {
            this.bearings.forEach( this.updateBearing, this);
        },
        updateBlings: function() {
            this.blings.advance();
        },
        reset: function() {
            this.updatePlayer();
            this.updateBall();
            this.updateLayers();
            this.removeBearings();
        },
        advance: function() {
            this.updatePlayer();
            this.updateBall();
            this.updateLayers();
            this.updateBlings();
            this.updateBearings();
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
            this.layers.forEach( function(layer, index, array) {
                if( layer.parallax !== 1 ) {
                    var position = layer.body.GetWorldCenter();
                    position.x = layer.origin.x-amount*layer.parallax;
                    layer.body.SetPosition(position);
                }
            }, this);
        }
    }
}());

var camera = (function() {
	"use strict";

    var tween = function(target, current, delta) {
        if( target != current ) {
            if( target > current ) {
                return Math.min(current+delta, target);
            }
            else {
                return Math.max(current-delta, target);
            }
        }
        return target;
    }

    return {
        zoomFactorTarget: 1.0,
        onCamera: function(x,y) { console.log("override onCamera"); },
        onParallax: function(d) { console.log("override onParallax"); },
        requiredTranslation: {x:0, y:0},
		initialize: function( stage ) {
            this.stage = stage;
            this.target = {x:0, y:0};
            this.current = {x:0, y:0};
            this.setZoomMotion(0.01, 1.0);
        },
        setZoom: function(factor) {
            this.zoomFactor = factor;
            this.stage.scaleX = factor;
            this.stage.scaleY = factor;
            this.offset = {
                x:this.stage.canvas.width/2/factor,
                y:(this.stage.canvas.height/2+100)/factor};
            if(DEBUG) { 
                physics.debugDraw.SetDrawScale(PPM*factor); 
            }
        },
        setZoomMotion: function(fromFactor, toFactor) {
            this.zoomFactorTarget = toFactor;
            this.setZoom(fromFactor);
        },
        updateRequiredTranslation: function() {
            this.requiredTranslation.x = this.offset.x - this.current.x*PPM;
            this.requiredTranslation.y = this.offset.y - this.current.y*PPM;
            this.onCamera(this.requiredTranslation);
            this.onParallax(this.requiredTranslation.x/PPM);
        },
        fix: function(point) {
            this.entityOfInterest = false;
            this.lookAt(point);
        },
        lookAt: function(point) {
            this.target.x = point.x;
            this.target.y = point.y;
        },
        watch: function(entity) {
            this.entityOfInterest = entity;
        },
        advance: function() {
            var factor = tween( this.zoomFactorTarget, this.zoomFactor, 0.01 );
            this.setZoom( factor );

            if( this.entityOfInterest ) {
                this.lookAt(this.entityOfInterest.body.GetWorldCenter());
            }
            
            this.current.x = tween( this.target.x, this.current.x, 0.1 );
            this.current.y = tween( this.target.y, this.current.y, 0.1 );
            this.updateRequiredTranslation();
        }
    }

}());

/* This constructor is stub object, used as a functional placeholder
** for the ball and player objects until they are added to the Box2d
** world. Both ball and player implement a makePhysical method which
** replaces the DeadBody instances with a real fixture once ball and   
** player are added to the playspace object. This remains until some
** better engineer decouples the hud/manager and player/ball objects.
*/
var DeadBody = function() {
    this.GetWorldCenter = function() { return {x:0,y:0}; }
    this.GetLinearVelocity = function() { return {x:0,y:0} };
    this.GetAngle = function() { return 0; };
}

var ball = (function() {
	"use strict";

    return {
        skin: undefined,
        body: new DeadBody,
        isInPlay: false,
        isActive: true,
        makePhysical: function() {
            this.fixture = physics.createBallFixture(-1.5,1,25/PPM,1);
            this.body = this.fixture.GetBody();
            this.body.SetUserData(this);
            return this;
        },
		initialize: function() {
            this.skin = assets.getAnimation("ball");
            this.skin.gotoAndPlay("ready");
		},
        handleBeginContact: function( entity ) {
            if (entity === player) {
                audio.soundOn(6);
                if( this.isInPlay ) {
                    playspace.addBlingStar(ball.body);
                }
            }
        },
        handleEndContact: function( entity ) {
        },
        setInPlay: function(state) {
            this.isInPlay = state;
        },
        setActive: function(state) {
            this.isActive = state;
            this.body.SetActive(state);
        },
        reset: function(v,r) {
            this.body.SetAngularVelocity(0);

            var position = this.body.GetWorldCenter();
            position.x = -1;
            position.y = 0;
            this.body.SetPositionAndAngle(position,0);

            var velocity = this.body.GetLinearVelocity();
            velocity.x = v;
            velocity.y = 0;
            this.body.SetLinearVelocity(velocity);

            this.fixture.SetRestitution(r);
            this.body.SetAwake(true);

            this.skin.gotoAndPlay("ready");
        },
        getLinearVelocity: function() {
            return this.isActive ? this.body.GetLinearVelocity() : {x:0,y:0};
        },
        getPosition: function() {
            return this.body.GetWorldCenter();
        },
        getAngle: function() {
            return this.body.GetAngle();
        },
        getAngularVelocity: function() {
            return this.body.GetAngularVelocity();
        },
        advance: function() {
        }
    }
    
}());

var player = (function() {
	"use strict";
	return {
        articles: [],
        container: undefined,
		skin: undefined,
        body: new DeadBody,
        maximumRotation: Math.PI*2/360*15,
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
        makePhysical: function() {
            this.fixture = physics.createPlayerFixture(1,0,75,75,1);
            this.body = this.fixture.GetBody();
            this.body.SetUserData(this);
            return this;
        },
		initialize: function() {
            this.container = new createjs.Container;
            this.container.regX = 75, this.container.regY = 110;
            this.skin = assets.getAnimation("player");
            this.container.addChild(this.skin);
            this.gotoAndPlay("still");
		},
        handleBeginContact: function( entity ) {
            // nothing happens
        },
        handleEndContact: function( entity ) {
            // nothing happens
        },
        hasArticle: function(name) {
            return this.articles.some( function(article) {
                return article.name === name;
            });
        },
        giveArticle: function(name) {
            if( !this.hasArticle(name) ) {
                var animation = assets.getAnimation(name); 
                this.articles.push( {name:name, animation:animation} );
                this.container.addChild(animation);
                this.gotoAndPlay("still"); // maybe celebrate?
            }
        },
        gotoAndPlay: function(frame) {
            this.skin.gotoAndPlay(frame);
            this.articles.forEach(function(article) {
                article.animation.gotoAndPlay(frame);
            },this);
        },
        reset: function(startPosition) {
            this.body.SetAngularVelocity(0);

            var position = this.body.GetWorldCenter();
            position.x = startPosition;
            position.y = 0;
            this.body.SetPositionAndAngle(position,0);

            var velocity = this.body.GetLinearVelocity();
            velocity.x = 0;
            velocity.y = 0;
            this.body.SetLinearVelocity(velocity);
            this.body.SetAwake(true);
            this.gotoAndPlay("still");
        },
        getLinearVelocity: function() {
            return this.body.GetLinearVelocity();
        },
        getPosition: function() {
            return this.body.GetWorldCenter();
        },
		advance: function() {
            var angle = this.body.GetAngle();
            if( angle > this.maximumRotation ) {
                this.body.SetAngle( this.maximumRotation );
            }
            else if( angle < -this.maximumRotation ) {
                this.body.SetAngle( -this.maximumRotation );
            }
		},
        actionStep: function(direction,mag) {
            this.impulse(direction, mag, mag);
        },
		actionForward: function() {
			this.impulse(-1, 2, 5);
            this.jump(1);
		},
		actionFlight: function() {
            this.jump(3.5);
		},
		actionSuperforward: function() {
			this.impulse(-1, 3, 5);
            this.jump(1);
		},
		actionLaunch: function(max) {
            this.jump(max/2);
			this.impulse(-1, max, max*20);
		},
		actionBackward: function() {
			this.impulse(1, 1, 5);
		},
		actionStand: function() {
		},
		actionBrake: function() {
            this.brake();
		},
	}
}());


var main = (function () {
	"use strict";

    function fireMenuAction(action) {
        switch(action) {
            case "TOGGLE":
                hud.toggleMenu();
                break;
            case "LESSON":
                hud.toggleTeacher();
                break;
            default:
                console.log("unknown menu action:", action);
                break;
        }
    }
    
	function firePlayAction(action) {
		switch(action) {
			case "FWD_STEP1": 
                audio.soundOn(1);
                player.actionStep(-1,1);
                player.gotoAndPlay("step1");
				break;
			case "FWD_STEP2": 
                audio.soundOn(2);
                player.actionStep(-1,1.2);
                player.gotoAndPlay("step2");
				break;
			case "FWD_STEP3": 
                audio.soundOn(3);
                player.actionStep(-1,1.5);
                player.gotoAndPlay("step3");
				break;
			case "BWD_STEP1": 
                audio.soundOn(3);
                player.actionStep(1,1);
                player.gotoAndPlay("step1");
				break;
			case "BWD_STEP2": 
                audio.soundOn(2);
                player.actionStep(1,1);
                player.gotoAndPlay("step2");
				break;
			case "BWD_STEP3": 
                audio.soundOn(1);
                player.actionStep(1,1);
                player.gotoAndPlay("step3");
				break;
            case "FORWARD":
                audio.soundOn(4);
                player.actionForward();
                player.gotoAndPlay("jump");
                playspace.addBlingMessage(player.body, "boing!");
                break;
            case "FLIGHT":
                audio.soundOn(5);
                player.actionFlight();
                player.gotoAndPlay("fly");
                playspace.addBlingMessage(player.body, "oomph!");
                break;
            case "DASH":
                audio.soundOn(5);
                player.actionSuperforward();
                player.gotoAndPlay("fly");
                playspace.addBlingMessage(player.body, "dash!");
                break;
            case "LAUNCH1":
                audio.soundOn(5);
                audio.soundOn(2);
                player.actionLaunch(1);
                player.gotoAndPlay("fly");
                playspace.addBlingMessage(player.body, "spring x 1");
                break;
            case "LAUNCH2":
                audio.soundOn(5);
                audio.soundOn(2);
                player.actionLaunch(3);
                player.gotoAndPlay("fly");
                playspace.addBlingMessage(player.body, "spring x 2");
                break;
            case "LAUNCH3":
                audio.soundOn(5);
                audio.soundOn(2);
                player.actionLaunch(4);
                player.gotoAndPlay("fly");
                playspace.addBlingMessage(player.body, "spring x 3");
                break;
            case "LAUNCH4":
                audio.soundOn(5);
                audio.soundOn(2);
                player.actionLaunch(8);
                player.gotoAndPlay("fly");
                playspace.addBlingMessage(player.body, "SPRING!");
                break;
            case "STAND":
                audio.soundOn(4);
                player.gotoAndPlay("stand");
                break;
            case "LAND":
                player.gotoAndPlay("land");
                break;
            case "USE":
                console.log("use item");
                player.gotoAndPlay("use");
                break;
            case "EXPIRED":
                player.gotoAndPlay("land");
                break;
            case "RECOVERED":
                player.gotoAndPlay("land");
                break;
			default:
				console.log("unknown play action:", action);
				break;
		}
	}


    var video = (function(){
        return {
            canvas: undefined,
            context: undefined,
            stage:undefined,
            initialize: function() {
                this.canvas = document.getElementById("testCanvas");
                this.context = this.canvas.getContext("2d");
                this.stage = new createjs.Stage(this.canvas);
                this.stage.autoClear = true;
            },
            update: function() {
                this.stage.update();
            },
            clear: function() {
                this.context.save();
                this.context.setTransform(1, 0, 0, 1, 0, 0);
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.context.restore();
            }
        }
    }());

    var handleCompletedAll = function() {
        hud.showTeacher("That's all for now. Your prize is carpal tunnel syndrome.");
    };

    var handlePassedObjective = function(objective) {
        playspace.addBearings( ball );
        ball.setActive(false);
        ball.setInPlay(false);
        ball.reset();
        var gotoNext = function() {
            manager.nextObjective(objective);
        }
        hud.announce("success", 2.5, function() {
            if( objective.article ) {
                player.giveArticle(objective.article);
                hud.announce("awarded: "+objective.article, 3.5, gotoNext);
            }
            else {
                gotoNext();
            }
        });
    };

    var handleFailedObjective = function(objective) {
        ball.setInPlay(false);
        var playerPosition = this.player.getPosition().x; 
        var ballPosition = this.ball.getPosition().x;
        var overTaken =  playerPosition < ballPosition;
        var reason = overTaken ? "foul" : "fail";
        hud.announce(reason, 3.5, function() {
            manager.setObjective(objective);
        });
    }

    var handleConcludeObjective = function(objective) {
    };

    var firstLoad = true;
    var handleInitiateObjective = function(objective) {
        var runObjective = function() { 
            if( firstLoad ) {
                playspace.addBall(ball);
                firstLoad = false;
            }
            else {
                ball.setActive(true);
                ball.reset(objective.initialVelocity, objective.initialRestitution);
            }
            ball.setInPlay(true);
            camera.watch( player );
            playInput.enable();
            hud.announce("GO!", 1);
        }

        var introduceObjective = function() {
            camera.fix( {x:0,y:3.042} );
            playInput.disable();
            player.reset(objective.startingLine);
            playspace.reset();
            playspace.setFinishLine(objective.finishLine);
            hud.setTargetVelocity( objective.targetVelocity );
            hud.announce(objective.title, 2.5, runObjective );
        }

        var teachLesson = function() {
            objective.encodeActions( playInput.getRootAction() );
            playInput.enable();
            var message = objective.lesson;
            if( !objective.hasBeenAttempted ) {
                message = objective.praise + " " + message;
            }
            hud.showTeacher(message, function() {
                introduceObjective();
            });
        }

        camera.watch( player );
        teachLesson();
    };

	return {
        preload: function() {
            assets.onReady = this.preloaded.bind(this);
            assets.onUpdate = this.loading.bind(this);
            assets.initialize();
        },
        loading: function(loaded,expected) {
            $("#play").html("Loaded "+loaded/expected*100+"%");
        },
        preloaded: function () {
            var canvasHTML = $("<canvas id='testCanvas' width='1000' height='500'></canvas>");
            var begin = function() {
                $("#screen").html(canvasHTML);
                this.start();
            };
            if( FASTSTART) {
                begin.apply(this);
            }
            else {
                $("#play").click($.proxy( begin, this ));
                $("#play").addClass("ready").html("click here to play.");
            }
        },
		start: function () {
            video.initialize();
            audio.initialize();
            input.initialize();
            playInput.setActionDelegate(firePlayAction);
            menuInput.setActionDelegate(fireMenuAction);
            menuInput.enable();

            physics.initialize();
            physics.setDebugDraw(video.canvas);
            camera.initialize(video.stage);

            player.initialize();
            ball.initialize();

            playspace.initialize();
            playspace.bindCamera(camera);
            playspace.bindParallax(camera);
            video.stage.addChild(playspace.container);

            camera.fix( {x:0,y:3.042} );

            hud.initialize(video.canvas);
            hud.setPlayer(player);
            hud.setBall(ball);

            manager.initialize();
            manager.onPassedObjective = handlePassedObjective;
            manager.onFailedObjective = handleFailedObjective;
            manager.onInitiateObjective = handleInitiateObjective;
            manager.onConcludeObjective = handleConcludeObjective;
            manager.onAllObjectivesComplete = handleCompletedAll;
            manager.setPlayer( player );
            manager.setBall( ball );

            createjs.Ticker.setFPS(FPS);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addListener(this);
            hud.announce("Push, Chinchilla!",5, function() {
                playspace.addPlayer( player );
                hud.announce("", 2, function() {
                    manager.firstObjective();
                });
            });
		},
        debugClear: function() {
            video.clear();
        },
        drawDebug: function() {
            video.context.save();
            video.context.translate(camera.requiredTranslation.x*camera.zoomFactor,camera.requiredTranslation.y*camera.zoomFactor);
            physics.drawDebug();
            video.context.restore();
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
			video.update();
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
