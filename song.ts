import { RecordingStatus } from "./control";
import { NoteInstance } from "./note";
import { Track, TrackType } from "./track";


export class Song {
    bpm: number;
    tracks: Track[] = [];
    recording: RecordingStatus = RecordingStatus.Idle;
    recordingStart?: number;
    trackIndex: number = 0;

    constructor(bpm: number, trackParams: string) {
        this.bpm = bpm;
        this.tracks = this.decode(trackParams);
        if (this.tracks.length == 0) {
            this.tracks.push(new Track("Melody 1", TrackType.Synth));
        }

        this.tracks.forEach((track, index) => {
        // TODO: i dont want container here, it makes it suck to test.
        // container.append(track.template(index)); 
        });

        this.trackIndex = 0;
    }

    add_track(container: HTMLElement) {
        let track = new Track("Melody", TrackType.Synth)
        this.tracks.push(track);
        this.trackIndex = this.tracks.length - 1; //TODO: this can probably get out of sync/underrun.
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
}
