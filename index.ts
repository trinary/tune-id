import { NoteDefinition, noteDefinitions, NoteInstance } from "./src/models/note";
import { keymap } from "./src/models/keymap";
import { Song } from "./src/models/song";
import { Track, TrackType } from "./src/models/track";
import { RecordingStatus } from "./src/models/control";

(function () {
    let audioCtx: AudioContext = new AudioContext();
    let gainNode: GainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 1.0;

    let activeNotes = new Map<string, NoteInstance>();

    let params = new URLSearchParams(window.location.search);

    let noteParam: string = params.get('n') ?? "";

    let app = document.getElementById('app');
    let keys = document.getElementById('keys');
    let tracks = document.getElementById('tracks');

    let playButton = document.getElementById("play");
    playButton?.addEventListener("click", playHandler, false);

    let clearButton = document.getElementById("clear");
    clearButton?.addEventListener("click", clearHandler, false);

    let volumeInput = document.getElementById("volume") as HTMLInputElement;
    volumeInput?.addEventListener("input", volumeHandler, false);

    let recordInput = document.getElementById("record");
    recordInput?.addEventListener("click", recordHandler, false);

    let bpmInput = document.getElementById("bpm") as HTMLInputElement;
    bpmInput?.addEventListener("change", bpmHandler);

    let newTrackButton = document.getElementById("new-track") as HTMLButtonElement;
    newTrackButton?.addEventListener("click", addTrackHandler);

    let trackList = document.getElementById("tracks");
    trackList?.addEventListener("click", selectTrackHandler);

    document.body.addEventListener('keydown', notePressed, false);
    document.body.addEventListener('keyup', noteReleased, false);

    noteDefinitions.forEach((value, key) => {
        let keyElement = createKey(value);
        // TODO: change event handling so we only register one for the whole keyboard
        // Will need to take out handler registration from createKey
        // https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling
        keys?.appendChild(keyElement);
    });

    let song = new Song(140, noteParam, document.querySelector("#tracks")!);

    function notePressed(event: MouseEvent | KeyboardEvent | TouchEvent) {
        createContext();
        let id: string = "";

        // TODO: extract common logic for pressed/released -> id
        if (isKeyboardEvent(event)) { 
            id = keymap.get(event.key)!; 
        }
        else if (isMouseEvent(event)) {
            id = (<HTMLElement>event.target!).id; 
        } else {
            id = (<HTMLElement>event.target!).id;
        }

        console.log("pressed ", id, event);
        let noteDef = noteDefinitions.get(id);
        let note = new NoteInstance(id, (Date.now() - song.recordingStart!));

        let noteElement = document.getElementById(id);
        if (noteElement) { noteElement.classList.add("pressed"); }

        if (noteDef && 
                (((isKeyboardEvent(event) && !event.repeat)) || 
                  (isMouseEvent(event) && event.buttons == 1) || 
                  (isTouchEvent(event) && event.touches))) {
            let osc = playNote(noteDef!.freq);
            note.osc = osc;
            activeNotes.set(id, note);
        }
    }

    function noteReleased(event: MouseEvent | KeyboardEvent | TouchEvent) {
        console.log("released ", event);
        (<HTMLElement>event.currentTarget!).classList.remove("pressed");
        let id = "";
        if (isKeyboardEvent(event)) { id = keymap.get(event.key)!; }
        else {
            id = (<HTMLElement>event.target!).id;
        }

        if (id && activeNotes.has(id)) {
            let note = activeNotes.get(id)!;
            let noteElement = document.getElementById(id);
            if (noteElement) { noteElement.classList.remove("pressed"); }

            note?.osc?.stop();
            note.duration = Date.now() - (song.recordingStart! + note.start);

            console.log(song.tracks, song.activeTrackIndex);
            if (song.recording == RecordingStatus.Recording) {
                song.tracks[song.activeTrackIndex]!.notes.push(note);
                updateState();
            }
            activeNotes.delete(id);
        }

    }

    function playNote(freq: number) {
        let osc = audioCtx!.createOscillator();
        osc.connect(gainNode as AudioNode);
        let waveform = song.tracks[song.activeTrackIndex]!.waveform.shape;
        osc.type = waveform;
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

    function playHandler(event: Event) {
        song.play(audioCtx, gainNode);
    }

    function clearHandler(event: Event) {
        song.clear();
        activeNotes.clear();
        updateState();
    }

    function volumeHandler(event: Event) {
        gainNode.gain.value = Number((event.currentTarget as HTMLInputElement)?.value);
    }

    function recordHandler(event: Event) {
        if (song.recording == RecordingStatus.Recording) {
            song.recording = RecordingStatus.Idle;
            recordInput?.classList.remove("recording");
        } else if (song.recording == RecordingStatus.Countdown) {
            song.recording = RecordingStatus.Idle;
            recordInput?.classList.remove("countdown");
            // TODO this gonna break the metronome clicks
        } else {
            let playClick = (go: boolean) => {
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

            let interval = Number(60_000 * (1 / song.bpm)); // milliseconds
            setTimeout(playClick, 0 * interval, false);
            setTimeout(playClick, 1 * interval, false);
            setTimeout(playClick, 2 * interval, false);
            setTimeout(playClick, 3 * interval, true);
        }
    }

    function bpmHandler(event: any) {
        song.bpm = bpmInput.value as unknown as number;
    }

    function addTrackHandler(this: HTMLButtonElement, ev: MouseEvent) {
        console.log("adding track");
        song.add_track();
    }

    function selectTrackHandler(this: HTMLElement, ev: PointerEvent) {
        console.log(ev.target);
    }

    function createKey(note: NoteDefinition) {
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

    function isMouseEvent(event: MouseEvent | KeyboardEvent | TouchEvent): event is MouseEvent {
        return (event as MouseEvent).buttons !== undefined;
    }
    function isKeyboardEvent(event: MouseEvent | KeyboardEvent | TouchEvent): event is KeyboardEvent {
        return (event as KeyboardEvent).key !== undefined;
    }
    function isTouchEvent(event: MouseEvent | KeyboardEvent | TouchEvent): event is TouchEvent {
        return (event as TouchEvent).touches !== undefined;
    }
})();


