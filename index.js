(function () {
    let audioCtx = null;
    let gainNode = null;

    let notes = {
        'c4': {name: 'c5', freq: 440},
        'd4': {name: 'd5', freq: 440},
        'e4': {name: 'e5', freq: 440},
        'f4': {name: 'f5', freq: 440},
        'g4': {name: 'g4', freq: 440},
        'a4': {name: 'a4', freq: 440},
        'b4': {name: 'b4', freq: 440},
        'c5': {name: 'c5', freq: 440},
        'd5': {name: 'd5', freq: 440},
        'e5': {name: 'e5', freq: 440},
        'f5': {name: 'f5', freq: 440},
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
        playNote(notes[id].freq);
    }

    function noteReleased(event) {
        console.log("released", event);
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