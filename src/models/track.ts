import { NoteInstance } from "./note";
import { WaveForm } from "./waveform";
   
   export class Track {
        notes: NoteInstance[] = [];
        name: string;
        type: TrackType = TrackType.Synth;
        waveform: WaveForm;

        constructor(name: string, type: TrackType) {
            this.name = name;
            this.type = type;
            this.waveform = new WaveForm();
        }
    }

    export enum TrackType {
        Synth,
        Drum
    }
