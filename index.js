(function () {
    let audioCtx = null;
    let gainNode = null;

    let notes = {
        'c4': {name: 'c4', freq: 261.63, osc: null},
        'd4': {name: 'd4', freq: 293.66, osc: null},
        'e4': {name: 'e4', freq: 329.63, osc: null},
        'f4': {name: 'f4', freq: 349.23, osc: null},
        'g4': {name: 'g4', freq: 392, osc: null},
        'a4': {name: 'a4', freq: 440, osc: null},
        'b4': {name: 'b4', freq: 493.88, osc: null},
        'c5': {name: 'c5', freq: 523.25, osc: null},
        'd5': {name: 'd5', freq: 587.33, osc: null},
        'e5': {name: 'e5', freq: 659.25, osc: null},
        'f5': {name: 'f5', freq: 698.46, osc: null},
    };

    let app = document.getElementById('app');

    for (const [key, value] of Object.entries(notes)) {
        console.log("creating", value);
        let keyElement = createKey(value);
        app.appendChild(keyElement);
    }

    function notePressed(event) {
        if (audioCtx == null) {createContext();}
        console.log("context is ", audioCtx, "gain is ", gainNode);
        console.log("pressed", event);
        let id = event.target.id;
        event.target.classList.add("pressed");
        let osc = playNote(notes[id].freq);
        notes[id].osc = osc;
    }

    function noteReleased(event) {
        console.log("released", event);
        let id = event.target.id;
        event.target.classList.remove("pressed");
        let osc = notes[id].osc;
        if (osc !== null) { osc.stop(); }
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

    function stopNote(freq) {
        console.log("stop", freq);

    }

    function createKey(note) {
        const keyElement = document.createElement('div');
        keyElement.className ='key';
        keyElement.id = note.name;
        const labelElement = document.createElement('h2');
        labelElement.innerHtml = note.name;
        
        keyElement.addEventListener("mousedown", notePressed, false);
        keyElement.addEventListener("mouseup", noteReleased, false);
        keyElement.addEventListener("mouseleave", noteReleased, false);

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