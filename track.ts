import { NoteInstance } from "./note";
import { WaveForm } from "./waveform";
   
   export class Track {
        notes: NoteInstance[] = [];
        name: string;
        type: TrackType = TrackType.Synth;
        waveform: WaveForm;

        constructor(name: string) {
            this.name = name;
        }
    }

    export enum TrackType {
        Synth,
        Drum
    }
