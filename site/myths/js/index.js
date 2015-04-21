document.addEventListener('deviceready', function() {
	StatusBar.overlaysWebView(false);
	StatusBar.hide();
	setTimeout(function() {
		navigator.splashscreen.hide();
	}, 100);
}, false);


var app = new Object;

document.addEventListener('DOMContentLoaded', function() {

// Left and right swipes navigate through top-level events.
// Up and down swipes navigate through 'sub' events, of which there can only be one level.
// Sub events do not repeat or reverse, making it easier to navigate back and forth without
// changing the presentation state. So, treat sub events as stateful, and top-level events
// as purely navigation.

// MPOS IS BAD! Gonna deprecate it. Don't use it.
// And ALWAYS AUTHOR targeting 1024x768. This will let coordinates scale properly.
    
// mpos is "XPOSxYPOS" relative to the middle of the map. So 0x0 is centered. These are in 
// pixels of the FULL SIZE image. But this is a risky thing to use, as the window dimensions
// may change. I haven't debugged some of its problems yet.
//
// mscale is a relative scale, a multiple of fullScale; that is, scale=1 is the full map in
// view, not CSS scale.
//
// You can instead use pos and scale for an absolute from top-left 0x0 and scale.
//
// Subevents are an array within the event array.
//
// I need to clean up this structure a little, but here's how it goes:
//    - init() gets a script array as the second arg
//    - the array is a deck of presentation events
//    - each event is a "slide", an array of either hashes or arrays:
//        - the hashes are events triggered at once
//        - an array within the slide is a list of "subevents" which the presenter must
//          trigger with a swipe up or down
//        - the subevent may also contain hashes or array of hashes, but the behavior 
//          here is the opposite: hashes are each a manual subevent; an array of hashes
//          will all be triggered together at once.
//    - confused?
// 
// alwaysDo: true causes things to always get triggered when a slide advances (say, a subevent
//           was not triggered, ot a reload to a later slide occurred).
// ignoreAfter: true means an event will only get triggered once, and not again on a return to 
// that event.
    

var timer = '2:00';
var bandwidth = 'low';


appresent.init({},
    [
        // title
        [
            { meta: { title: 'Mobile App Dev Myths', presenters: [ "Danny Brian", "Kirk Knoernschild" ], reqvotes: 9, numwinners: 2,
                     twitters: [ "dannybrian", "pragkirk" ], aside: "Welcome to our session, and thanks for following along!", reset: true }, ignoreAfter: true },
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 3.5, pos: '-4822x-3840', transtime: 1000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "0", transtime: 1000 },
            { send: { show: ['twitter-buttons'], aside: 'Welcome to our session, and thanks for following along!' }},
            { notes: [ "Welcome.", "Kirk: We know you have other options.","Danny: Like the beach!" ] }
        ],

        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 3.5, pos: '-4866x-4375', transtime: 1000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "2", transtime: 1000 },
            [ { show: 'app-pic', alwaysDo: true }, { show: 'lootcrate-pic', alwaysDo: true },
             //{ hide: 'lootcrate-pic' }, { hide: 'app-pic' }
            ],
            { notes: ["↑ Danny: You’ll get an HTML5 app to give your opinion about each myth. Please use a modern browser: Safari on iOS or Chrome on Android should work.",
                      "Kirk: The fun part is that we'll reveal the voting results before our are conclusion, and we’ll see whether or not you agree with us.",
                      "Danny: And we’ll have a timer of 2 minutes per myth on the screen to keep us on track. Answer each question.",
                      "Kirk: You can cast your votes any time before that timer expires.",
                      "↑ Danny: Prizes!"
             ]}
        ],

        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 3.82, pos: '-5370x-5336', transtime: 1000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "0", transtime: 1000 },
            { notes: [ "What's up with the photo? We're right here.", "But we look cool and we don’t have time for a wardrobe change during our presentations.", "Plus we’ve been told we have a resemblance to some celebrity duo. We can’t remember who that is, but any likeness is coincidental."] },
            { send: { hide: ['twitter-buttons'], aside: "We're totally <b>not</b> talking about Mythbusters.<br/><br/><img src='2014/myths/images/who.jpg' style='width: 80%;'/>" }, delay: 10000 }

        ],

        // questions
        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 4.1, pos: '-5760x-6461', transtime: 1000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-1", transtime: 1000 },
            { notes: [ "Our goal: leave here with a nice snapshot of app dev myths.", "A \"myth\" is something that might lack a lot of evidence one way or another.", "Since we get so much client interaction ... we can give you some perspective on these myths.", "We don’t completely agree on this stuff. You might even see some heated debate."] },
            { send: { show: ['twitter-buttons'], aside: "Our real goal is just to have some fun and talk about interesting things." }, delay: 5000 }
        ],

        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 5.54, pos: '-7974x-7108', transtime: 1000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-2", transtime: 1000 },
            { notes: ["URL reminder."] }
        ],

        // full view
        /*[
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', mscale: 1.5, mpos: '0x0', transtime: 4000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-5", transtime: 4000 }
        ],*/

        // myth #1
        [
            { el: 'body', addclass: 'green', rmclass: 'yellow red blue' },
            { el: 'map', scale: 3.6, pos: '-7675x-5113', transtime: 2200 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "75", transtime: 1200 },
            { el: 'myth1-timer', start: '3:00', ignoreAfter: true },
            { send: { hide: ['twitter-buttons']}, doAlways: true },
            { send: { aside: "Time to vote. True or false?" }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth1", question: "HTML5 can't deliver a great mobile UX.", el: "left-pane", shape: "square", options: ["True", "False"], color: "#618F5B" , response: "Thanks. Let's see if HTML5 is up to the task." }}, delay: 3000, ignoreAfter: true },
            [ 
              { show: 'myth1-video-1', addvideo: 'video/html5ux-1-' + bandwidth + '.mp4', width: 640, height: 360 },
              { hide: 'myth1-video-1', rmvideo: true },
              { show: 'myth1-video-2', addvideo: 'video/html5ux-2-' + bandwidth + '.mp4', width: 640, height: 360 },
              { hide: 'myth1-video-2', rmvideo: true },
              { show: 'myth1-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth1", el: "left-pane", aside: "We call this one false." }, ignoreAfter: true } },
              { show: 'myth1-votes-tally', votegroup: 'myth1', tallyvote: 'False' },
            ],
            { notes: ["<b>Kirk leads, agreeing with myth. He will be WRONG. It's FALSE.</b>",
                      "↑ We’ve got a video to help us introduce this one, so it got more than 2 minutes.",
                      "Kirk: There are other ways we could phrase this. The browser is dead! You need native technologies to pull this off.",
                      "Danny: This comes from the fact that the mobile Web sucked. Still does in most cases. It's developers' fault. Hybrid addresses most shortcomings.",
                      "Kirk: No video for most of these.",
                      "↑ Wrap it up with video."
                ] }
        ],
        // myth #2
        [
            { el: 'body', addclass: 'yellow', rmclass: 'green red blue' },
            { el: 'map', scale: 3.4, pos: '-7194x-4669', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "35", transtime: 1500 },
            { el: 'myth2-timer', start: timer, ignoreAfter: true },
            { send: { aside: "Serious mobile apps:<br/><br/><i>Apps with no sense of humor.</i>" }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth2", question: "You need a vendor MADP for serious mobile app development.", el: "right-pane", shape: "square", options: ["True", "False"], color: "#C49935" , response: "Votes are being counted. Seriously." }}, delay: 3000, ignoreAfter: true },
            [ 
                { show: 'myth2-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth2", el: "right-pane", aside: "False.<br/><br/>(In our opinion.)" }, ignoreAfter: true } },
                { show: 'myth2-votes-tally', votegroup: 'myth2', tallyvote: 'False' },
            ],
            { notes: [
                "<b>Kirk leads, agreeing with myth. He will be WRONG. It's FALSE.</b>",
                "Danny: You need a MADP to build serious mobile apps — apps that will be polished and maintainable.",
                "We’re talking here about platforms like Kony, IBM Worklight, and Appcelerator.",
                "Kirk: This one is a bit tough because it’s so tied to your own org culture … and depends on the types of applications and skills of your developers.",
                "What about security? Stores? Enterprisey stuff?"
            ]}

        ],
        // myth #3
        [
            { el: 'body', addclass: 'blue', rmclass: 'green red yellow' },
            { el: 'map', scale: 3.7, pos: '-7866x-5101', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-1", transtime: 1500 },
            { el: 'myth3-timer', start: timer, ignoreAfter: true },
            { send: { aside: "A \"single platform\" here means just one device or device operating system." }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth3", question: "Targeting a single platform removes the need to build multi-channel Web apps.", el: "bottom-pane", shape: "square", options: ["True", "False"], color: "#2F579C" , response: "Stand by." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth3-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth3", el: "bottom-pane", aside: "(What, are these all false?)" }, ignoreAfter: true } },
                { show: 'myth3-votes-tally', votegroup: 'myth3', tallyvote: 'False' },   
            ],
            { notes: [
                 "<b>Kirk leads, agreeing with myth. He will be WRONG. It's FALSE.</b>",
                "Kirk: If I need an iOS app, and that’s all I need, then I really don’t need to worry about multichannel Web.",
                "Danny: Let’s say you really don’t care about mobile Web. A \"single channel\" — heck, let’s even say it’s not just iOS, but ONLY iPhone, not even iPad — you still have many different device dimensions to worry about. Still multichannel.",
                "Also if you have a Web site, you have a multichannel Web app.",
                "UX and brand and apps."
            ]}
        ],
        // myth #4
        [
            { el: 'body', addclass: 'red', rmclass: 'green blue yellow' },
            { el: 'map', scale: 3.7, pos: '-7874x-5016', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-38", transtime: 1500 },
            { el: 'myth4-timer', start: timer, ignoreAfter: true },
            { send: { aside: "The mobile Web. Again. What do you think? Portable?" }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth4", question: "Web technologies give you highly portable apps.", el: "left-pane", shape: "square", options: ["True", "False"], color: "#B84646" , response: "The app we're using is portable. Mostly.<br/><br/>Danny wrote it from scratch." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth4-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth4", el: "left-pane", aside: "Relatively speaking, HTML5 is pretty portable.<br/><br/>Really." }, ignoreAfter: true } },
                { show: 'myth4-votes-tally', votegroup: 'myth4', tallyvote: 'True' },
            ],
             { notes: [
                 "<b>Danny leads, agreeing with myth. He will be RIGHT. It's TRUE.</b>",
                 "Danny: One of my favorites. You get more portable apps with Web technologies than with native technologies.",
                 "Kirk: What I don’t like about this myth is that it gives people the idea that the Web is write-once-run-everywhere.",
                 "And it’s far from that. You need to test constantly and have many browsers to target.",
                 "Even if you go hybrid, you still have to test everywhere because every device’s WebView is the same."
            ]}
        ],
        // myth #5
        [
            { el: 'body', addclass: 'yellow', rmclass: 'green blue red' },
            { el: 'map', scale: 3.7, pos: '-7881x-4981', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-76", transtime: 1500 },
            { el: 'myth5-timer', start: timer, ignoreAfter: true },
            { send: { aside: "What about cross platform frameworks?" }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth5", question: "Cross platform frameworks negate the need to use the native toolset.", el: "right-pane", shape: "square", options: ["True", "False"], color: "#C49935" , response: "Wouldn't it be great if you never had to touch the native tools?" }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth5-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth5", el: "right-pane", aside: "Sorry. No escaping 'em." }, ignoreAfter: true } },
                { show: 'myth5-votes-tally', votegroup: 'myth5', tallyvote: 'False' },
            ],
             { notes: [
                "<b>Danny leads, agreeing with myth. He will be WRONG. It's FALSE.</b>",
                "Kirk: This myth is about whether or not teams need to use the native toolset if you use a cross-platform framework like appcelerator titaniuim.",
                 "The myth is that you don’t, and that it saves you having to worry about all the native tools.",
                 "Danny: That would be nice, if it were true. Even if you work with a high-level build in the cloud like PhoneGap Build, you still need the native toolsets to do app store submissions.",
                 "And even if that weren’t true, you’d be unwise to not use the native toolsets for low-level work tweaking your apps."
             ]}
        ],
        // myth #6
        [
            { el: 'body', addclass: 'green', rmclass: 'yellow blue red' },
            { el: 'map', scale: 3.7, pos: '-7899x-5085', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-109", transtime: 1500 },
            { el: 'myth6-timer', start: timer, ignoreAfter: true },
            { send: { aside: "This is myth 6 of 10. We're just past half. Try to ignore your daughter's texts for a few more minutes." }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth6", question: "Developers with Web design experience will find it easy to build mobile apps with HTML5.", el: "left-pane", shape: "square", options: ["True", "False"], color: "#618F5B" , response: "Wow, that's not what I would have said." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth6-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth6", el: "left-pane", aside: "HTML5, CSS3, JavaScript frameworks? A new world." }, ignoreAfter: true } },
                { show: 'myth6-votes-tally', votegroup: 'myth6', tallyvote: 'False' },
            ],
             { notes: [
                 "<b>Danny leads, agreeing with myth. He will be WRONG. It's FALSE.</b>",
                 "Danny: Before HTML5, it really wasn’t possible for Web developers to build great mobile apps. But now that we have HTML5, it’s easy to do.",
                 "This is great because it means we can take our Web teams and without teaching them new tricks, they can create great mobile apps.",
                 "Kirk: That’s hilarious. And totally disproven by the mobile Web apps we see today."
             ]}
        ],
        // myth #7
        [
            { el: 'body', addclass: 'blue', rmclass: 'yellow green red' },
            { el: 'map', scale: 3.7, pos: '-7887x-5242', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-142", transtime: 1500 },
            { el: 'myth7-timer', start: timer, ignoreAfter: true },
            { send: { aside: "Write once? Run everywhere?" }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth7", question: "Write once, run everywhere is a pipe dream and will remain so forever.", el: "right-pane", shape: "square", options: ["True", "False"], color: "#2F579C" , response: "Alright. Let's see if everybody else is that deluded." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth7-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth7", el: "right-pane", aside: "Don't despair. This is what makes developers valuable." }, ignoreAfter: true } },
                { show: 'myth7-votes-tally', votegroup: 'myth7', tallyvote: 'True' },
            ],
             { notes: [
                 "<b>Danny leads, disagreeing with myth. He will be WRONG. It's TRUE.</b>",
                 "Kirk: There aren’t many good reasons to use HTML5, but portability is definitely one of them. But this myth is that we'll never get total portability.",
                 "Danny: I think the portability is valid but it’s really oversold. Responsive design means code might be more portable, but as we already said, it’s not write-once-run-everywhere. Especially not to be great.",
                 "Deployment flexibility to me is a bigger benefit of HTML5.",
                 "As long as devices and platforms evolve, how could we ever get write once?"
             ]}
        ],
        // myth #8
        [
            { el: 'body', addclass: 'yellow', rmclass: 'yellow green blue' },
            { el: 'map', scale: 3.7, pos: '-7897x-5204', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-179", transtime: 1500 },
            { el: 'myth8-timer', start: timer, ignoreAfter: true },
            { send: { aside: "This next one is fun." }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth8", question: "An HTML5 app wrapped in a WebView control is likely to be rejected by the app store.", el: "bottom-pane", shape: "square", options: ["True", "False"], color: "#B84646" , response: "Tough one. Let's wait and see what the group thought." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth8-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth8", el: "bottom-pane", aside: "Surprising, right?" }, ignoreAfter: true } },
                { show: 'myth8-votes-tally', votegroup: 'myth8', tallyvote: 'False' },
            ],
             { notes: [
                "<b>Kirk leads, agreeing with myth. Danny argues. It's FALSE.</b>",
                "Tell story of Kirk at Catalyst, winning the bet."
             ]}
        ],
        // myth #9
        [
            { el: 'body', addclass: 'green', rmclass: 'yellow red blue' },
            { el: 'map', scale: 3.7, pos: '-7897x-5204', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-214", transtime: 1500 },
            { el: 'myth9-timer', start: timer, ignoreAfter: true },
            { send: { aside: "Back to native apps now." }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth9", question: "Native mobile technologies are difficult to learn.", el: "right-pane", shape: "square", options: ["True", "False"], color: "#618F5B" , response: "If this weren't a myth session, we'd survey to see how many have used the native tools." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth9-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth9", el: "right-pane", aside: "Our answer here is relative. Sure, the native tools will be hard for <i>some people</i>." }, ignoreAfter: true } },
                { show: 'myth9-votes-tally', votegroup: 'myth9', tallyvote: 'False' },
            ],
             { notes: [
                "<b>Danny leads, agreeing with myth. He will be WRONG, it's FALSE.</b>",
               "Kirk: Not only do I need to learn a completely foreign toolset, but I also have to learn new programming languages, and sometimes work in totally foreign editors and environments and even operating systems.",
                "Danny: I'll buy that. But look, what new technology doesn’t require developers to step up their game? Are we really so lazy as to expect developers to never learn new stuff?",
                "ANY great app requires developers to learn new stuff. Take HTML5 and JavaScript. Old-school Web developers have a lot to learn in order to build single-page applications.",
                "Exception: When it involves many platforms?"
             ]}
        ],
        // myth #10
        [
            { el: 'body', addclass: 'yellow', rmclass: 'green red blue' },
            { el: 'map', scale: 3.7, pos: '-7897x-5204', transtime: 2000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-250", transtime: 1500 },
            { el: 'myth10-timer', start: timer, ignoreAfter: true },
            { send: { aside: "Final myth." }, ignoreAfter: true },
            { send: { "vote-prompt": { votegroup: "myth10", question: "Apps are different from applications.", el: "bottom-pane", shape: "square", options: ["True", "False"], color: "#C49935" , response: "We really hope you agree with us on this one." }}, delay: 3000, ignoreAfter: true },
            [
                { show: 'myth10-answer', alwaysDo: true, send: { "vote-end": { votegroup: "myth10", el: "bottom-pane", aside: "Somebody said, \"apps are things that fix problems. Applications are things that cause problems.\"<br/><br/>Seems about right." }, ignoreAfter: true } },
                { show: 'myth10-votes-tally', votegroup: 'myth10', tallyvote: 'True' },
            ],
             { notes: [
                "<b>Kirk leads, disagreeing with myth. Hw ill be WRONG, it's TRUE.</b>",
                "Danny: We can’t think about apps as small applications. There’s  a lot more to it. If you’ve read any of my research on this, you probably have an advantage on this one.",
                "Kirk: Dude nobody reads your research.",
                "Danny: Yes I'm the redheaded stepchild. But they do like my presentations."
             ]}
        ],

        // full view 15
        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', pos: '-243x-383', scale: 0.5, transtime: 2000 },
            //{ el: 'map', mscale: 1.5, mpos: '0x0', transtime: 4000 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-5", transtime: 4000 },
            { send: { aside: "" }, ignoreAfter: true },
            { el: 'circle', addclass: 'final', alwaysDo: true },
            { notes: [
              "So those are our myths. Let's see how our opinion compared to the audience."
            ]}
        ],

        // winner 16
        [
            { el: 'map', scale: 1.68, pos: '-1494x-2232', transtime: 1500 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-1", transtime: 1500 },
            { show: 'winner', alwaysDo: true, tallyaverage: true },
            { send: { aside: "Danny is giving these Loot Crates away in all his presentations." }, ignoreAfter: true },
            { 'admin-msg': { 'get-winners': true, 'send-codes': true }, delay: 6000 },
            { notes: [ "We have a winner for the voting. Come get your loot crate now! You have a code displayed on your device." ] }
        ],

        // recommendations 17
        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 3.4, pos: '-5777x-4212', transtime: 1500 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-1", transtime: 2500 },
            { show: 'recommendations', alwaysDo: true },
            [
                { show: 'recommend1', ignoreAfter: true, alwaysDo: true },
                [
                    { show: 'recommend2', ignoreAfter: true, alwaysDo: true },
                    { el: 'map', scale: 3.4, pos: '-5808x-4450', transtime: 1000 },
                ],
                [
                    { show: 'recommend3', ignoreAfter: true, alwaysDo: true },
                    { el: 'map', scale: 3.4, pos: '-5830x-4791', transtime: 1000 },
                ],
                [
                    { show: 'recommend4', ignoreAfter: true, alwaysDo: true },
                    { el: 'map', scale: 3.4, pos: '-5845x-5030', transtime: 1000 },
                ],
                [
                    { el: 'map', scale: 1.62, pos: '-2534x-1999', transtime: 1500 },
                    { el: 'recommendations', addclass: 'backed', alwaysDo: true }
                ]
            ],
            { notes:
             [
                 "<b>Kirk, then Danny.</b>",
                 "Let's look at some specific recommendations to take away from these myths.",
                 "↑ Look closely at MADPs to match your requirements ...",
                 "↑ Stop thinking in Web versus native terms. You need both.",
                 "↑ No investment in Web competency will be wasted.",
                 "↑ Great UX needs investment beyond the platform."
             ]
            }
        ],

        // related research
        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', scale: 2.4, pos: '-3246x-4202', transtime: 1500 },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-2", transtime: 2500 },
            { show: 'research', alwaysDo: true },
            { send: { show: ['twitter-buttons'], aside: "This research is also listed in the PDF for the presentation." }, ignoreAfter: true },
            { notes: [ "Some recommended research.",
                      "We won't read through it, but many of these myths are either confirmed or denied in these documents.",
                      "Interactive Nexus presentation tomorrow morning, and interactive HTML5 presentation Wednesday morning."
                     ]
            }
        ],

        // give us a 5!
        [
            { el: 'body', rmclass: 'green red blue yellow' },
            { el: 'map', pos: '-243x-383', scale: 0.5, transtime: 2000 },
            // { el: 'map', mscale: 1.5, mpos: '0x0', transtime: 2000 },
            { el: 'title', addclass: 'ended' },
            { el: 'rot-container', scale: 1, pos: '0x0', origin: '50% 50%', rotation: "-1", transtime: 3000 },
            { el: 'circle', addclass: 'final' },
            { send: { aside: "Please give our session a 5.0!<br/><br/>And thanks again for using the app." }, ignoreAfter: true },
            { notes: [ "Your rating for this session really helps us to continue to innovate the format and content. Please rate this session!" ] }   
        ]
    ]);

}, false);

