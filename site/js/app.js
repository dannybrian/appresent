'use strict;'

var io;
var browser;

var lkey = localStorage.lkey;
var privateMode = false;
if (setKey("testme", "test") == false) {
	privateMode = true;
    alert("You browser appears to be in private mode. You will be unable to vote without turning off private mode and reloading.");
}

var debug = _getParameterByName('debug');

document.addEventListener('DOMContentLoaded', function() {
	
	/* var es_list = document.querySelectorAll('*[data-lang="es"]').remove(); // hardcode for now
	for (var i = 0; i < es_list.length; ++i) {
		es_list[i].remove();
	}
	*/
		
    var seenEvents = {}; // keep track to prevent dups
    
	// get the browser details
	
	BrowserDetect.init();
	browser = {
		browser: BrowserDetect.browser.toLowerCase(),
		version: BrowserDetect.version,
		version: BrowserDetect.version,
		os: BrowserDetect.OS
	};

	if (browser.os.toLowerCase() == "android") {
		browser.browser = "android";
	}
	if (browser.browser.toLowerCase() == "explorer") {
		browser.browser = "ie";
	}
	if (browser.browser.toLowerCase() == "mozilla") {
		if (browser.os.toLowerCase() == "an unknown os") {
			browser.browser = "other";
		}
	}

	switch (browser.browser.toLowerCase()) {
	case "android":
		break;
	case "ie":
		break;
	case "chrome":
		browser.browser = "chrome";
		break;
	case "firefox":
		break;
	case "safari":
		break;
	default:
		browser.browser = "other";
	}

	if (/mobile/i.test(navigator.userAgent)) {
		browser.mobile = true;
	}
	if (/webkit.*mobile/i.test(navigator.userAgent)) {
		browser.mobile_safari = true;
	}

	if (browser.browser == "ie" && browser.version < 9) {
		alert("Sorry, but your need IE 9 or better (or a new Chrome or Firefox) for this app to work properly.");
	}

	// connect
	io = io('/danny', { path: '/node/socket.io'} );
	
	io.on('connect', function(data) {
        if (!privateMode) {
            lkey = localStorage.lkey ? localStorage.lkey : io.io.engine.id;
            setKey("lkey", lkey);
            io.emit('key', {
                key: lkey,
                browser: browser
            });
        }
    });
    
    var q1 = document.getElementById("q1");
    q1.addEventListener('keydown', function(ev) {
        if (ev.keyCode == 13) {
            ev.preventDefault();
            io.emit('answer', { answer: q1.value, qgroup: q1.getAttribute('data-qgroup'), key: lkey });
            tulito.toggleOpen(document.getElementById('right-pane-3'));
        }
        return false;
    });
    
    
    // admin content sent to us
    io.on('msg', function(content) {
        
        if (debug) {
            console.log(content);
        }
        
        if (content['_id'] == undefined) {
            if (debug) {
                console.log(content);
            }
        }
        if (debug) {
            console.log('event id: ' + content._id);
        }
        
        if (!debug && seenEvents[content._id]) {
            return;
        } // we can get dups if we reconnect, for example.
        
        for (var key in content) {
               
            switch (key) {
                    
                case 'title':
                    document.getElementsByTagName('title')[0].innerHTML = content['title'];
                    document.getElementById('title').innerHTML = content['title'];
                    break;
                    
                case 'presenters':
                    var template = document.querySelector('[data-template="presenter"]');
                    for (var i = 0; i < content['presenters'].length; i++) {
                        var newpresenter = template.cloneNode();
                        newpresenter.removeAttribute('data-template');
                        newpresenter.innerHTML = content['presenters'][i];
                        template.parentNode.appendChild(newpresenter);
                        tulito.apply(newpresenter);
                    }
                    break;
                    
                case 'twitters':
                    var twitterEl = document.getElementById('twitter-buttons');
                    var twitters = "<span class='twitters'>";
                    for (var i = 0; i < content['twitters'].length; i++) {
                        twitters += '  <a target="_BLANK" href="https://twitter.com/intent/user?screen_name=' + content['twitters'][i] + '"><i class="fa fa-twitter-square fa-lg"></i> @' + content['twitters'][i] + '</a> &nbsp;&nbsp;'; 
                    }
                    twitters += "</span>";
                    twitterEl.innerHTML = twitters;
                    break;
                
                case 'aside':
                    _setAsideText(content.aside);
                    break;

                case 'hide':
                    for (var i = 0; i < content['hide'].length; i++) {
                        var sel = document.getElementById(content['hide'][i]);
                        tulito._removeClass(sel, 'shown');
                        (function(el) { setTimeout(function() {
                            el.style.display = 'none';
                        }, 1000)})(sel);
                     }
                     break;
                    
                case 'show':
                    for (var i = 0; i < content['show'].length; i++) {
                        var sel = document.getElementById(content['show'][i]);
                        sel.style.display = 'inline';
                        (function(el) { setTimeout(function() {
                            tulito._addClass(sel, 'shown');
                        }, 10)})(sel);
                     }
                     break;

                case 'question-prompt':
                    _promptQuestion(content['question-prompt']);
                    
                    break;
                    
                case 'vote-prompt':
                    _promptVote(content['vote-prompt']);
                    
                    break;
                    
                case 'multiple-votes':
                    for (var i = 0; i < content['multiple-votes'].length; i++) {
                        _promptVote(content['multiple-votes'][i]['vote-prompt']);
                    }
                    break;
                
                case 'vote-end':
                    var prompt = content['vote-end'];
                    var el = document.getElementById(prompt.el);
                    if (tulito._getCache(el)._opened) {
                        tulito.toggleOpen(el);
                    }
                    if ('aside' in prompt) {
                        _setAsideText(prompt.aside);
                    }
                    
                    // Remove existing buttons.
                    
                    // This is very frustrating with Webjut. It gets up to the remove node
                    // part, then EXITS this entire function. AND resets the io connection. 
                    // I gave up. And I moved the sendEvents bool to the very end. I also 
                    // moved this removal to vote-end, where before it was in vote-prompt
                    // before adding the new buttons.
                    
                    // I can't explain why this class addition 'removeme' and then a simple
                    // while loop on the old buttons worked where querying off each node's
                    // own classes did not. What I was doing before caused a WebSocket 
                    // disconnect each time, too! But no errors at all from Chrome or 
                    // Safari. Alas.
                    
                    
                    // IMPORTANT: sometimes a vote-end can happen just before a vote-prompt,
                    // resulting in a removal of buttons that just got added (since we reuse
                    // the panes). So it's critical that a live preso alternative between
                    // panes!
                    removeButtons(el);
                    
                    
                    break;

            }

            seenEvents[content._id] = true; 
        }
	});
	
});

var BrowserDetect = {
	init: function() {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function(data) {
		for (var i = 0; i < data.length; i++) {
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1) return data[i].identity;
			} else if (dataProp) return data[i].identity;
		}
	},
	searchVersion: function(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
	},
	dataBrowser: [{
		string: navigator.userAgent,
		subString: "Chrome",
		identity: "Chrome"
	}, {
		string: navigator.userAgent,
		subString: "OmniWeb",
		versionSearch: "OmniWeb/",
		identity: "OmniWeb"
	}, {
		string: navigator.vendor,
		subString: "Apple",
		identity: "Safari",
		versionSearch: "Version"
	}, {
		string: navigator.userAgent,
		substring: "Android",
		identity: "Android",
		versionSearch: "Version"
	},
	{
		prop: window.opera,
		identity: "Opera",
		versionSearch: "Version"
	},
	{
		string: navigator.vendor,
		subString: "iCab",
		identity: "iCab"
	}, {
		string: navigator.vendor,
		subString: "KDE",
		identity: "Konqueror"
	}, {
		string: navigator.userAgent,
		subString: "Firefox",
		identity: "Firefox"
	}, {
		string: navigator.vendor,
		subString: "Camino",
		identity: "Camino"
	}, { // for newer Netscapes (6+)
		string: navigator.userAgent,
		subString: "Netscape",
		identity: "Netscape"
	}, {
		string: navigator.userAgent,
		subString: "MSIE",
		identity: "Explorer",
		versionSearch: "MSIE"
	}, {
		string: navigator.userAgent,
		subString: "Gecko",
		identity: "Mozilla",
		versionSearch: "rv"
	}, { // for older Netscapes (4-)
		string: navigator.userAgent,
		subString: "Mozilla",
		identity: "Netscape",
		versionSearch: "Mozilla"
	}],
	dataOS: [{
		string: navigator.userAgent,
		subString: "android",
		identity: "Android"
	}, {
		string: navigator.platform,
		subString: "Win",
		identity: "Windows"
	}, {
		string: navigator.platform,
		subString: "Mac",
		identity: "Mac"
	}, {
		string: navigator.userAgent,
		subString: "iPhone",
		identity: "iPhone/iPod"
	}, {
		string: navigator.platform,
		subString: "Linux",
		identity: "Linux"
	}]

};

function _promptQuestion (prompt) {
    
    if (debug) {
        console.log(prompt);
    }

    var question = prompt.question;
    var qgroup = prompt.qgroup;
    var el = document.getElementById(prompt.el);
    var qel = el.getElementsByClassName('question-text')[0];
    
    var q1 = document.getElementById("q1");
    q1.setAttribute('data-qgroup', qgroup);
    
    if ('color' in prompt) {
        el.style.backgroundColor = prompt.color;
    }

    qel.innerHTML = question;

    if (debug) {
        console.log("opening " + prompt.el + "?");
    }
    // At last Chrome seems to needs this long for transitionEnd to 
    // register properly.
    setTimeout(function() { tulito.toggleOpen(el) }, 1000);
    
}

function _promptVote (prompt) {

    if (debug) {
        console.log(prompt);
    }

    var question = prompt.question;
    var votegroup = prompt.votegroup;
    var el = document.getElementById(prompt.el);
    var qel = el.getElementsByClassName('question-text')[0];
    var q   = el.getElementsByClassName('question')[0];

    tulito._removeClass(qel, 'smaller'); 
    tulito._removeClass(q, 'smaller'); 
    
    // Setup the buttons. This is an important lesson learned. If you need buttons to change their
    // behavior dynamically in their callback, AND you don't want to have to save and read ALL the data 
    // dynamically from DOM elements (which seems dumb anyway), you need to clone elements. That's because
    // there's no good way to remove a dynamic callback from an event listener. Period.

    // Add new buttons.
    var button_tmpl = el.querySelector('[data-template="button"]');
    for (var i = 0; i < prompt.options.length; i++) {
        var newButton = button_tmpl.cloneNode();
        newButton.removeAttribute('data-template');
        newButton.style.display = 'normal';
        var option = prompt.options[i];
        newButton.innerHTML = option;
        newButton.setAttribute('data-vote', prompt.options[i]);
        newButton.setAttribute('data-votegroup', prompt.votegroup);

        button_tmpl.parentNode.appendChild(newButton);
        if (debug) {
            // console.log("append:");
            console.log(newButton);
        }

        if ('shape' in prompt) {
            tulito._removeClass(newButton, 'square');
            tulito._removeClass(newButton, 'long');
            tulito._addClass(newButton, prompt.shape);
            tulito._addClass(newButton, 'removeme');
            // tulito._addClass(newButton, 'option' + i);
        }

        Hammer(newButton).on('tap', function(e) {
            io.emit('vote', { key: lkey, votegroup: e.target.getAttribute('data-votegroup'), vote: e.target.getAttribute('data-vote') });
            tulito.toggleOpen(el);
            if ('response' in prompt) {
                _setAsideText(prompt.response);
            }
            removeButtons(e.target);
        });

    }

    if ('color' in prompt) {
        el.style.backgroundColor = LightenDarkenColor(prompt.color, -20);
    }

    if (prompt.options.length > 4) {
        tulito._addClass(qel, 'smaller'); 
        tulito._addClass(q, 'smaller'); 
    }
    else if (prompt.options.length > 2) {
        tulito._addClass(qel, 'small');
        tulito._addClass(q, 'smaller'); 
    }
    
    qel.innerHTML = question;

    if (debug) {
        console.log("opening " + prompt.el + "?");
    }
    // At last Chrome seems to needs this long for transitionEnd to 
    // register properly.
    setTimeout(function() { tulito.toggleOpen(el) }, 1000);

}

function _setAsideText (text) {
    var textel = document.getElementById('main-session-text');
    tulito._addClass(textel, 'fade-out');
    setTimeout(function() {					
        textel.innerHTML = text;
    }, 400);
    setTimeout(function() {
        tulito._removeClass(textel, 'fade-out');
    }, 500);
}

function makeSessionId () {
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	tempkey = "";
	for (var i=0; i < 20; i++) {
		tempkey += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return tempkey;
}

function _getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if (results == null) return "";
    else return decodeURIComponent(results[1].replace(/\+/g, " "));
}

function setKey (key, tlkey) {
	try { 
	    localStorage.setItem(key, tlkey);
	} catch(e) {
       return false;
    }
	return true;
}

function removeButtons (el) {
    setTimeout(function() {
        var to_remove = el.getElementsByClassName('removeme');
        var remove_count = to_remove.length;
        while (to_remove.length > 0) {
            to_remove[0].parentNode.removeChild(to_remove[0]);
        }
    }, 1000);
    
}

function LightenDarkenColor(col, amt) {
  
    var usePound = false;
  
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
 
    var num = parseInt(col,16);
 
    var r = (num >> 16) + amt;
 
    if (r > 255) r = 255;
    else if  (r < 0) r = 0;
 
    var b = ((num >> 8) & 0x00FF) + amt;
 
    if (b > 255) b = 255;
    else if  (b < 0) b = 0;
 
    var g = (num & 0x0000FF) + amt;
 
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
 
    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
  
}


