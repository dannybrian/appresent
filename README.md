# appresent

Appresent is a JavaScript framework for single-page, animated and zooming presentations. This is *beta* code, lacking complete tests or documentation.
Although I've been using it for several years now in large conference settings, use at your own risk!

<img src="https://raw.githubusercontent.com/dannybrian/appresent/master/preview.png"/>

I will eventually post some demos. For now, features:

* Presentations are driven by a simple JSON "script" that can be controlled by keyboard, swiping, or driven remotely.
* Animations in CSS3, with low-level style manipulation.
* Animations can be time-based or delayed, including reveals, rotations, and pans.
* Presenter controls for syncing, brightness and contrast adjustment, and authentication.
* Simple broadcasting backend in Node.js.

## The Components

There are 3 parts to the presentation framework.

1. An actual presentation. The included example is at `site/myths/index.html`'; this loads the `appresent.js` framework. Notice that the script to guide and animate the presentation is in `site/myths/js/index.js`. You probably want to run this on Chrome, as it makes liberal use of HTML5 and CSS3 features.
2. An optional audience quiz/survey/participation app, at `site/index.html`.
3. An optional Node backend to network everything together, at `server/server.js`.

If all you want it to create a presentation to show on your own computer, just fire up a web server in the `site` directory. Examine `myths/index.html` and `myths/js/index.js`. If you want to be able to survey an audience or control the presentation remotely, you'll also need Node.

## Running

In the `server` directory, install socket.io:

    % npm install socket.io

And run Node:

    % node server.js

You'll need to then run a web server with the `site` directory as document root, that routes upstream WebSocket requests to Node (port 3000). I do this with 
nginx configured thus:

    upstream lastapp {
        server 127.0.0.1:3000;
    }

    server {
        listen 80;
        [...]
        location /node/ {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            proxy_set_header X-NginX-Proxy true;

            proxy_pass http://lastapp/;
            proxy_redirect off;

            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

## Presenting

Notice that the `index.js` for a presentation contains the slide steps, animations, and also all data that get streamed to the audience app. 

Left/right arrow keys on desktop and swipes on mobile will advance the slides. You can also have subslides for reveals and other events; these are trigged with up/down arrows and swipes.

The framework provides a collapsing sidebar for controlling the presentation. You can hide these controls completely by appending The controls from top to bottom perform the following functions:

* Menu bars - Collapse the menu.
* Home icon - Go to slide #0. Hotkey "H". Also hotkey "E" to go to the last slide.
* Key icon - Enter the admin password to control remotely or stream data to audience. The password is set in the `server.js` script.
* Pan icon - Toggle pan mode, where the presentation can be freely panned and zoomed. Useful for presenting on unexpected screen sizes and dimensions, as you can position the slide at the center of the screen (draft) or zoom in our out (hold shift and drag on desktop). The position will "stick" throughout the presentation.
* Speaker icon - Toggle audio on and off, if available.
* Solid bubble icon - Toggle speaker notes on and off.
* Hollow bubble icon - Toggle speaker survey results on and off.
* Refresh icon - Reload the presentation, useful if you package it as a full-screen Cordova app (which I do).
* Eye icon - Reset filters. Below the eye icon are three sliders. These sliders help you to make the presentation look good on any projector, even when you don't have control over its settings.
* Contrast slider - Adjust the contrast with a document-level CSS3 contrast filter.
* Brightness slider - Adjust the brightness with a document-level CSS3 brightness filter.
* Saturation slider - Adjust the saturation with a document-level CSS3 saturation filter.
* Network icon - This is lit when you have a WebSocket connection to Node. The number shows you how many participants are also connected.
 
When opening the presentation in a browser, there are several query string params available to append to your `index.html`:

* `?follow=1` - Disable the presenter UI controls and lock the presentation to follow the presenter. Useful if you deployed the server and want to control the presentation from a tablet or different computer than the one being projected. 
* `?debug=1`  - Outputs lots of debug info to the console, useful for debugging a presentation script.
* `?freetouch=1` - Makes the presentation pannable and zoomable, useful for authoring. Used in conjunction:
* `?author=1&debug=1&freetouch=1` - As you pan the presention, this will output to the console the coordinates and scale which you can copy and paste in to your presentation's `index.js` script to indicate a slide.

## Caveats

There are too many of these to number, which might dissuade you from using the framework. Here are a few:

* The script format is not yet documented, although the `myths/js/index.js` example should give you a good idea how it works.
* The survey widgets are not yet documented, and can be used in various ways. See `server.js` to see how these are limited and organized.
* Simple string password for admin doesn't give you any real security, and the audience doesn't login. I limit their answers based on randomly assigned tokens. This lax security is sufficient for my short presentations, but may not be for yours.
* No authoring tools. You create a big web page, and then you pan/zoom around it to mark your slide locations, copying and pasting the coordinates. But there's nothing here to help you with the creation of the web page itself.
* Very large presentations containing lots of images can crash a browser. I recommend keeping the page under 3000px width and height, and limiting the images. Remember that the browsers transitions animations by caching bitmaps for hardware acceleration, so this can eat up memory quickly — believe me, I've pushed this boundary! Use the Chrome developer tools to see how the rendering actually happens in zones.
* The audience app is not well tested. I know it doesn't work at all on the Android browser, but should on Chrome (all platforms) and Safari.
