# appresent

Appresent is a JavaScript framework for single-page, animated and zooming presentations. This is *beta* code, lacking complete tests or documentation.
Although I've been using it for several years now in large conference settings, use at your own risk!

I will eventually post some demos. For now, features:

* Presentations are driven by a simple JSON "script" that can be controlled by keyboard, swiping, or driven remotely.
* Animations in CSS3, with low-level style manipulation.
* Animations can be time-based or delayed, including reveals, rotations, and pans.
* Presenter controls for syncing, brightness and contrast adjustment, and authentication.
* Simple broadcasting backend in Node.js.

## The Components

There are 3 parts to the presentation framework.

1. An actual presentation. The included example is at `site/myths/index.html`'; this loads the `appresent.js` framework. Notice that the script to guide and animate the presentation is in `site/myths/js/index.js`.
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

The framework provides a sidebar for controlling the presentation.

