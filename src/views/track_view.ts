// I am freestyling this, let's see what we can do

import type { Track } from "../models/track";
import type { View } from "./view";

export class TrackView implements View<Track>{
    id: string;
    template: string;
    
    constructor(id:string) {
        // caller is responsible for providing a unique id to locate the view in the live dom
        this.id = id;
        this.template = `
            <div id="${this.id}">
                <select class="track-waveform">
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                </select>
            </div>
        `
    }
    
    display(model: Track, container:HTMLElement): null {
        container.innerHTML = this.template;
        return null; // TODO: why
    }
}