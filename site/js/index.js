
/* This file is not necessary to tulito functionality, but is an illustration of 
   how to use tulito.js and tulito.less for handling and triggering of your 
   own custom events. */

document.addEventListener('deviceready', function() {
	StatusBar.overlaysWebView(false);
	StatusBar.hide();
	setTimeout(function() {
		navigator.splashscreen.hide();
	}, 100);
}, false);


var app = new Object;

document.addEventListener('DOMContentLoaded', function() {

//	var optionsMenu = new IScroll( document.querySelector('[data-tulito-id="back-pane-left"]'), { eventPassthrough: false, scrollX: false, scrollY: true, snap: false } );
	
	/*
	Hammer(document.querySelector('#thanks-button')).on("tap", function(e) {
		var loader = document.querySelector('.loader');
		tulito._addClass(loader, 'shown');
		setTimeout(function() {
			tulito._addClass(loader, 'opened');
		}, 1);
		setTimeout(function() {
			tulito._removeClass(loader, 'opened');
			setTimeout(function() { tulito._removeClass(loader, 'shown') }, 500);
			tulito.toggleOpen(document.querySelector('[data-tulito-id="thanks-pane"]'));
		}, 2000);
	});
	*/
	
	// Initialize tulito
	tulito.init(
		{
			onOrientationChange: function (e) {
				// refresh iscroll elements (FIXME: a better way to pass the element that needs a refresh)
			},
			onBackPaneShown: function (node) {
				// refresh iscroll elements
			},
			onHiddenPaneShown: function (node) {

			}
		}
	);
	
	if (tulito.realCordova && deviceready) {
		navigator.splashscreen.hide();
	}
		
	// Automatically open the about pane, once.
	/*
	if (window.localStorage.getItem('notified') !== 'true') {
		setTimeout(function() {
			window.localStorage.setItem('notified', 'true');
			tulito.toggleOpen(document.querySelector('[data-tulito-id="top-pane"]'));
		}, 1500);
	}
	*/

	/* This is our simple cascade implementation. */
	var setctimer = function (el, time) {
		setTimeout(function() {
			tulito._addClass(el, 'shown');				
		}, time);
		
	}
	var cascade = function (pane) {
		var showels = pane.querySelectorAll('.cascade');
		var time = 0;
		for (var i = 0; i < showels.length; ++i) {
			time += 100;
			setctimer(showels[i], time);			
		}
	};
	
	var uncascade = function (pane) {
		var showels = pane.querySelectorAll('.cascade');
		for (var i = 0; i < showels.length; ++i) {
			tulito._removeClass(showels[i], 'shown');
			tulito._removeClass(showels[i], 'selected');			
		}
	};
	/* Cascade any needed contents (those with a .cascade class) when a hidden pane finishes
	   its transition. */
	var panes = document.querySelectorAll('[data-tulito-class="hidden-pane"]');
	for (var i = 0; i < panes.length; ++i) {
		panes[i].addEventListener(_transEndEventName, function(e) {
			var target = e.srcElement || e.target;
			if (target.getAttribute('data-tulito-class') === 'hidden-pane' && e.propertyName.match(/transform$/)) {
				if (tulito._hasClass(target, 'opened')) {
					cascade(target);
				}
				// and reset stuff when it closes.
				else
				{
					uncascade(target);
				}
			}
		}, false);
	}
	
	
}, false);


