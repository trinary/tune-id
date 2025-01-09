(function () {
    let audioCtx = null;
    let gainNode = null;

    let notes = {
        'f5': { name: 'f5', freq: 698.46, osc: null, noteStart: 0 },
        'e5': { name: 'e5', freq: 659.25, osc: null, noteStart: 0 },
        'd5': { name: 'd5', freq: 587.33, osc: null, noteStart: 0 },
        'c5': { name: 'c5', freq: 523.25, osc: null, noteStart: 0 },
        'b4': { name: 'b4', freq: 493.88, osc: null, noteStart: 0 },
        'a4': { name: 'a4', freq: 440, osc: null, noteStart: 0 },
        'g4': { name: 'g4', freq: 392, osc: null, noteStart: 0 },
        'f4': { name: 'f4', freq: 349.23, osc: null, noteStart: 0 },
        'e4': { name: 'e4', freq: 329.63, osc: null, noteStart: 0 },
        'd4': { name: 'd4', freq: 293.66, osc: null, noteStart: 0 },
        'c4': { name: 'c4', freq: 261.63, osc: null, noteStart: 0 },
    }
    let keymap = {
        'a': 'c4',
        's': 'd4',
        'd': 'e4',
        'f': 'f4',
        'g': 'g4',
        'h': 'a4',
        'j': 'b4',
        'k': 'c5',
        'l': 'd5',
        ';': 'e5',
        '\'': 'f5',
        'w': 'c4',
        'e': 'c4',
        'r': 'c4',
        't': 'c4',
        'y': 'c4',
        'u': 'c4',
        'i': 'c4',
        'o': 'c4',
        'p': 'c4',
    }

    let params = new URLSearchParams(window.location.search);

    let paramNotes = [];
    let playTimeouts = [];
    if (params.has('n')) { paramNotes = decodeSong(params.get('n')); }

    let song = {
        notes: paramNotes,
        songStart: Date.now(),
        recording: false,
    }

    let app = document.getElementById('app');
    let keys = document.getElementById('keys')
    let dataElement = document.getElementById('songdata');
    dataElement.textContent = encodeSong(song.notes);

    let playButton = document.getElementById("play");
    playButton.addEventListener("click", playHandler, false);

    let clearButton = document.getElementById("clear");
    clearButton.addEventListener("click", clearHandler, false);

    let volumeInput = document.getElementById("volume");
    volumeInput.addEventListener("change", volumeHandler, false);

    let waveInput = document.getElementById("wavetype");
    waveInput.addEventListener("change", wavetypeHandler, false);

    for (const [key, value] of Object.entries(notes)) {
        console.log("creating", value);
        let keyElement = createKey(value);
        app.appendChild(keyElement);
    }

    document.body.addEventListener('keydown', keyDownEventHandler, false);
    document.body.addEventListener('keyup', keyUpEventHandler, false);

    function notePressed(event) {
        console.log("pressed", event);
        if (audioCtx == null) { createContext(); }
        if (event.buttons & 1 || event.touches) {
            if (song.notes.length == 0 && !song.recording) {
                song.songStart = Date.now();
                song.recording = true;
            }
            let id = event.currentTarget.id;
            notes[id].noteStart = Date.now();
            event.currentTarget.classList.add("pressed");
            let osc = playNote(notes[id].freq);
            notes[id].osc = osc;
        }
    }

    function noteReleased(event) {
        console.log("released", event);
        let id = event.currentTarget.id;
        event.currentTarget.classList.remove("pressed");
        let osc = notes[id].osc;
        if (osc !== null) {
            osc.stop();
            notes[id].osc = null;
            song.notes.push({ name: id, start: notes[id].noteStart - song.songStart, length: Date.now() - notes[id].noteStart });

        }
        updateState();
    }

    function playNote(freq) {
        console.log("play", freq);
        let osc = audioCtx.createOscillator();
        osc.connect(gainNode);
        osc.type = waveInput.value;
        osc.frequency.value = freq;
        osc.start();
        return osc;
    }

    function encodeSong(input) {
        let encoded = input.map((n) => {
            return n.name + '|' + n.start + '|' + n.length
        });
        return encoded.join('!')
    }

    function decodeSong(input) {
        let noteArray = input.split('!');
        return noteArray.map((n) => {
            let elems = n.split('|');
            return { name: elems[0], start: elems[1], length: elems[2] };
        })
    }

    function updateState() {
        if (song.notes.length !== 0) {
            params.set('n', encodeSong(song.notes));
        } else {
            params.delete('n');
        }
        const newRelativePathQuery = window.location.pathname + "?" + params.toString()
        history.pushState(null, "", newRelativePathQuery);
        dataElement.textContent = encodeSong(song.notes);
    }

    function keyDownEventHandler(event) {
        // TODO deduplicate stuff in here and the click events
        console.log("key pressed", event);

        if (audioCtx == null) { createContext(); }
        if (event.ctrlKey) { return false; }

        let id = keymap[event.key];
        if (id == null) { return; }
        if (song.notes.length == 0 && !song.recording) {
            song.songStart = Date.now();
            song.recording = true;
        }

        notes[id].noteStart = Date.now();

        let noteElement = document.getElementById(id);
        noteElement.classList.add("pressed");
        let osc = playNote(notes[id].freq);
        notes[id].osc = osc;
    }

    function keyUpEventHandler(event) {
        // TODO same
        console.log("key released", event);
        let id = keymap[event.key];
        if (id == null) { return; }
        let noteElement = document.getElementById(id);
        noteElement.classList.remove("pressed");
        let osc = notes[id].osc;
        if (osc !== null) {
            osc.stop();
            notes[id].osc = null;
            song.notes.push({ name: id, start: notes[id].noteStart - song.songStart, length: Date.now() - notes[id].noteStart });
        }
        updateState();

    }

    function playHandler(event) {
        console.log("play song", song);
        if (audioCtx == null) { createContext(); }
        for (const note of song.notes) {
            let timeout = setTimeout(() => {
                let osc = audioCtx.createOscillator();
                let noteElement = document.getElementById(note.name);
                noteElement.classList.add('pressed');
                osc.connect(gainNode);
                osc.type = waveInput.value;
                osc.frequency.value = notes[note.name].freq;
                osc.start();

                let stopTimeout = setTimeout(() => {
                    noteElement.classList.remove('pressed');
                    osc.stop();
                }, note.length);
                playTimeouts.push(stopTimeout);
            }, note.start);
            playTimeouts.push(timeout);
        }
    }

    function clearHandler(event) {
        console.log("clear song");
        song.notes = [];
        song.recording = false;
        for (const timeout of playTimeouts) {
            clearTimeout(timeout);
        }
        // TODO clear currently playing notes in here too
        updateState();
    }

    function volumeHandler(event) {
        console.log("volume", event);
        gainNode.gain.value = event.currentTarget.value;
    }

    function wavetypeHandler(event) {
        console.log("wavetype", event);

    }

    function createKey(note) {
        const keyElement = document.createElement('div');
        keyElement.className = 'key';
        keyElement.id = note.name;
        const labelElement = document.createElement('div');
        labelElement.className = 'label';
        labelElement.textContent = note.name;
        keyElement.append(labelElement);

        keyElement.addEventListener("mousedown", notePressed);
        keyElement.addEventListener("touchstart", notePressed);
        keyElement.addEventListener("mouseenter", notePressed);


        keyElement.addEventListener("mouseup", noteReleased);
        keyElement.addEventListener("mouseleave", noteReleased);
        keyElement.addEventListener("touchend", noteReleased);

        return keyElement;
    }

    function createContext() {
        console.log("creating context");
        audioCtx = new AudioContext();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = volumeInput.value;
    }
})();