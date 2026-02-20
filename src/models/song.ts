import { RecordingStatus } from "./control.js";
import { noteDefinitions, NoteInstance } from "./note.js";
import { Track, TrackType } from "./track.js";


export class Song {
    bpm: number;
    tracks: Track[] = [];
    selectedTrackIndex = 0;
    recording: RecordingStatus = RecordingStatus.Idle;
    recordingStart?: number;
    container: HTMLElement;
    playTimeouts: number[] = [];
    activeNotes = new Map<string, NoteInstance>();

    constructor(bpm: number, trackParams: string, container: HTMLElement) {
        this.bpm = bpm;
        this.tracks = this.decode(trackParams);

        this.container = container;
        this.add_track();
    }

    add_track() {
        let track = new Track("New Track", TrackType.Synth)
        this.tracks.push(track);
        this.selectedTrackIndex = this.tracks.length - 1;

        let template = document.querySelector<HTMLTemplateElement>("#track-controls")!;
        let clone = document.importNode(template.content, true);
        clone.querySelector(".track")!.id = `track_${this.tracks.length - 1}`;
        
        this.container.appendChild(clone);

        return;
    }

    decode(input: string): Track[] {
        let trackArray = input.split('_').filter(s => s);
        let tracks = trackArray.map((t) => {
            let noteArray = t.split('!').filter(s => s);
            let notes: NoteInstance[] = noteArray.map((n) => {
                let elems = n.split('|');
                let name: string = elems[0]!;
                let start: number = parseInt(elems[1]!);
                let duration: number = parseInt(elems[2]!);
                let note = new NoteInstance(name, start);
                note.duration = duration;
                return note;
            });
            let track: Track = new Track("llllol", TrackType.Synth);
            track.notes = notes;
            return track;
        });
        return tracks;
    }

    encode(): string {
        let trackNotes: string[] = [];
        for (const track of this.tracks) {
            let encodedNotes = track.notes.map((n) => n.name + '|' + n.start + '|' + n.duration).join('!');
            trackNotes.push(encodedNotes);
        }
        return trackNotes.join('_')
    }

    play(audioCtx: AudioContext, gainNode: GainNode) {
        
        for (const track of this.tracks) {
            for (const note of track.notes) {
                let timeout = window.setTimeout(() => {
                    let osc = audioCtx!.createOscillator();
                    let noteName = note.name;
                    let noteElement = document.getElementById(note.name);
                    if (noteElement != null) { noteElement!.classList.add('pressed'); }
                    osc.connect(gainNode);
                    osc.type = track.waveform as unknown as OscillatorType;
                    osc.frequency.value = noteDefinitions.get(noteName)!.freq;
                    osc.start();
                    osc.stop(audioCtx.currentTime + (note.duration / 1_000));

                    let stopTimeout = window.setTimeout(() => {
                        noteElement!.classList.remove('pressed');
                        //                        osc.stop();
                        // TODO can we get rid of this stuff entirely? Need to remove the pressed class when the note is done but the osc can control
                        // note length all on its own.
                    }, note.duration);
                    this.playTimeouts.push(stopTimeout as number);
                }, note.start);
                this.playTimeouts.push(timeout);
            }
        }
    }

    clear() {
        this.tracks = [];
        this.recording = RecordingStatus.Idle;
        for (const timeout of this.playTimeouts) {
            clearTimeout(timeout);
        }
    }
}
