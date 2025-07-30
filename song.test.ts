import { expect, test} from "bun:test";
import { Song } from "./src/models/song";

test("decode 1", () =>{
    let song = new Song(140, "");
    let encoded = song.encode();
    let des = new Song(140, encoded);

    expect(song == des);
}) 