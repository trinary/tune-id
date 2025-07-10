# It Goes Like...

A tiny little WebAudio synth project that lets you tap out a tune.

### There are already a billion of those though

I know but I don't really care. I wanted to learn the Web Audio API and mess with Typescript.

### Ok, is there anything interesting about this?

#### Maybe.

I'm encoding the whole song into the url every time anything changes. That means you can copy/paste the url anywhere, and anyone following the link will get it and be able to hear your song and change it. No logins, no cookies, no storage.

The entire change history of a song lives in your browser history. I'll host the page on my site, and any time anyone clicks on a link the whole song will be in the server logs. I think that is cool, but maybe it is really lame. It'd be neat if people share little songs in embedded links in chats and social media posts.

### TODO
* Track-specific controls: add/remove tracks, clear/record
* Per track synth config: envelope config, waveform
* Drum kit track type
* Visualization of tracks/songs
* Better serialization so urls stay as small as possible
* Make it look fun and inviting to use
* Make code less bad. lol this will never happen