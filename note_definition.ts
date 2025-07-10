    export class NoteDefinition {
        name!: string;
        freq!: number;
        type!: string;

        constructor(name: string, freq: number, type: string) {
            this.name = name;
            this.freq = freq;
            this.type = type;
        }
    }

export let noteDefinitions = new Map<string, NoteDefinition>();
noteDefinitions.set('f5', new NoteDefinition('f5', 698.46, 'w'));
noteDefinitions.set('e5', new NoteDefinition('e5', 659.25, 'w'));
noteDefinitions.set('d5s', new NoteDefinition('d5s', 622.25, 'b'));
noteDefinitions.set('d5', new NoteDefinition('d5', 587.33, 'w'));
noteDefinitions.set('c5s', new NoteDefinition('c5s', 554.36, 'b'));
noteDefinitions.set('c5', new NoteDefinition('c5', 523.25, 'w'));
noteDefinitions.set('b4', new NoteDefinition('b4', 493.88, 'w'));
noteDefinitions.set('a4s', new NoteDefinition('a4s', 466.16, 'b'));
noteDefinitions.set('a4', new NoteDefinition('a4', 440.00, 'w'));
noteDefinitions.set('g4s', new NoteDefinition('g4s', 415.30, 'b'));
noteDefinitions.set('g4', new NoteDefinition('g4', 392.00, 'w'));
noteDefinitions.set('f4s', new NoteDefinition('f4s', 369.99, 'b'));
noteDefinitions.set('f4', new NoteDefinition('f4', 349.23, 'w'));
noteDefinitions.set('e4', new NoteDefinition('e4', 329.63, 'w'));
noteDefinitions.set('d4s', new NoteDefinition('d4s', 311.12, 'b'));
noteDefinitions.set('d4', new NoteDefinition('d4', 293.66, 'w'));
noteDefinitions.set('c4s', new NoteDefinition('c4s', 277.18, 'b'));
noteDefinitions.set('c4', new NoteDefinition('c4', 261.63, 'w'));
noteDefinitions.set('b3', new NoteDefinition('b3', 246.94, 'w'));
