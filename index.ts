import { noteDefinitions } from "./note_definition";
import { keymap } from "./keymap";
import { WaveForm } from "./waveform"

(function () {
    let audioCtx: AudioContext = new AudioContext();
    let gainNode: GainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 1.0;

    enum RecordingStatus {
        Recording,
        Countdown,
        Idle,
    }

    enum TrackType {
        Synth,
        Drum
    }

    class NoteInstance {
        name!: string;
        osc?: OscillatorNode;
        start: number;
        duration: number = 0;

        constructor(name: string, start: number) {
            this.name = name;
            this.start = start;
        }
    }

    class Track {
        notes: NoteInstance[] = [];
        name: string;
        type: TrackType = TrackType.Synth;
        waveform: WaveForm;

        constructor(name: string) {
            this.name = name;
        }
    }

    class Song {
        bpm: number;
        tracks: Track[] = [new Track("lol")];
        recording: RecordingStatus = RecordingStatus.Idle;
        recordingStart?: number;
        trackIndex: number = 0;

        constructor(bpm: number, trackParams: string) {
            this.bpm = bpm;
            this.tracks = this.decode(trackParams);
            if (this.tracks.length == 0) {
                this.tracks.push(new Track("aayyy"));
            }
            this.trackIndex = 0;
        }

        decode(input: string): Track[] {
            let noteArray = input.split('!').filter(s => s);
            let notes: NoteInstance[] = noteArray.map((n) => {
                let elems = n.split('|');
                let name: string = elems[0];
                let start: number = parseInt(elems[1]);
                let duration: number = parseInt(elems[2]);
                let note = new NoteInstance(name, start);
                note.duration = duration;
                return note;
            });
            let track: Track = new Track("llllol");
            console.log("DECODED NOTES", notes);
            track.notes = notes;
            return [track];
        }

        encode(): string {
            let trackNotes: string[] = [];
            for (const track of this.tracks) {
                let encodedNotes = track.notes.map((n) => n.name + '|' + n.start + '|' + n.duration).join('!');
                trackNotes.push(encodedNotes);
            }
            return trackNotes.join('_')
        }
    }


    let activeNotes = new Map<string, NoteInstance>();

    let params = new URLSearchParams(window.location.search);

    let playTimeouts: number[] = [];
    let noteParam: string = params.get('n') ?? "";

    //if (params.has('n')) { paramNotes = decodeSong(params.get('n')); }

    let app = document.getElementById('app');
    let keys = document.getElementById('keys');

    let playButton = document.getElementById("play");
    playButton?.addEventListener("click", playHandler, false);

    let clearButton = document.getElementById("clear");
    clearButton?.addEventListener("click", clearHandler, false);

    let volumeInput = document.getElementById("volume") as HTMLInputElement;
    volumeInput?.addEventListener("input", volumeHandler, false);

    let waveInput = document.getElementById("wavetype") as HTMLInputElement;
    waveInput?.addEventListener("change", wavetypeHandler, false);

    let recordInput = document.getElementById("record");
    recordInput?.addEventListener("click", recordHandler, false);

    let bpmInput = document.getElementById("bpm") as HTMLInputElement;
    bpmInput?.addEventListener("change", bpmHandler);

    document.body.addEventListener('keydown', notePressed, false);
    document.body.addEventListener('keyup', noteReleased, false);
    
    noteDefinitions.forEach((value, key) => {
        let keyElement = createKey(value);
        // TODO: change event handling so we only register one for the whole keyboard
        // Will need to take out handler registration from createKey
        // https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling
        keys?.appendChild(keyElement);
    });

    let song = new Song(140, noteParam); //TODO

    function notePressed(event) {
        createContext();
        console.log("pressed event", event);
        let id:string = "";
        if (event.type == "keydown") { id = keymap[event.key]; }
        else if (event.buttons != 0 || event.touches) {
            id = event.currentTarget.id;
        }

        let noteDef = noteDefinitions.get(id);
        let note = new NoteInstance(id, (Date.now() - song.recordingStart!));

        let noteElement = document.getElementById(id);
        if (noteElement) {noteElement.classList.add("pressed");}

        if (noteDef && !event.repeat) {
            let osc = playNote(noteDef!.freq);
            note.osc = osc;
            activeNotes.set(id, note);
        }
    }

    function noteReleased(event) {
        console.log("released event", event);

        event.currentTarget.classList.remove("pressed");
        let id = "";
        if (event.type == "keyup") { id = keymap[event.key]; }
        else if (event.currentTarget && event.currentTarget.id) {
            id = event.currentTarget.id;
        }

        console.log("released id: ", id);

        if (id && activeNotes.has(id)) {
            let note = activeNotes.get(id)!;
            let noteElement = document.getElementById(id);
            if (noteElement) {noteElement.classList.remove("pressed");}

            note?.osc?.stop();
            note.duration = Date.now() - (song.recordingStart! + note.start);

            if (song.recording == RecordingStatus.Recording) {
                console.log("PUSHED ", note);
                song.tracks[song.trackIndex].notes.push(note);
                updateState();
            }
            activeNotes.delete(id);
        }

    }

    function playNote(freq: number) {
        let osc = audioCtx!.createOscillator();
        osc.connect(gainNode as AudioNode);
        osc.type = waveInput?.value as OscillatorType;
        osc.frequency.value = freq;
        osc.start();
        return osc;
    }

    function updateState() {
        if (song.tracks.length > 0) {
            params.set('n', song.encode());
        } else {
            params.delete('n');
        }
        const newRelativePathQuery = window.location.pathname + "?" + params.toString()
        history.pushState(null, "", newRelativePathQuery);
    }

    function playHandler(event) {
        createContext();
        for (const track of song.tracks) {
            for (const note of track.notes) {
                let timeout = setTimeout(() => {
                    let osc = audioCtx!.createOscillator();
                    let noteName = note.name;
                    console.log("playing ", note);
                    console.log("can I actually play this?!?!?!? ", noteDefinitions.get(noteName));
                    let noteElement = document.getElementById(note.name);
                    if (noteElement != null) { noteElement!.classList.add('pressed'); }
                    osc.connect(gainNode);
                    osc.type = waveInput.value as OscillatorType;
                    osc.frequency.value = noteDefinitions.get(noteName)!.freq;
                    osc.start();
                    osc.stop(audioCtx.currentTime + (note.duration / 1_000));

                    let stopTimeout = setTimeout(() => {
                        noteElement!.classList.remove('pressed');
                        //                        osc.stop();
                        // TODO can we get rid of this stuff entirely? Need to remove the pressed class when the note is done but the osc can control
                        // note length all on its own.
                    }, note.duration);
                    playTimeouts.push(stopTimeout);
                }, note.start);
                playTimeouts.push(timeout);

            }
        }
    }

    function clearHandler(event: Event) {
        song.tracks = [new Track("aaaa")];
        song.trackIndex = 0;
        song.recording = RecordingStatus.Idle;
        for (const timeout of playTimeouts) {
            clearTimeout(timeout);
        }
        activeNotes.clear();
        updateState();
    }

    function volumeHandler(event: Event) {
        gainNode.gain.value = Number((event.currentTarget as HTMLInputElement)?.value);
    }

    function wavetypeHandler(event) {
    }

    function recordHandler(event) {
        if (song.recording == RecordingStatus.Recording) {
            song.recording = RecordingStatus.Idle;
            recordInput?.classList.remove("recording");
        } else if (song.recording == RecordingStatus.Countdown) {
            song.recording = RecordingStatus.Idle;
            recordInput?.classList.remove("countdown");
            // TODO this gonna break the metronome clicks
        } else {
            let playClick = (go) => {
                console.log("clickin");
                let osc = audioCtx.createOscillator();
                osc.connect(gainNode);
                osc.type = 'square';
                osc.frequency.value = 880;
                osc.start();
                osc.stop(audioCtx.currentTime + 0.05); // 100ms click;
                if (go) {
                    // actually start recording
                    recordInput?.classList.remove("countdown");
                    recordInput?.classList.add("recording");
                    song.recording = RecordingStatus.Recording;
                    song.recordingStart = Date.now();
                }
            }

            recordInput?.classList.add("countdown");
            // 4-click countdown at correct bpm
            // trigger recording state change at 0
            // set startrecording time
            // 140 beats/minute -> 1/140 minutes/beat -> 60/140 seconds/beat
            let osc = audioCtx.createOscillator()
            let interval = Number(60_000 * (1 / song.bpm)); // milliseconds
            console.log("click countdown interval ", interval);
            setTimeout(playClick, 0 * interval, false);
            setTimeout(playClick, 1 * interval, false);
            setTimeout(playClick, 2 * interval, false);
            setTimeout(playClick, 3 * interval, true);
        }
    }

    function bpmHandler(event) {
        song.bpm = event.currentTarget.value;
    }

    function createKey(note) {
        const containerElement = document.createElement('div');
        containerElement.classList.add('key_container');
        const keyElement = document.createElement('div');
        keyElement.classList.add('key');
        keyElement.id = note.name;

        // TODO: Don't do this on each key, do it on a container div and delegate
        keyElement.addEventListener("mousedown", notePressed);
        keyElement.addEventListener("touchstart", notePressed);
        keyElement.addEventListener("mouseenter", notePressed);


        keyElement.addEventListener("mouseup", noteReleased);
        keyElement.addEventListener("mouseleave", noteReleased);
        keyElement.addEventListener("touchend", noteReleased);

        return keyElement;
    }

    function createContext() {
        audioCtx.resume().then(() => console.log("resumed"));
    }
})();