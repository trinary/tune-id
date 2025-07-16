import { RecordingStatus } from "./control";
import { NoteInstance } from "./note";
import { Track } from "./track";


export class Song {
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
