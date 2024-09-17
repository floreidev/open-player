import { readBinaryFile } from "@tauri-apps/api/fs";
import { resolveResource } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { writable, type Writable } from "svelte/store";
export enum PlayerItemType {
    Playlist,
    Track,
    Artist,
    Album,
    All,
    None
}

type PlayingFrom = {
    type: PlayerItemType,
    id: string
}

class Player extends EventTarget {
    queueIndex: number
    loop: boolean
    shuffle: boolean
    playingFrom: PlayingFrom
    private queue: string[]
    queueUpdatedEvent: Event
    playingChangedEvent: Event
    currentAudio: HTMLAudioElement
    constructor(audioElement: HTMLAudioElement) {
        super()
        this.queueIndex = 0;
        this.loop = true;
        this.shuffle = false;
        this.playingFrom = { type: PlayerItemType.None, id: "" }
        this.queue = []
        this.currentAudio = audioElement;
        
        this.queueUpdatedEvent = new Event("queueUpdated");
        this.playingChangedEvent = new Event("playingChanged")
        
        
        this.currentAudio.addEventListener("ended", (ev) => {
            setQueueIndex(player.queueIndex + 1);
            player.playQueue();
        })
        this.currentAudio.addEventListener("play", () => this.dispatchEvent(this.playingChangedEvent))
        this.currentAudio.addEventListener("pause", () => this.dispatchEvent(this.playingChangedEvent))
    }

    getQueue() {
        return [...this.queue] // ensure no pass by refernce so that event is alwasy called and there are no workarounds to ignore events
    }
    

    getQueueLength() {
        return this.queue.length;
    }

    getQueueItem(index: number) {
        return this.queue[index];
    }

    setQueue(newQ: string[]) {
        this.queue = newQ;
        this.dispatchEvent(this.queueUpdatedEvent);
    }

    private fyShuffle(array: any[]) {
        let currentIndex = array.length;
    
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
    
            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
    
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
    }

    shuffleQueue() {
        this.shuffle = true;
        this.fyShuffle(this.queue);
        this.dispatchEvent(this.queueUpdatedEvent);
    }


    unshuffleQueue() {
        this.shuffle = false;
        switch (this.playingFrom.type) {
            case PlayerItemType.Album:
                var x = this.getQueueItem(player.queueIndex)
                player.queueIndex = player.queue.indexOf(x);
                this.setQueue(metaJson?.albums[player.playingFrom.id].tracks?.sort((a, b) => a.trackNum - b.trackNum).map((v) => {
                    return v.id
                }) || [""]);
                break;
            case PlayerItemType.All:
                this.setQueue(Object.values(metaJson?.tracks || {}).map((v) => v.id));
                break;
            default:
                break;
        }
    }

    playQueue() {
        this.directPlay(this.getQueueItem(this.queueIndex));
    }

    directPlay(id: string) {
        const bin = convertFileSrc(metaJson?.tracks[id].path || "");
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = bin;
        this.currentAudio.play();
        updateMediaSession(id);
    }

    toggleLoop() {
        this.loop = !this.loop;
    }
    
    isPlaying() {
        return !this.currentAudio.paused;
    }

}




const makeCurrentAudio: () => HTMLAudioElement = () => {
    var x =document.createElement("audio");
    x.id = "current";
    return x;
}

var current = document.getElementById("current") as HTMLAudioElement;
if(!current) current = makeCurrentAudio();


export var player: Player = new Player(current);


let metaJson: MetaFile | null = null;
export function init(meta: MetaFile) { metaJson = meta }


export function getFullNowPlaying() {
    return metaJson?.tracks[player.getQueueItem(player.queueIndex)];
}

document.body.appendChild(current);
current.style.display = "none";






function updateMediaSession(id: string) {
    if (navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: metaJson?.tracks[id].title || "",
            artist: metaJson?.tracks[id].artistName || "",
            album: metaJson?.tracks[id].albumName || ""
        })
        navigator.mediaSession.setActionHandler("play", () => {
            current.play()
        });
        navigator.mediaSession.setActionHandler("pause", () => {
            current.pause()
        });
        navigator.mediaSession.setActionHandler("stop", () => {
            current.pause()
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => { });

        navigator.mediaSession.setActionHandler("seekforward", () => { });
        navigator.mediaSession.setActionHandler("seekto", () => { });
        navigator.mediaSession.setActionHandler("previoustrack", () => { });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
            next()
        });
    }


}

export function setQueueIndex(index: number): string | null {
    if (player.getQueueLength() <= index) {
        if (player.shuffle) player.shuffleQueue()
        if (player.loop || player.shuffle) player.queueIndex = 0;
        else return null;
    } else if (index < 0) player.queueIndex = 0;
    else player.queueIndex = index
    return player.getQueueItem(player.queueIndex);
}



export function playTrack(src: string) {
    player.setQueue([src]);
    player.playQueue();
}

export function playTrackFromAlbum(album: string, trackIndex: number) {
    player.queueIndex = trackIndex;
    player.setQueue(metaJson?.albums[album].tracks?.sort((a, b) => a.trackNum - b.trackNum).map((v) => {
        return v.id
    }) || [""]);
    player.playingFrom = { id: album, type: PlayerItemType.Album }
    player.playQueue();
}


export function unpause() {
    current.play();
}

export function pause() {
    current.pause();
}

export function next() {
    if (!setQueueIndex(player.queueIndex + 1)) {
        current.currentTime = 0;
        current.pause()
    }
    else player.playQueue();
}


export function previous() {
    if (current.currentTime > 3) return current.currentTime = 0;
    if (!setQueueIndex(player.queueIndex - 1)) {
        current.currentTime = 0;
        current.pause();
    } else player.playQueue();
}

export function toggle() {
    if (current.paused) current.play();
    else current.pause();
}


export function playAll() {
    player.setQueue(Object.values(metaJson?.tracks || {}).map((v) => v.id));
    player.playingFrom = {
        id: "",
        type: PlayerItemType.All
    }
    player.playQueue();
}




export function toggleShuffle() {
    if (player.shuffle) player.unshuffleQueue();
    else player.shuffleQueue();
}
