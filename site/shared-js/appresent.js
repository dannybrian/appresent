/*
 * Copyright (c) 2014 Danny Brian <danny@brians.org>
 *
 */

(function(window, undefined) {
    'use strict';
    
    var appresent = function() {
        var debug = _getParameterByName('debug');
        var authormode = _getParameterByName('author');
        var dragInertia = 200;
        var mapWidth = 4000;
        var mapHeight = 2689;
        
        var freeTouch = false;
        var freeRotate = false;
        var freePanSwipe = 300; // how long free pan swipe should transition
        var currentNum = 0;
        var prevNum = -1;
        var subNum = -1;
        var eventNum = 0;
        var mapMinScale = 0.2;
        var mapMaxScale = 4;
        var mapPadding = 0;
        var mapzoomToggle = false;
        var dbltapZoom = 3;
        var touchWait = false;
        var filters = new Object;
        var realCordova = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
        
        var authed = false;
        var lkey = localStorage.lkey;
        var privateMode = false; 
        var followMode = _getParameterByName('follow') || false;
        
        var nodesMode = false;
        var meta = 0;
        var votes = {};
        var answers = {};
        var votePercents = [];
        var averagePercent = 0;
        var soundOn = true;
        var notesOnly = false;
        var cmdKeyPressed = false;
        
        var paused = false;
        
        // if we're running in a UIWebView component
        var isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
        
        // if we're in a UIWebView, we add a class to make the background transparent
        // (among other things)
        if (isWebView) {
            var body = document.getElementById('body');
            body.className += body.className ? ' webview' : 'webview';
        }
        
        // if the browser is in private mode, we'll try to disallow votes.
        if (_setKey("testme", "test") == false) {
	       privateMode = true;
        }

        if (followMode) {
            // to make sharing presos with remote audiences a bit easier, hide the menu button.
            document.getElementById('controls-toggle').style.display = 'none';
        }
        
         if (_getParameterByName('freetouch')) {
            freeTouch = true;
        }
        
        // our registration/origin points
        var mapMidX = mapWidth / 2;
        var mapMidY = mapHeight / 2;
        var screenMidX = window.innerWidth / 2;
        var screenMidY = window.innerHeight / 2;
        var fullScale = window.innerWidth / mapWidth;
        if (mapHeight * fullScale > window.innerHeight) {
            fullScale = window.innerHeight / mapHeight;
        }
        
        var loadedImages = 0;
        var preloaded = document.getElementById('preloaded');
        var vids = document.querySelectorAll('video');
        var sounds = document.querySelectorAll('audio');
        var totalImagesVideos = document.querySelectorAll('img').length;
        var presentScript = [];
        var delayTimer = 0;
        var presentedEvents = {};
        var delayTimers = [];
        var delayEvents = [];
        var _scriptID = 0;
        
        this.init = function (options, script) {
            // console.log("init(): " + script);

            mapWidth = options.mapWidth ? options.mapWidth : mapWidth;
            mapHeight = options.mapHeight ? options.mapHeight : mapHeight;
            
            presentScript = script;
            // add _id's to all send events in the script, so that clients can
            // skip dups in case of reconnects (where they get a dup from node) or 
            // a need for presenter reload (where the presenter resets)
            // FIXME: clean up these script loops as recursive functions.
            
            recurseAssignEventIds(presentScript);

            if (!realCordova) {
                window.addEventListener( 'load', _orient, false );
                window.addEventListener( 'orientationchange', _orient, false );
            }
            else
            {
                _orient();
                window.addEventListener( 'orientationchange', _orient, false );
                setTimeout(function() {
                    navigator.splashscreen && navigator.splashscreen.hide(); // from the splashscreen plugin.				
                }, 100);
            }

            _scale();
            
            // Preload images and video.

            if (realCordova) {
            //    totalImagesVideos += vids.length + sounds.length;
            }
            for (i = 0; i < document.images.length; i++) {
                document.images[i].onload = function() {
                    loadedImages++;
                    var pscale = (window.innerWidth / 10) * (loadedImages / totalImagesVideos);
                    preloaded.style.webkitTransform = 'scaleX(' + pscale + ')';
                    if (loadedImages >= totalImagesVideos) {
                        removeCover();
                    }
                };
                var isrc = document.images[i].src;
                document.images[i].src = ''; // browser cache won't let onload fire, but it will still work here.
                document.images[i].src = isrc;
                
                // console.log(isrc);
            }
            // FIXME: why did the above break with Chrome 41?
            // I know less now needs async: true, but ...
            setTimeout(function() {
                removeCover();
            }, 500);
            if (realCordova) {
                for (i = 0; i < vids.length; i++) {
                    vids[i].addEventListener('canplaythrough') = function () {
                        loadedImages++;
                        if (loadedImages >= totalImagesVideos) {
                            removeCover();
                        }
                    }
                }
            }
            
            if (totalImagesVideos === 0) {
                removeCover();
            }

            var hash = window.location.hash;
            hash = hash.substring(hash.indexOf("#")+1);
            var hashSlides = hash.split('/');
            //console.log(hash);
            
            if (typeof hashSlides[0] !== undefined) {
                if (hashSlides[0] === 'end') {
                    hashSlides[0] = presentScript.length - 1;
                }
                presentEvent(hashSlides[0], true);
            }
            else
            {
                presentEvent(0, true);
            }
            if (typeof hashSlides[1] !== undefined && hashSlides[1]) {
                presentSubevent(hashSlides[1], true);
            }

            window.onresize = _scale;
            
        } // end init


        // keyboard control.
        document.onkeyup = function(ev) {
            ev = ev || window.event;
            switch (ev.keyCode) {
                case 91: // command
                    cmdKeyPressed = false;
                    break;
            }
        }
        
        document.onkeydown = function(ev) {
            ev = ev || window.event;
            //console.log(ev.keyCode);
            switch (ev.keyCode) {
                case 37: // left arrow
                    presentEvent(currentNum - 1);
                    break;
                case 39: // right arrow
                    presentEvent(currentNum + 1);
                    break;
                case 38: // up arrow
                case 40: // down arrow
                    presentSubevent(subNum + 1);
                    break;
                case 90: // Z
                    toggleFreeTouch();
                    break;
                case 72: // h
                    presentEvent(0, true);
                    break;
                case 69: // E
                    presentEvent(presentScript.length - 1, true);
                    break;
                case 83: // s
                    toggleSound();
                    break;
                case 91: // command
                    cmdKeyPressed = true;
                    break;
                //case 70: // f (interferes with full screen browser keys)
                    //toggleFollow();
                    //break;
                //case // hide the stuff.
                //    break;
                case 13: // enter
                case 27: // escape raises the admin menu
                case 32: // space
                case 9:  // tab
                    ev.preventDefault();
                    break;
            }
        }

        // gesture control.
        function scriptNav (ev) {
            switch(ev.gesture.direction) {
                case "left":
                    presentEvent(currentNum + 1);
                    break;
                case "right":
                    presentEvent(currentNum - 1);
                    break;
                case "down":
                case "up":
                    presentSubevent(subNum + 1);
                    break;
            }
        }

        function recurseCatchupEvents (eventList, upToNum, ignoreDepth, recovering, skipdups) {
            // console.log('recurseRepeatEvents: ' + eventList);
            if (eventList === undefined) { return; }
            if (Array.isArray(eventList)) {
                var maxNum = ignoreDepth === undefined ? upToNum : eventList.length; // we only care about the top level with the upToNum limit.
                for (var ii = 0; ii < maxNum; ++ii) {
                    recurseCatchupEvents(eventList[ii], upToNum, true, recovering);
                }
            }
            else
            {
                if ('alwaysDo' in eventList) {
                    // console.log('alwaysRepeat:');
                    // console.log(eventList);
                    if (skipdups) {
                        if (! 'seen' in eventList) {
                            doEvent(eventList, recovering, upToNum);
                        }
                    }
                    else
                    {
                        doEvent(eventList, recovering, upToNum);
                    }
                }
            }
        }
        
        function recurseSubEvent (eventList, recovering) {
            if (Array.isArray(eventList)) {
                for (var ii = 0; ii < eventList.length; ++ii) {
                    recurseSubEvent(eventList[ii], recovering);
                }
            }
            else
            {
                doEvent(eventList, recovering);
            }    
        }
        
        
        function recurseAssignEventIds (eventList) {
            if (!eventList) { return; }
            if (Array.isArray(eventList)) {
                for (var iq = 0; iq < eventList.length; iq++) {
                    recurseAssignEventIds(eventList[iq]);
                }
            }
            else
            {
                if ('meta' in eventList) {
                    meta = eventList.meta;
                    eventList['meta']['_id'] = ++_scriptID;
                }
                if ('send' in eventList) {
                    eventList['send']['_id'] = ++_scriptID;
                }
            }
        }
        
        function presentSubevent (subEventNum, recovering) {
            if (authed && !followMode && !recovering) {
                io.emit('follow', { key: lkey, eventNum: currentNum, subEventNum: subEventNum });
            }
            /*
            // we do need to send dup events to followers, since we might want/need to backtrack in the presentation.
            */

            // all subevents for an event are an array (and it can only contain one of these). So we need to find it first.
            for (i = 0; i < presentScript[currentNum].length; i++) {
                if (Array.isArray(presentScript[currentNum][i])) { // list of subevents found.
                    if (presentScript[currentNum][i].length > subEventNum) { // are there more subevents?
                        subNum = subEventNum; // set the one we're on.
                        recurseSubEvent(presentScript[currentNum][i][subNum], recovering); // recuse for all of these, so we can use an array of subevents to trigger at once.
                    }
                }
            }
            
        }

        function presentEvent (eventNum, recovering) {
            if (authed && !followMode && !recovering) {
                io.emit('follow', { key: lkey, eventNum: eventNum});
            }
            /*
            // we do need to send dup events to followers, since we might want/need to backtrack in the presentation.
            */
            subNum = -1;
            eventNum = Number(eventNum) || 0;
            
            // cancel timers for the previous event.
            for (var i = 0; i < delayTimers.length; i++) {
                
                clearTimeout(delayTimers[i]);
            }
            // clear the deleteDelay flag on the event, for delayed events.
            for (var i = 0; i < delayEvents.length; i++) {
                delete delayEvents[i]['_deleteDelay'];
            }
            delayTimers = [];
            delayEvents = [];
            
            if (presentScript.length <= eventNum || eventNum < 0) {
                console.log("Cannot navigate beyond presentation edge.");
                return;
            }

            prevNum = currentNum;
            currentNum = eventNum;
            window.location.hash = '#' + currentNum;
            // we don't do anything when this changes, just for the sake of
            // staying simple. This just lets reload work for better dev.
            
            // catch up if there are required repeat events
            if (recovering) {
                recurseCatchupEvents(presentScript, currentNum, undefined, recovering);
            }
            else
            {
                // otherwise, still repeat and repeatable events from the previous slide, in 
                // case we skipped subevents on advance. And do this for the slide
                // after too, if we went backwards.
                
                recurseCatchupEvents(presentScript[prevNum], undefined, true, recovering, true);
                
                // recurseCatchupEvents(presentScript[currentNum - 1], undefined, true, recovering, true);
            }
            
            if (Array.isArray(presentScript[currentNum])) {
                
                // this is a group of events that need to be triggered all together.
                for (var i = 0; i < presentScript[currentNum].length; ++i) {
                    doEvent(presentScript[currentNum][i], recovering);
                }
            }
            else
            {  
                 doEvent(presentScript[currentNum], recovering);
            }
                        
        }
                                 
        function doEvent (theevent, recovering, eventnum) {
            
            var notrel = false; // tell zoom to not treat coordinates as relative.
            var posX = 0, posY = 0, scale = 0, rotation = 0, duration = 0;
            
            
            if ('_ignore' in theevent) { // !debug?
                // console.log('ignoring??');
                return;
            }
            
            if ('_deleteDelay' in theevent) {
                delete theevent['delay'];
                delete theevent['_deleteDelay'];
            }
            
            if (debug) {
                console.log(theevent)
                if (recovering) { console.log('(recovering)'); }
            }
            
            if ('backOnly' in theevent) {
                if (prevNum !== currentNum + 1) {
                    return;
                }
            }
            
            if ('delay' in theevent) { // I used to have && !recovering here; why?
                // delay is tough, because we still want to still use it even if we're recovering
                // *on the same page*. But we want to skip it if we're recovering on a later page.
                if (eventnum !== currentNum || !recovering) {
                    var tdelay = Number(theevent['delay']);
                    // we only allow one delay timer at a time. This means you need to use noReset if you want multiple timers.
                    
                    // delete theevent['delay']; // so it's gone next time. BUT not until it plays!
                    theevent['_deleteDelay'] = true;
                    if ('noReset' in theevent) { // don't let other timers cancel this one, except on whole main event advance.    
                        (function(event, delay) {
                            var thisTimer = setTimeout(function() { doEvent(event) }, delay);
                            delayTimers.push(thisTimer);
                        })(theevent, tdelay);
                    }
                    else
                    {
                        (function(event, delay) {
                            var thisTimer = setTimeout(function() { doEvent(event) }, delay);
                            delayTimers.push(thisTimer);
                            delayEvents.push(event);
                        })(theevent, tdelay);
                    }
                    return;
                }
            }
            
            
            // arbitrary data to send to attendee apps
            if ('send' in theevent) {
                
                // FIXME: the recursion needs attention; with each presentEvent, we're 
                // repeating all the events before it! Sucks. So we're keeping track with 
                // the stupid 'seen' attribute on the events.
                if (theevent['seen']) { return; }
                theevent['seen'] = true;
                     
                // rather than do this, I'm just instantiating as votes come in, relying 
                // on Node to only broadcast to us things we have already requested.
                /*if ('vote-prompt' in theevent.send) {
                    if (votes[theevent.send['vote-prompt']] == undefined) {
                        votes[theevent.send['vote-prompt']] = {};
                    }
                    if (votes[theevent.send['vote-prompt']['votegroup']] == undefined) {
                        votes[theevent.send['vote-prompt']['votegroup']] = {};
                    }
                }
                */
                
                if (authed && !followMode && !recovering) {
                    io.emit('msg', { key: lkey, content: theevent.send });
                }
            }
            
            if ('meta' in theevent) {
                // console.log('saved meta');
                meta = theevent.meta;
                // meta._id = ++_scriptID;
            }
            
            if ('admin-msg' in theevent && authed && !followMode) {
                io.emit('admin-msg', { key: lkey, content: theevent['admin-msg'] } );
            }
            
            // notes put speaker notes in the sidebar.
            if ('notes' in theevent) {
                var text = "<ol>";
                for (i = 0; i < theevent.notes.length; i++) {
                    text += "<li>" + theevent.notes[i] + "</li>\n";
                }
                text += "</ol>";
                document.getElementById('notes-text').innerHTML = text;
            }
            
            if (notesOnly) { // in this mode we don't do anything locally.
                // return;    
            }
            
            // FIXME: make hideClass behave like hide, delaying a display: none.
            if ('hideClass' in theevent) {
                var hlist = document.querySelectorAll('.' + theevent['hideClass']);
                for (var h = 0; h < hlist.length; h++) {
                    // console.log(hlist[h]);
                    
                    (function(el, tclass) {
                        setTimeout(function() {
                            _removeClass(el, tclass);
                        }, 10);
                    })(hlist[h], 'shown');
                }
            }
            
            if ('startParticle' in theevent) {
                var particle = document.getElementById(theevent['startParticle']);
                
            }
            
            if ('startAnim' in theevent) {
                // to keep this simple, all we're doing is reading the data-moveto attribute
                // and transitioning to that location.
                var sprite = document.getElementById(theevent['startAnim']);
                _addClass(sprite, 'shown');
                var tposString = sprite.getAttribute('data-moveto-1');
                var rotate = sprite.getAttribute('data-rotate-1');
                
                // this doesn't work at all; Webkit disables masks above transiting elements.
                // tried 3D too. I wish it did work, it would have saved me a ton of effort.
                
                var translateString = 'translate(' + tposString + ')';
                if (rotate) {
                    translateString += " rotate(" + rotate + ")";
                }
                if (debug) { console.log(translateString); }
                //sprite.style.webkitTransform = translateString;
                
                setTimeout(function() {
                    (function(sprite, translate) {
                        sprite.style.webkitTransform = translate;
                    })(sprite, translateString);
                }, 100);
                
                if (sprite.getAttribute('data-movetime-1')) {
                    sprite.style.webkitTransitionDuration = sprite.getAttribute('data-movetime-1');        
                }
                
                sprite.setAttribute('data-leg', 1);
                
                sprite.addEventListener(_transEndEventName, function(e) { setAnimState(e); });
            }
            
            if ('addaudio' in theevent) { // singleton bullshit from Apple
                if (!soundOn) { return; }
                var el = document.getElementById(theevent['el']);
                var audio = document.createElement('audio');
                
                audio.setAttribute('preload','auto');
                audio.setAttribute('autoplay', 'yes');
                if (theevent['loop']) { 
                    audio.setAttribute('loop', 'yes');
                }
                audio.setAttribute('src', theevent['addaudio']);
                el.appendChild(audio);
                
            }
            
            if ('rmaudio' in theevent) {
                var el = document.getElementById(theevent['el']);
                if (el) {
                    el.parentNode.removeChild(el.firstChild);
                }
            }
            
             if ('adddiv' in theevent) { // this is all about safari memory management.
                console.log(theevent);
                var imagecont = document.getElementById(theevent['adddiv']);
                var image = document.createElement('div');
                image.setAttribute('id',   imagecont.getAttribute('data-id') || '');
                image.setAttribute('class', imagecont.getAttribute('data-class') || '');
                image.setAttribute('style',  imagecont.getAttribute('data-style') || '');
                imagecont.appendChild(image);
                // <div id="map9-img-holder" data-id="map9-img" data-class="evolved" data-src="images/butler-evolved_09.jpg"></div>
            }
            
            if ('addimage' in theevent) { // this is all about safari memory management.
                // console.log(theevent);
                var imagecont = document.getElementById(theevent['addimage']);
                var image = document.createElement('img');
                if (!imagecont) {
                    if (debug) { console.log("Image not found: " + theevent['addimage']); }
                    return;
                }
                image.setAttribute('src', imagecont.getAttribute('data-src') || '');
                image.setAttribute('id',   imagecont.getAttribute('data-id') || '');
                image.setAttribute('class', imagecont.getAttribute('data-class') || '');
                image.setAttribute('style',  imagecont.getAttribute('data-style') || '');
                imagecont.appendChild(image);
                // <div id="map9-img-holder" data-id="map9-img" data-class="evolved" data-src="images/butler-evolved_09.jpg"></div>
            }
            
            if ('rmdiv' in theevent) {
                var rmdiv = document.getElementById(theevent['rmdiv']);
                rmdiv.parentNode.removeChild(rmdiv);
            }
            
            if ('rmimage' in theevent) { // used to manage memory, so we take care to reset src first.
                //console.log('rmimage: ');
                //console.log(theevent['rmimage'])
                var rmimage = document.getElementById(theevent['rmimage']);
                if (rmimage == undefined) {
                    console.log("Can't rmimage that doesn't exist.");
                    return;
                }
                rmimage.style.display = 'none';
                if (rmimage.children.length > 0) {
                    rmimage.children[0].setAttribute('src','data:image/gif;base64,' + 
  'R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=');
                }
                else
                {
                    rmimage.setAttribute('src','data:image/gif;base64,' + 
      'R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=');
                }
                setTimeout(function() {
                    // to match the behavior of addimage, this will delete the first
                    // child if found. Otherwise, it will delete the referenced 
                    // ID.
                    if (rmimage.children.length > 0) {
                        // console.log('removing child:');
                        // console.log(rmimage.children[0]);
                        rmimage.removeChild(rmimage.children[0]);
                        totalImagesVideos--;
                    }
                    else
                    {
                        if (!rmimage.parentNode) {
                            console.log("no image to remove? in the timeout?");
                            return;
                        }
                        rmimage.parentNode.removeChild(rmimage);
                        totalImagesVideos--;
                    }
                },
                1000);
            }
            
            if ('addvideo' in theevent) { // here we will find a placeholder referred to by el and insert our video player.
                // We have to do this dynamically since iOS can only handle one <video> per doc, and preloading doesn't
                // really work well anway.
                var el = document.getElementById(theevent['el']) || document.getElementById(theevent['show']);
                var video = document.createElement('video');
                var width = 640;
                var height = 480;
                var muted = false;
                var loop = false;
                
                if (theevent['width']) { width = theevent['width']; }
                if (theevent['height']) { height = theevent['height']; }
                if (theevent['muted']) { muted = theevent['muted']; }
                if (!soundOn) {
                    muted = true;
                }
                if (theevent['loop']) { loop = theevent['loop']; }
                
                video.setAttribute('width', width);
                video.setAttribute('height', height);
                video.setAttribute('preload', 'auto');
                if (muted) {
                    video.setAttribute('muted', 'muted'); // doesn't work
                }
                if (loop) {
                    video.setAttribute('loop', 'loop');
                }
                //video.setAttribute('controls', '');
                video.setAttribute('id', 'video-player');
                video.setAttribute('autoplay', 'yes');
                var source = document.createElement('source');
                source.setAttribute('src', theevent['addvideo']);
                source.setAttribute('type', 'video/mp4;codecs="avc1.42E01E, mp4a.40.2"');
                video.appendChild(source);
                
                el.appendChild(video);
  
                /*
                <video id="myth1-video" width="640" height="480" preload="auto" controls>
                    <source src="video/html5ux-high.mp4" type='video/mp4;codecs="avc1.42E01E, mp4a.40.2"'/>
                </video>
                */                    
            }
            
            if ('rmvideo' in theevent) {
                setTimeout(function() {
                    var el = document.getElementById(theevent['el']) || document.getElementById(theevent['hide']);
                    var video = el.getElementsByTagName('video')[0];
                    if (video) {
                        video.parentNode.removeChild(video);
                    }
                }, 1000); // delay this a bit so that the parent div can transition off.
            }
            
            // this message won't be processed again for this session.
            if ('ignoreAfter' in theevent) { // FIXME: does not care about authed? How not since it need to work with followers.
                theevent._ignore = true;
            }
            
            // the rest of these are actual "slide" data.
            if ('pos' in theevent) {
                var poss = theevent['pos'].split('x');
                posX = Number(poss[0]);
                posY = Number(poss[1]);
                notrel = true;
            }
            else if ('mpos' in theevent) {
                var poss = theevent['mpos'].split('x');
                posX = Number(poss[0]) + mapMidX;
                posY = Number(poss[1]) + mapMidY;
            }
            
            if ('mscale' in theevent) {
                scale = theevent['mscale'] * fullScale;
            }
            else if ('scale' in theevent) {
                scale = theevent['scale'];
            }
            
            if ('rotation' in theevent) {
                rotation = theevent['rotation'];
            }
            
            if ('transtime' in theevent && !recovering) {
                duration = theevent['transtime']
            }

            var el;
            if ('el' in theevent) {
                el = document.getElementById(theevent['el']);
            }
            
            if ('origin' in theevent) {
                var origin = theevent['origin'].split(' ');
                _setTransformOrigin(el, origin[0], origin[1]);
            }
            
            if ('rmclass' in theevent) {
                var classes = theevent['rmclass'].split(' ');
                for (var i = 0; i < classes.length; ++i) {
                    _removeClass(el, classes[i]);
                }
            }
            
            if ('resetTrans' in theevent) {
                var el = document.getElementById(theevent['resetTrans']);
                el.style.transform = '';
                el.style.webkitTransform = '';
                el.style.msTransform = '';
                el.style.oTransform = '';
                el.style.transformDuration = '';
                el.style.webkitTransitionDuration = '';
            }
            
            if ('show' in theevent) {
                // this was partly an attempt to address iOS Safari memory problems.
                // it sets display: inline and delays the class addition a moment, since 
                // quickly switching display will prevent transitions of stuff like opacity.
                var els = theevent['show'].split(' ');
                for (var i = 0; i < els.length; ++i) {   
                    var el = document.getElementById(els[i]);
                    if (!el) {
                        console.log("BAD ID: '" + theevent['show'] + "'");
                        return;
                    }
                    el.style.display = 'inline';
                    setTimeout(function(el, tclass) { return function() { _addClass(el, tclass); }; }(el, 'shown' ), 5);
                }
            }
            if ('hide' in theevent) {
                // hmm. Turns out most of what I do with addclass/rmclass is show and hide.
                // So let's display:none too.
                var els = theevent['hide'].split(' ');
                for (var i = 0; i < els.length; ++i) {
                    var el = document.getElementById(els[i]);
                    if (!el) {
                        if (debug) {
                            console.log("Warning: node is missing (hide). You probably need to clean up the presentation script.");
                        }
                        return;
                    }
                    _removeClass(el, 'shown');
                    if (!theevent['noRemove']) {
                        setTimeout(function(el) { return function() { el.style.display = 'none'; }; }(el), 2100);
                    }
                }
            }
            
            if ('addclass' in theevent) {
                setTimeout(function() { _addClass(el, theevent['addclass']) }, 1);
            }
            
            if ('tallyvote' in theevent) {
                //console.log(votes);
                //console.log(theevent);
                if (votes[theevent.votegroup] !== undefined) {
                     // set text for each
                    var percent = (Math.round(votes[theevent.votegroup][theevent.tallyvote] / votes[theevent.votegroup]['_TOTAL'] * 100));
                    if (isNaN(percent)) { percent = 0; }
                    votePercents.push(percent);
                    var totalPercent = 0;
                    for (var i = 0; i < votePercents.length; i++) {
                        totalPercent += votePercents[i];
                    }
                    console.log(percent);
                    averagePercent = Math.round(totalPercent / votePercents.length); // overall
                    
                    if ('setpercent' in theevent) {
                        document.getElementById(theevent['setpercent']).innerHTML = percent + '%'; 
                    }
                    
                    var spans = el.getElementsByTagName('span');
                    for (var i = 0; i < spans.length; i++) {
                        spans[i].innerHTML = percent + '%';                        
                    }
                    _addClass(el.querySelector('.c100'), 'p'+ percent);
                }
            }
            
            if ('tallyaverage' in theevent) {
                var span = el.querySelector('span');
                if (averagePercent === 0 || averagePercent == undefined) {
                    averagePercent = 92; // just to look good when viewing the end only.
                }
                span.innerHTML = averagePercent + '%';
                _addClass(el.querySelector('.c100'), 'p'+ averagePercent);
            }
            
            if ('triggerWV' in theevent) {
                triggerWebView(theevent['triggerWV']);
            }
            
            if ('start' in theevent) { // we only allow MINUTES:SECONDS
                // console.log('starting timer');
                var time = theevent['start'] || '2:00';
                var parts = time.split(':');
                var seconds = (parts[0] * 60) + Number(parts[1]);
                el.innerHTML = time;
                var timeTick = function () {
                    seconds -= 1;
                    if (seconds < 1) {
                        el.innerHTML = "0:00";
                        setTimeout(function() { _addClass(el, "hidden") }, 2000);
                        if ('timerEndSend' in theevent) {
                            io.emit('msg', { key: lkey, content: theevent.timerEndSend });
                        }
                        return;
                    }
                    var tseconds = ("0" + (seconds % 60)).slice(-2);
                    var minutes = parseInt(seconds / 60);
                    el.innerHTML = minutes + ":" + tseconds;
                    setTimeout(timeTick, 1000);
                }
                setTimeout(timeTick, 1000);
            }
            
            if (el && el.hasAttribute('data-relscale')) { // relative scaling, works well.
                scale = Number(el.getAttribute('data-relscale')) * scale;    
            }
            
            if (scale || posX) {
                zoomToPoint(el, scale, posX, posY, rotation, duration, notrel);
            }
        }

        function zoomToPoint (el, scale, x, y, rot, time, notrel) {
            if (parseInt(authormode)) { return; }
            
            // This would be easier if we could just set the transform-origin to the point. 
            // However, transitioning the origin yields unsmooth animation, so sadly we 
            // need more math here to keep the origin always at top left.

            if (typeof el._dannyCache === 'undefined') {
                setupCache(el);
            }
            var cache = el._dannyCache;
            
            scale = typeof rot !== 'undefined' ? scale : cache.scale;
            rot = typeof rot !== 'undefined' ? rot :   cache.rotation;
            time = typeof time !== 'undefined' ? time : 0;

            var tx = x;
            var ty = y;
            if (!notrel) {
                tx = _pointToScreenX(x, scale);
                ty = _pointToScreenY(y, scale);
            }    
        
            cache.posX = cache.lastPosX = tx;
            cache.posY = cache.lastPosY = ty;
            cache.scale = cache.lastScale = scale;
            cache.rotation = cache.lastRotation = rot;

            _setTransitionDuration(el, time);

            setTimeout( function() { _setTransitionDuration(el, '') }, time + 100 );

            setTimeout(function() { // to give safari mobile and other browsers enough time to see the class changes.
                _keepOnScreen(el);
            }, 1);

        }

        /////// Controls setup

        // map touch indicators on desktop for testing.
        
        /*
        if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
           Hammer.plugins.showTouches();
        }
        */

        if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
           Hammer.plugins.fakeMultitouch();
        }
        
        
        // prevent the browser from doing its thing, except with
        // input tags.
        var app = document.getElementById('app');
        document.getElementById('body').ontouchmove = function(e) {
            var target = e.srcElement || e.target;
            if (target.tagName != "INPUT") {
                e.preventDefault();
            }
        }

        document.getElementById('contrast-slider').addEventListener('change', function(ev) {
            //console.log(ev.srcElement.value);
            filters['contrast'] = (ev.srcElement.value / 15);
            renderFilters();
        });
        document.getElementById('sat-slider').addEventListener('change', function(ev) {
            //console.log(ev.srcElement.value);
            filters['saturate'] = (ev.srcElement.value / 15);
            renderFilters();
        });
        document.getElementById('bright-slider').addEventListener('change', function(ev) {
            //console.log(ev.srcElement.value);
            filters['brightness'] = (ev.srcElement.value / 15);
            renderFilters();
        });


        // Setup touch events. Careful here. You only want one element to be touchable.
        // At author time, this works well as the #map so you can pan/zoom around and use the 
        // resulting coordinates. But at present time, it's better to be #app so that you can
        // still swipe on the notes pane only, also it can be useful to position something late
        // to be sized right on a foreign screen (and #app isn't changed by the presentation
        // script).
        var touchables = document.querySelectorAll('[data-touchable]');
        for (var i = 0; i < touchables.length; i++) {
            setupCache(touchables[i]);
            setupTouch(touchables[i]);            
        }

        // buttons en masse
        var blist = document.querySelectorAll('.button');
        for (var i = 0; i < blist.length; ++i) {
            var button = blist[i];
            setupButton(button);
        }

        function setupButton (button) {
            Hammer(button).on('tap', function(ev) {
                _addClass(button, 'active');
                setTimeout(function() { _removeClass(button, 'active') }, 200);
                if (button.hasAttribute('data-open')) {
                    var target = document.getElementById(button.getAttribute('data-open'));
                    if ( _hasClass(target, 'open' )) {
                        _removeClass(target, 'open');
                    }
                    else
                    {
                        _addClass(target, 'open');
                    }
                }
                if (button.hasAttribute('data-toggle')) {
                    var toggle = button.getAttribute('data-toggle');
                    if ( _hasClass(button, 'toggled' )) {
                        _removeClass(button, 'toggled');
                    }
                    else
                    {
                        _addClass(button, 'toggled');
                    }
                    if (toggle == "freetouch") {
                        toggleFreeTouch();
                    }
                    if (toggle == "follow") {
                        toggleFollow();
                    }
                    if (toggle == "sound") {
                        toggleSound();
                    }
                }
                if (button.hasAttribute('data-goto')) {
                    var goto = button.getAttribute('data-goto');
                    if (goto == "next") {
                        presentEvent(currentNum + 1);
                    }
                    else if (goto == "prev") {
                        presentEvent(currentNum - 1);
                    }
                    else
                    {
                        presentEvent(Number(button.getAttribute('data-goto')));
                    }
                }
                if (button.hasAttribute('data-do')) {
                    var doit = button.getAttribute('data-do');
                    if (doit == "refresh") {
                        location.reload();
                    }
                    if (doit == "resetFilters") {
                        resetFilters();
                    }
                    
                    if (doit == "pause") {
                        if (paused) {
                            paused = false;
                            _removeClass(button, 'toggled');      
                            triggerWebView({ resumePath: "current" });
                        }
                        else
                        {
                            paused = true;
                            _addClass(button, 'toggled'); 
                            triggerWebView({ pausePath: "current" });
                        }
                    }
                }
            });
        }
        
        function setAnimState(e) {
            var leg = e.target.getAttribute('data-leg');
            if (leg === undefined) { leg = 0; }
            var nextleg = 0;
            if (e.target.getAttribute('data-reversing')) {
                nextleg = Number(leg) - 1;
            }
            else
            {
                nextleg = Number(leg) + 1;
            }

            var nextlegData = e.target.getAttribute('data-moveto-' + nextleg);
            
            if (!nextlegData) {
            // we're past the end, so we need to reverse or reset.
                if (e.target.getAttribute('data-reverse')) {
                    if (e.target.getAttribute('data-reversing')) {
                        e.target.removeAttribute('data-reversing');
                        nextleg = Number(leg) + 1;
                    }
                    else
                    {
                        e.target.setAttribute('data-reversing', 'true');
                        nextleg = Number(leg) - 1;
                    }
                }
                else // we don't do reverse, so reset to 0. but we also need to jump straight there, sans transition.
                {
                    nextleg = 0;
                    nextlegData = e.target.getAttribute('data-moveto-' + nextleg);
                    var rotate = e.target.getAttribute('data-rotate-' + nextleg);
                   
                    e.target.style.webkitTransitionDuration = '2ms';
                    var ltranslateString = 'translate(' + nextlegData + ')';
                    if (rotate) {
                         ltranslateString += " rotate(" + rotate + ")";
                    }
                    e.target.setAttribute('data-leg', nextleg);
                    var rtime = e.target.getAttribute('data-repeat-delay');
                    if (!rtime) {
                        rtime = 100;
                    }
                    
                    setTimeout(function() {
                        (function(ev, translate) {
                            ev.target.style.webkitTransform = translate;
                            // the end of this transition should trigger the restart.
                            var paudio = ev.target.getAttribute('data-play-audio');
                            if (paudio != undefined) {
                                //console.log(paudio);
                                var pel = document.getElementById(paudio);
                                //console.log(pel);
                                if (pel) { pel.getElementsByTagName('audio')[0].play(); }
                            }
                        })(e, ltranslateString);
                    }, rtime);
                    return;
                }
                nextlegData = e.target.getAttribute('data-moveto-' + nextleg);
                if (!nextlegData) { console.log("Animation error: Could not find next leg!"); return; }
            }

            // if (debug) { console.log("next leg: " + nextleg); }
            
            var rotate = e.target.getAttribute('data-rotate-' + nextleg);
            var rotation = e.target.getAttribute('data-rotation') || 0;
            if (rotate) {
                e.target.setAttribute('data-rotating', rotate);
                rotation = rotate;
            }
            var swapclass = e.target.getAttribute('data-swapclass-' + nextleg);
            if (swapclass) {
                var swapping = swapclass.split('|');
                _removeClass(e.target, swapping[0]);
                _addClass(e.target, swapping[1]);
            }
            var ltranslateString = 'translate(' + nextlegData + ')';
            if (rotation) { ltranslateString += ' rotate(' + rotation + ')'; }
            
            if (e.target.getAttribute('data-movetime-' + nextleg)) {
                e.target.style.webkitTransitionDuration = e.target.getAttribute('data-movetime-' + nextleg);        
            }
            else
            {
                e.target.style.webkitTransitionDuration = e.target.getAttribute('data-movetime-1'); 
            }
            e.target.setAttribute('data-leg', nextleg);
            setTimeout(function() {
                (function(ev, translate) {
                    ev.target.style.webkitTransform = translate;
                })(e, ltranslateString);
            }, 2);

        }
        
        // indicators & network events
        document.addEventListener("connected", function(e) {
            _addClass(document.getElementById('connected'), "toggled");
            if (!privateMode) {
                lkey = localStorage.lkey ? localStorage.lkey : io.io.engine.id;
                _setKey("lkey", lkey);
                io.emit('key', {
                    key: lkey,
                    follow: followMode
                });
            }
        }, false);
        document.addEventListener("disconnected", function(e) {
            _removeClass(document.getElementById('connected'), "toggled");
        }, false);
        document.addEventListener("authenticated", function(e) {
            authed = true;
            if (meta) {
                io.emit('meta', { key: lkey, content: meta });
            }
            _removeClass(document.getElementById('admin-login'), 'open');
            _addClass(document.getElementById('login-button'), "toggled");
        }, false);
        
        var password = document.getElementById("password");
        password.addEventListener('keydown', function(ev) {
            if (ev.keyCode == 13 && !followMode) {
                io.emit('auth', { password: password.value, key: lkey });
            }
        });
        document.addEventListener("badauth", function(e) {
            _addClass(password, "error");
            setTimeout(function() { _removeClass(password, "error"); }, 10);
        }, false);
        document.addEventListener("stats", function(e) {
            document.getElementById("connected-users").innerHTML = e.stats.connected;
            // setTimeout(function() { _removeClass(password, "error"); }, 10);
        }, false);
        document.addEventListener("follow", function(e) {
            if (followMode) {
                e.follow.hurry = e.follow['hurry'] || false;
                console.log(e.follow);
                
                if (e.follow['subEventNum'] !== undefined) {
                    //currentNum = e.follow.currentNum;
                    presentSubevent(e.follow.subEventNum, e.follow.hurry);
                }
                else if (e.follow['eventNum'] !== undefined) {
                    // console.log('argh');
                    presentEvent(e.follow.eventNum, e.follow.hurry);
                }
                
            }
        }, false);
        
        // event from unity
        document.addEventListener("trigger", function(e) {
            if (e.trigger.type === "nextSubEvent") {
                presentSubevent(subNum + 1);
            }
            if (e.trigger.type === "fadeWhite") {
                _addClass(document.getElementById('body'), 'white');
                setTimeout(function() { 
                    _removeClass(document.getElementById('body'), 'white');
                }, 6000);    
            } 
            
            if (e.trigger.type === "pathPaused") {
                paused = true;
                var pbutton = document.getElementById('pause');
                _addClass(pbutton, 'toggled');                
            }  
            
        });
        
        // live answer
        document.addEventListener("answer", function(e) {
            if (answers[e.answer.qgroup] == undefined) {
                answers[e.answer.qgroup] = {};
            }
            answers[e.answer.key] = e.answer.answer;
            document.getElementById('winners').innerHTML = e.answer.answer;
        }, false);
        
        // catch-up answers
         document.addEventListener("answers", function(e) {
            answers = e.answers.answers;
            console.log(e.answers.answers);   
        }, false);
        
        // live votes; votes has fixed options.
        document.addEventListener("vote", function(e) {
            // console.log('got vote');
            
            if (votes[e.vote.votegroup] == undefined) {
                votes[e.vote.votegroup] = {};
            }
            if (votes[e.vote.votegroup][e.vote.vote] == undefined) {
                votes[e.vote.votegroup][e.vote.vote] = 0;
            }
            
            if (votes[e.vote.votegroup]['_TOTAL'] == undefined) {
                votes[e.vote.votegroup]['_TOTAL'] = 0;
            }
            
            //if (votes[e.vote.votegroup][e.vote.vote] == undefined) {
            //    votes[e.vote.votegroup][e.vote.vote] = 0;
            //}
            
            votes[e.vote.votegroup][e.vote.vote]++;
            votes[e.vote.votegroup]['_TOTAL']++;
            var counter = document.getElementById(e.vote.votegroup + '-votes-count');
            if (counter) {
                counter.innerHTML = votes[e.vote.votegroup]['_TOTAL'];
            }
        }, false);
        
        // catch-up votes
        document.addEventListener("votes", function(e) {
            votes = e.votes.votes;
            for (var key in votes) {
                
                var counter = document.getElementById(key + '-votes-count');
                var tally = document.getElementById(key + '-votes-tally');
                var tallyText = "";
                if (votes[key]['_TOTAL'] == undefined) {
                    votes[key]['_TOTAL'] = 0;
                }
                for (var vote in votes[key]) {
                    // count our total votes
                    if (vote.substr(0,1) !== '_') {
                        votes[key]['_TOTAL'] += votes[key][vote];
                    }

                }
                if (counter) {
                    counter.innerHTML = votes[key]['_TOTAL'];
                }
            }
            if (debug) {
                console.log(votes);
            }
        }, false);
        
        // winner stuff
        document.addEventListener("admin-msg", function(e) {
            if (debug) {
                console.log(e);
            }
            if ('winners' in e.admin) {
                var wtext = "";
                for (var winner in e.admin.winners) {
                    var avg = Number(e.admin.winners[winner]['votetime'] / 1000);
                    wtext += "<i>" + e.admin.winners[winner]['votetime'] + "</i> ";
                    if (e.admin.winners[winner]['score']) {
                        wtext += " <b>" + e.admin.winners[winner]['score'] + "</b> ";
                    }
                    wtext += " (";
                    wtext += String(avg);
                    wtext += "s) <br/>";
                }
                document.getElementById('winners').innerHTML = wtext;
            }
        });
        
        // setup/init functions
        function setupCache (el) {
            // I have no reservations of storing this cache in the DOM. Will refactor if I 
            // end up publishing the code. Maybe. Plus I give it my name so blame is easy.
            el._dannyCache = {
                posX: 0,
                posY: 0,
                lastPosX: 0,
                lastPosY: 0,
                scale: 1,
                lastScale: 1,
                rotation: 0,
                lastRotation: 0,
                keepOnScreen: false,
                dragReady: false
            }
        }
        
        function setupTouch (el) {

            var hammertime = Hammer(el);

            // register touch events.
            hammertime.on('touch drag dragend dragstart transform transformstart transformend swipe tap doubletap touch', function(ev) {
                var cache = el._dannyCache;
                if (freeTouch && !touchWait) {

                    if (cmdKeyPressed) {
                        if (el.hasAttribute('data-touchdisable')) {
                            return; // allow for dragging on background when cmd key is held. For authoring.
                        }    
                    }
                    
                    switch(ev.type) {

                        case 'tap':
                            if (debug) { // log the coord on the map
                                console.log(el);
                                console.log(_screenToPointX(el, ev.gesture.center.pageX) + "x" + _screenToPointX(el, ev.gesture.center.pageY));
                            }
                            break;

                        case 'doubletap':
                            // position and zoom.
                            // IMPORTANT: when zooming, we can't set the cache.scale on el before _screenToPoint happens,
                            // since it uses that cache. But _pointToScreen needs the new scale. So.
                            if (mapzoomToggle) {
                                cache.posX = _pointToScreenX(_screenToPointX(el, ev.gesture.center.pageX), cache.scale / dbltapZoom);
                                cache.posY = _pointToScreenY(_screenToPointY(el, ev.gesture.center.pageY), cache.scale / dbltapZoom);
                                cache.scale /= dbltapZoom;
                            }
                            else
                            {

                                cache.posX = _pointToScreenX(_screenToPointX(el, ev.gesture.center.pageX), cache.scale * dbltapZoom);
                                cache.posY = _pointToScreenY(_screenToPointY(el, ev.gesture.center.pageY), cache.scale * dbltapZoom);
                                cache.scale *= dbltapZoom;
                            }
                            cache.lastPosX = cache.posX;
                            cache.lastPosY = cache.posY;
                            cache.lastScale = cache.scale;

                            mapzoomToggle = !mapzoomToggle;
                            _setTransitionDuration(el, 1000);
                            _transform(el);
                            break;

                        case 'touch':
                            cache.lastScale = cache.scale;
                            cache.lastRotation = cache.rotation;
                            break;

                        case 'dragstart':
                            _addClass(el, 'notransition');
                            break;

                        case 'drag':
                            cache.posX = ev.gesture.deltaX + cache.lastPosX;
                            cache.posY = ev.gesture.deltaY + cache.lastPosY;
                            _transform(el);
                            break;

                        case 'dragend':
                            // simulate some inertia
                            
                            //cache.posX = cache.posX + (ev.gesture.velocityX * _sign(ev.gesture.deltaX) * dragInertia);
                            //cache.posY = cache.posY + (ev.gesture.velocityY * _sign(ev.gesture.deltaY) * dragInertia);
                            cache.lastPosX = cache.posX;
                            cache.lastPosY = cache.posY;
                            _removeClass(el, 'notransition');
                            //_setTransitionDuration(el, freePanSwipe);
                            
                            if (debug) {
                                var percentX = parseInt(ev.gesture.deltaX / el.offsetWidth * 100);
                                var percentY = parseInt(ev.gesture.deltaY / el.offsetHeight * 100);
                                
                                console.log( percentX + "%, " + percentY + "%");
                            }
                            
                            _keepOnScreen(el);
                            break;

                        case 'transformstart':
                            _addClass(el, 'notransition');
                            // Manipulating the transform origin is the wrong solution! Don't try it. You still 
                            // need to offset from the new origin, regardless of whether or not you're 0-registered.
                            // So you may as well just do the offset constantly and deal with slightly simpler math.
                            //_setTransformOrigin(el, _screenToPointX(el, screenMidX) + "px", _screenToPointY(el, screenMidY) + "px");
                            cache.perX = _screenToPointX(el, ev.gesture.center.pageX) / el.offsetWidth;
                            cache.perY = _screenToPointY(el, ev.gesture.center.pageY) / el.offsetHeight;
                            break;

                        case 'transform':
                            // FIXME: this implementation needs to be reworked by somebody better at the 
                            // geometry than me. Either I transform the origin back and forth or I need to offset
                            // the posX/posX continuously. In both cases, I need to set posX and posY to proper
                            // 0-registration values, but this version is the closest approximation I've found
                            // to let me "fake it".
                            cache.scale = Math.max(mapMinScale, Math.min(cache.lastScale * ev.gesture.scale, 10));
                            if (freeRotate) {
                                cache.rotation = Number(cache.lastRotation) + ev.gesture.rotation;
                            }
                            // console.log(cache.rotation);
                            
                            // Do our own transform origin manipulation with offset. What percentage of the width
                            // does the gesture lie on?
                            var changes = cache.scale - cache.lastScale;
                            cache.posX = cache.lastPosX - (changes * cache.perX * el.offsetWidth);
                            cache.posY = cache.lastPosY - (changes * cache.perY * el.offsetHeight);
                            _transform(el);
                            break;

                        case 'transformend':
                            var changes = cache.scale - cache.lastScale;
                            cache.posX = cache.lastPosX - (changes * cache.perX * el.offsetWidth);
                            cache.posY = cache.lastPosY - (changes * cache.perY * el.offsetHeight);
                            cache.lastPosX = cache.posX;
                            cache.lastPosY = cache.posY;
                            cache.lastScale = cache.scale;
                            cache.lastRotation = cache.rotation;
                            //_setTransformOrigin(el, '0px', '0px');
                            _transform(el);
                            setTimeout(function() { _removeClass(el, 'notransition'); }, 0);
                            // transforms have a tendency to register as drags when fingers don't leave the screen
                            // at exactly the same time. So we give it a delay.
                            touchWait = true;
                            setTimeout(function() { touchWait = false; }, 100);
                            
                            break;

                    }

                }
                else
                {
                    switch(ev.type) {
                        case 'swipe':
                            _addClass(document.getElementById('notes'), "flash");
                            setTimeout(function() {
                                _removeClass(document.getElementById('notes'), "flash");
                            }, 100);
                            scriptNav(ev);
                            break;

                        case 'tap':
                            //console.log(ev.gesture);
                            //console.log("tap: " + ev.gesture.center.pageX + "x" + ev.gesture.center.pageY);
                            break;
                    }
                }
            });
        }

        function removeCover () {
            setTimeout(function() {
                if (document.getElementById('cover')) {
                    _addClass(document.getElementById('cover'), 'hidden');
                }
            }, 1000);
            setTimeout(function() {
                if (document.getElementById('cover')) {
                    document.getElementById('cover').parentNode.removeChild(document.getElementById('cover')); 
                }
            }, 2200);
        }

        function toggleFreeTouch () {
            freeTouch = !freeTouch;
        }
        
        function toggleFollow () {
            followMode = !followMode;
            if (followMode) {
                io.emit('key', {
                    key: lkey,
                    follow: followMode
                });
            }
        }
        function toggleSound() {
            // FIXME: in progress versus upcoming, need a global toggle.
            soundOn = !soundOn;
            if (!soundOn) {
                var current_sounds = document.querySelectorAll('audio');
                for (var si = 0; si < current_sounds.length; si++) {
                    current_sounds[si].muted = 'muted'; 
                }
                var current_vids = document.querySelectorAll('video');
                for (var si = 0; si < current_vids.length; si++) {
                    current_vids[si].muted = 'muted'; 
                }
            }
        }
        
        function triggerWebView (args) {
            // sadly I don't know a better way to do this with UniWebView. Yet.
            //var fake = document.createElement('a');

            var url = "uniwebview://slide" + '?'
            for (var k in args){
                if (args.hasOwnProperty(k)) {
                    // FIXME: might this break the receiver?
                    url += k + "=" + args[k] + "&";
                }
            }
            if (isWebView) {
                window.open(url);
            }
            else
            {
                console.log("(Not) triggering WebView event: " + url);
            }
            //fake.setAttribute('href', url);
            //var canceled = fake.click();    
        }
        
        function resetFilters () {
            app.style.webkitFilter = '';
            filters = {};
            var inputs = document.querySelectorAll('input[type="range"]');
            for (var i = 0; i < inputs.length; ++i) {
                inputs[i].value = 15;
            }
        }

        function renderFilters () {
            var filterVals = [];
            Object.keys(filters).sort().forEach(function(key, i) {
                filterVals.push(key + '(' + filters[key] + ')');
            });
            var vals = filterVals.join(' ');
            app.style.webkitFilter = vals;
        }

        function _setTransformOrigin (el, x, y) {
            el.style.transformOrigin       = x + " " + y;
            el.style.webkitTransformOrigin = x + " " + y;
            el.style.oTransformOrigin      = x + " " + y;
            el.style.mozTransformOrigin    = x + " " + y;
        }

        function _setTransitionDuration (el, time) {
            time = time + 'ms';
            el.style.transitionDuration = time;
            el.style.oTransitionDuration = time;
            el.style.msTransitionDuration = time;
            el.style.mozTransitionDuration = time;
            el.style.webkitTransitionDuration = time;
            // console.log(el);
        }

        // convert a scaled element point to its center screen offset location.
        function _pointToScreenX (x, scale) {
            return screenMidX - (x * scale);
        }
        function _pointToScreenY (y, scale) {
            return screenMidY - (y * scale);
        }

        function _keepOnScreen (el) {
            // these keepOnScreen checks really slow things if we enforce them during a drag.
            // So instead enforce them after a gesture ends, and let them bounce back.
            var cache = el._dannyCache;
            if (cache.keepOnScreen) {
                var tooFarXOffset = window.innerWidth - mapPadding - (el.offsetWidth * cache.scale);
                var tooFarYOffset = window.innerHeight - mapPadding - (el.offsetHeight * cache.scale);

                // right edge
                if (cache.posX < tooFarXOffset) {
                    cache.posX = tooFarXOffset;
                    cache.lastPosX = cache.posX;
                }
                // left edge
                if (cache.posX > mapPadding) {
                    cache.posX = mapPadding;
                    cache.lastPosX = cache.posX;
                }
                // bottom edge
                if (cache.posY < tooFarYOffset) {
                    cache.posY = tooFarYOffset;
                    cache.lastPosY = cache.posY;
                }
                // top edge
                if (cache.posY > mapPadding) {
                    console.log(cache.posY);
                    console.log("y: " + tooFarYOffset);
                    cache.posY = mapPadding;
                    cache.lastPosY = cache.posY;
                }
                // scale
                if (cache.scale < mapMinScale) {
                    cache.scale = mapMinScale;
                    cache.lastScale = cache.scale;
                }
                _transform(el);
            }
            _transform(el);
        }

        // apply cache settings to transform
        function _transform (el) {
            var cache = el._dannyCache;
            var rotate = [];
            var rotation = "rotate(0deg) ";
            // console.log(cache.rotation);
            if (cache.rotation !== undefined) {
                if (typeof cache.rotation === "string") {
                    rotate = cache.rotation.split(',');
                }
                if (rotate.length > 1) {
                    if (rotate.length == 2) { rotate[2] = 0; }
                    rotation = "rotateX(" + rotate[0] + "deg) rotateY(" + rotate[1] + "deg) rotateZ(" + rotate[2] + "deg) ";
                }
                else
                {
                    rotation = "rotate(" + cache.rotation + "deg) ";
                    //rotation = "rotateX(0deg) rotateY(" + cache.rotation + "deg) rotateZ(0deg)";
                }
            }
            var transform =
                    "translate3d(" + cache.posX + "px," + cache.posY + "px, 0) "
                    // "translate(" + cache.posX + "px," + cache.posY + "px) "
                    
                    + rotation
                    + "scale3d(" + cache.scale + "," + cache.scale + ", 1)";
                    // + "scale(" + cache.scale + ")";
            /* The main difference (for my purposes) between translate and translate3d is that 
               the 3d version blurs images less on transist. */
            
            el.style.transform = transform;
            el.style.oTransform = transform;
            el.style.msTransform = transform;
            el.style.mozTransform = transform;
            el.style.webkitTransform = transform;
            
            // console output for cut-paste to presentation script:
            if (debug) {
                console.log( parseInt(cache.posX) + "x" + parseInt(cache.posY) + " scale: " + cache.scale);
            }
            //console.log(transform);    
        }

        // convert a screen point to an element point.
        function _screenToPointX (el, x) {
            //var tx = (x / el._dannyCache.scale) - (el._dannyCache.posX / el._dannyCache.scale);
            //console.log("tx: " + tx);
            return (x / el._dannyCache.scale) - (el._dannyCache.posX / el._dannyCache.scale);
        }
        function _screenToPointY (el, y) {
            return (y / el._dannyCache.scale) - (el._dannyCache.posY / el._dannyCache.scale);
        }

        function _addClass ( node, cname ) {
            node.className = node.className + ' ' + cname;
        }

        function _hasClass ( node, cname ) {
            var regex = new RegExp('\\s*\\b' + cname + '\\b', 'g');
            return regex.test(node.className);
        }

        function _removeClass ( node, cname ) {
            var regex = new RegExp('\\s*\\b' + cname + '\\b', 'g');
            if (!node) {
                if (debug) {
                    console.log("Warning: node is gone (_removeClass). You probably need to clean up the presentation script.");
                }
                return;
            }
            node.className = node.className.replace(regex,'');
        }

        function _sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }

        function _scale () {
            less.modifyVars({
                '@screenWidth': window.innerWidth + "px",
                '@screenHeight': window.innerHeight + "px"
            });
            mapMidX = mapWidth / 2;
            mapMidY = mapHeight / 2;
            screenMidX = window.innerWidth / 2;
            screenMidY = window.innerHeight / 2;
            fullScale = window.innerWidth / mapWidth;
            
            if (mapHeight * fullScale > window.innerHeight) {
                fullScale = window.innerHeight / mapHeight;
            }
            
            var app = document.getElementById('app');
            var xScale = window.innerWidth / 1024;
            var yScale = window.innerHeight / 768;
            
            // This took me forever. But I won't admit it publicly.
            var adjustS = Math.max(0.8, Math.min(1.8, xScale, yScale));
            var ourXScale = Math.max(0.8, Math.min(1.8, xScale));
            var ourYScale = Math.max(0.8, Math.min(1.8, yScale));
            var adjustX = ((1024 - window.innerWidth) / 4) * (1 - ourXScale);
            var adjustY = ((768 - window.innerHeight) / 6) * (1 - ourYScale);
            app.style.webkitTransformOrigin = "0% 0%";
            app.style.webkitTransform = "translate(" + adjustX + "px, " + adjustY + "px) scale(" + adjustS + ")";
            if (debug) {
                console.log("adjustments: " + adjustX + 'x' + adjustY + ', ' + adjustS);
            }
        }
        
        function _orient () {
            // from tulito
            var iOS = navigator.userAgent.match(/(iPad|iPhone|iPod)/g);
            var viewportmeta = document.querySelector('meta[name="viewport"]');
            if (iOS && viewportmeta) {
                if (viewportmeta.content.match(/width=device-width/)) {
                    viewportmeta.content = viewportmeta.content.replace(/width=[^,]+/, 'width=1');
                }
                viewportmeta.content = viewportmeta.content.replace(/width=[^,]+/, 'width=' + window.innerWidth);
                viewportmeta.content = viewportmeta.content.replace(/height=[^,]+/, 'height=' + window.innerHeight);
            }

            /* iOS 7 landscape bug */
            if (navigator.userAgent.match(/OS 7_\d/i) && !window.navigator.standalone) {
                // alert("inner: " + innerHeight + ", outer: " + window.outerHeight);
                window.scrollTo(0,0);
            }

            
            less.modifyVars({
                /* FIXME: allow em/rem units here, but that requires lots of changes to the handlers. */
                '@screenWidth': window.innerWidth + "px",
                '@screenHeight': window.innerHeight + "px"
            });
            
            if (!iOS || Math.abs(window.orientation) === 90) { // landscape
                
                document.documentElement.style.overflow = '';
                document.body.style.height = '100%';
                
      
                 notesOnly = false;
                _removeClass(document.getElementById('notes'), 'notesonly open');
                _removeClass(document.getElementById('app'), 'notesonly');
                document.getElementById('map').style.display = '';
            }
            else if (iOS)
            { // portrait
                document.documentElement.style.overflow = '';
                document.body.style.height = '100%';
                
                 notesOnly = true;
                _addClass(document.getElementById('notes'), 'notesonly open');
                _addClass(document.getElementById('app'), 'notesonly');
                document.getElementById('map').style.display = 'none'; 
                
            }
        }
        
        function _setKey (key, tlkey) {
            try { 
                localStorage.setItem(key, tlkey);
            } catch(e) {
               return false;
            }
            return true;
        }

        function _getParameterByName(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.search);
            if (results == null) return "";
            else return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    };

    // Based off Lo-Dash's excellent UMD wrapper (slightly modified) - https://github.com/bestiejs/lodash/blob/master/lodash.js#L5515-L5543
	// some AMD build optimizers, like r.js, check for specific condition patterns like the following:
	if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
		// define as an anonymous module
		define(function() {
	  		return new appresent;
		});
		// check for `exports` after `define` in case a build optimizer adds an `exports` object
	}
	else if(typeof module === 'object' && typeof module.exports === 'object') {
		module.exports = new appresent;
	}
	else {
		window.appresent = new appresent;
	}
    
    Object.size = function(obj) {
        var size = 0, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) size++;
        }
        return size;
    };
    
})(this);

/* Modernizr 2.8.1 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-prefixed-testprop-testallprops-domprefixes
 */
;window.Modernizr=function(a,b,c){function w(a){i.cssText=a}function x(a,b){return w(prefixes.join(a+";")+(b||""))}function y(a,b){return typeof a===b}function z(a,b){return!!~(""+a).indexOf(b)}function A(a,b){for(var d in a){var e=a[d];if(!z(e,"-")&&i[e]!==c)return b=="pfx"?e:!0}return!1}function B(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:y(f,"function")?f.bind(d||b):f}return!1}function C(a,b,c){var d=a.charAt(0).toUpperCase()+a.slice(1),e=(a+" "+m.join(d+" ")+d).split(" ");return y(b,"string")||y(b,"undefined")?A(e,b):(e=(a+" "+n.join(d+" ")+d).split(" "),B(e,b,c))}var d="2.8.0",e={},f=b.documentElement,g="modernizr",h=b.createElement(g),i=h.style,j,k={}.toString,l="Webkit Moz O ms",m=l.split(" "),n=l.toLowerCase().split(" "),o={},p={},q={},r=[],s=r.slice,t,u={}.hasOwnProperty,v;!y(u,"undefined")&&!y(u.call,"undefined")?v=function(a,b){return u.call(a,b)}:v=function(a,b){return b in a&&y(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=s.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(s.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(s.call(arguments)))};return e});for(var D in o)v(o,D)&&(t=D.toLowerCase(),e[t]=o[D](),r.push((e[t]?"":"no-")+t));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)v(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof enableClasses!="undefined"&&enableClasses&&(f.className+=" "+(b?"":"no-")+a),e[a]=b}return e},w(""),h=j=null,e._version=d,e._domPrefixes=n,e._cssomPrefixes=m,e.testProp=function(a){return A([a])},e.testAllProps=C,e.prefixed=function(a,b,c){return b?C(a,b,c):C(a,"pfx")},e}(this,this.document);
var _transEndEventNames = {
    'WebkitTransition' : 'webkitTransitionEnd',// Saf 6, Android Browser
    'MozTransition'    : 'transitionend',      // only for FF < 15
    'transition'       : 'transitionend'       // IE10, Opera, Chrome, FF 15+, Saf 7+
};
var _transEndEventName = _transEndEventNames[ Modernizr.prefixed('transition') ];

