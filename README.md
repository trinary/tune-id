# It Goes Like...

A tiny little WebAudio synth project that lets you tap out a tune. Minimal library use.

### There are already a billion of those though

I know but I don't really care. I wanted to learn the Web Audio API and mess with Typescript.

### Ok, is there anything interesting about this?

#### Maybe.

The whole song gets encoded into the url every time anything changes. That means you can copy/paste the url anywhere, and anyone following the link will get it and be able to hear your song and change it. No logins, no cookies, no storage, a single static page to host things, audio generated in the browser. Should work on desktop and mobile.

The entire change history of a song lives in your browser history. The page will be hosted on my site, and any time anyone clicks on a link the whole song will be in the server logs. I think that is cool, but maybe it is really lame. It'd be neat if people share little songs in embedded links in chats and social media posts. If one person other than me shares a link with a song the project is a success.

### TODO
* Track-specific controls: add/remove tracks, clear/record a specific track
* Per track synth config: envelope config, waveform, gain
* Master gain/mix and some basic level control. Compression?
* Drum kit track type
    * This will need a new UI probably, so will need to be able to switch UI between notes and drum pads
* drum audio, I have no idea how to do this yet 
* Visualization of tracks/songs
* Metronome during recording
* Better serialization so urls stay as small as possible
* UI much more fun and inviting. Whole thing needs to be super easy to use and look dope as hell
* Make code less bad. lol this will never happen

### Stretch goals
* Snap to beat option for synths
* Edit track UI to adjust notes after recording. This might make the main feature list. Depends a lot on visuals and other UI stuff
* Tremolo, vibrato, LFO-type effects, noise, delay, a zillion different ways to make synths more interesting
* Lean more into being on web. Embedding? Plugins? Simultaneous multi-user sessions? Copy-pasteable individual tracks or instruments?
* Weird stuff: be able to grab samples from somewhere to use as instrument source
* Weirder stuff: instrument definition via a json format or something like that. Send note events to another site to do different things to render audio. Stream things to other places. 
* MIDI in/out
* Export to file
* Version the serialization so changes to audio code can occur without breaking old songs