(function () {
    let audioCtx = null;
    let gainNode = null;

    let notes = {
        'c4': { name: 'c4', freq: 261.63, osc: null },
        'd4': { name: 'd4', freq: 293.66, osc: null },
        'e4': { name: 'e4', freq: 329.63, osc: null },
        'f4': { name: 'f4', freq: 349.23, osc: null },
        'g4': { name: 'g4', freq: 392, osc: null },
        'a4': { name: 'a4', freq: 440, osc: null },
        'b4': { name: 'b4', freq: 493.88, osc: null },
        'c5': { name: 'c5', freq: 523.25, osc: null },
        'd5': { name: 'd5', freq: 587.33, osc: null },
        'e5': { name: 'e5', freq: 659.25, osc: null },
        'f5': { name: 'f5', freq: 698.46, osc: null },
    };

    let params = new URLSearchParams(window.location.search);

    let paramNotes = [];
    if (params.has('n')) { paramNotes = decodeSong(params.get('n')); }

    let song = {
        notes: paramNotes,
        osc: 'sine',
        currentNoteStart: Date.now(),
        songStart: Date.now(),
    }

    let app = document.getElementById('app');
    let dataElement = document.getElementById('songdata');
    dataElement.textContent = encodeSong(song.notes);

    let playButton = document.getElementById("play");
    playButton.addEventListener("click", playHandler, false);

    let clearButton = document.getElementById("clear");
    clearButton.addEventListener("click", clearHandler, false);

    for (const [key, value] of Object.entries(notes)) {
        console.log("creating", value);
        let keyElement = createKey(value);
        app.appendChild(keyElement);
    }

    function notePressed(event) {
        if (audioCtx == null) { createContext(); }
        if (event.buttons & 1 || event.touches) {
            song.currentNoteStart = Date.now();
            if (song.notes.length == 0) {
                song.songStart = Date.now();
            }
            let id = event.target.id;
            event.target.classList.add("pressed");
            let osc = playNote(notes[id].freq);
            notes[id].osc = osc;
        }
    }

    function noteReleased(event) {
        console.log("released", event);
        let id = event.target.id;
        event.target.classList.remove("pressed");
        let osc = notes[id].osc;
        if (osc !== null) {
            osc.stop();
            notes[id].osc = null;
            song.notes.push({ name: id, start: song.currentNoteStart - song.songStart, length: Date.now() - song.currentNoteStart });
            
        }
        updateState();
    }

    function playNote(freq) {
        console.log("play", freq);
        let osc = audioCtx.createOscillator();
        osc.connect(gainNode);
        osc.type = 'sine';
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
        if (song.notes.length !== 0){ 
            params.set('n', encodeSong(song.notes));
        } else {
            params.delete('n');
        }
        const newRelativePathQuery = window.location.pathname + "?" + params.toString()
        history.pushState(null, "", newRelativePathQuery);
        dataElement.textContent = encodeSong(song.notes);
    }

    function playHandler(event) {
        console.log("play song", song);
        if (audioCtx == null) { createContext(); }
        for (const note of song.notes) {
            setTimeout(() => {
                let osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'sine';
                osc.frequency.value = notes[note.name].freq;
                osc.start();

                setTimeout(() => {
                    osc.stop();
                }, note.length);
            }, note.start);
        }
    }

    function clearHandler(event) {
        console.log("clear song");
        song.notes = [];
        updateState();
    }

    function createKey(note) {
        const keyElement = document.createElement('div');
        keyElement.className = 'key';
        keyElement.id = note.name;
        const labelElement = document.createElement('label');
        labelElement.textContent = note.name;

        keyElement.addEventListener("mousedown", notePressed, true);
        keyElement.addEventListener("touchstart", notePressed, true);
        keyElement.addEventListener("mouseenter", notePressed, true);


        keyElement.addEventListener("mouseup", noteReleased, false);
        keyElement.addEventListener("mouseleave", noteReleased, false);
        keyElement.addEventListener("touchend", noteReleased, false);

        return keyElement;
    }

    function createContext() {
        console.log("creating context");
        audioCtx = new AudioContext();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
        gainNode.gain.value = 0.4;
    }
})();