import { NoteDefinition, noteDefinitions, NoteInstance } from "./note";
import { keymap } from "./keymap";
import { Song } from "./song";
import { Track, TrackType } from "./track";
import { RecordingStatus } from "./control";
import type { ChangeEvent } from "react";

(function () {
    let audioCtx: AudioContext = new AudioContext();
    let gainNode: GainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 1.0;

    let activeNotes = new Map<string, NoteInstance>();

    let params = new URLSearchParams(window.location.search);

    let playTimeouts: number[] = [];
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

    let waveInput = document.getElementById("wavetype") as HTMLInputElement;
    waveInput?.addEventListener("change", wavetypeHandler, false);

    let recordInput = document.getElementById("record");
    recordInput?.addEventListener("click", recordHandler, false);

    let bpmInput = document.getElementById("bpm") as HTMLInputElement;
    bpmInput?.addEventListener("change", bpmHandler);

    let newTrackButton = document.getElementById("new-track") as HTMLButtonElement;
    newTrackButton?.addEventListener("click", addTrackHandler);

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

        let noteDef = noteDefinitions.get(id);
        let note = new NoteInstance(id, (Date.now() - song.recordingStart!));

        let noteElement = document.getElementById(id);
        if (noteElement) { noteElement.classList.add("pressed"); }

        if (noteDef && (((isKeyboardEvent(event) && !event.repeat)) || isMouseEvent(event) || isTouchEvent(event))) {
            let osc = playNote(noteDef!.freq);
            note.osc = osc;
            activeNotes.set(id, note);
        }
    }

    function noteReleased(event: MouseEvent | KeyboardEvent | TouchEvent) {
        (<HTMLElement>event.currentTarget!).classList.remove("pressed");
        let id = "";
        if (isKeyboardEvent(event)) { id = keymap.get(event.key)!; }
        else if (isMouseEvent(event)) {
            id = (<HTMLElement>event.target!).id; 
        } else {
            id = (<HTMLElement>event.target!).id;
        }

        if (id && activeNotes.has(id)) {
            let note = activeNotes.get(id)!;
            let noteElement = document.getElementById(id);
            if (noteElement) { noteElement.classList.remove("pressed"); }

            note?.osc?.stop();
            note.duration = Date.now() - (song.recordingStart! + note.start);

            if (song.recording == RecordingStatus.Recording) {
                song.tracks[song.trackIndex]!.notes.push(note);
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

    function playHandler(event: Event) {
        createContext();
        for (const track of song.tracks) {
            for (const note of track.notes) {
                let timeout = window.setTimeout(() => {
                    let osc = audioCtx!.createOscillator();
                    let noteName = note.name;
                    let noteElement = document.getElementById(note.name);
                    if (noteElement != null) { noteElement!.classList.add('pressed'); }
                    osc.connect(gainNode);
                    osc.type = waveInput.value as OscillatorType;
                    osc.frequency.value = noteDefinitions.get(noteName)!.freq;
                    osc.start();
                    osc.stop(audioCtx.currentTime + (note.duration / 1_000));

                    let stopTimeout = window.setTimeout(() => {
                        noteElement!.classList.remove('pressed');
                        //                        osc.stop();
                        // TODO can we get rid of this stuff entirely? Need to remove the pressed class when the note is done but the osc can control
                        // note length all on its own.
                    }, note.duration);
                    playTimeouts.push(stopTimeout as number);
                }, note.start);
                playTimeouts.push(timeout);

            }
        }
    }

    function clearHandler(event: Event) {
        song.tracks = [new Track("aaaa", TrackType.Synth)];
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

    function wavetypeHandler(event: Event) {
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
            let osc = audioCtx.createOscillator()
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
        song.add_track(tracks!);
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

