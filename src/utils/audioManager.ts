import { convertFileSrc } from "@tauri-apps/api/tauri";
import { metaFile } from "./metaManager";
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

class Queue extends Array<string> {
    playingIndex: number;
    constructor() {
        super()
        this.playingIndex = 0;
    }

    playing() {
        return this[this.playingIndex];
    }
}

class Player extends EventTarget {
    queueIndex: number
    loop: boolean
    shuffle: boolean
    playingFrom: PlayingFrom
    private queue: string[]
    queueUpdatedEvent: string
    playingChangedEvent: string
    currentAudio: HTMLAudioElement
    seekChangedEvent: string
    constructor(audioElement: HTMLAudioElement) {
        super()
        this.queueIndex = 0;
        this.loop = true;
        this.shuffle = false;
        this.playingFrom = { type: PlayerItemType.None, id: "" }
        this.queue = []
        this.currentAudio = audioElement;
        
        this.queueUpdatedEvent = "queueChanged";
        this.playingChangedEvent ="playingChanged"
        this.seekChangedEvent = "seekChanged";
        
        this.currentAudio.addEventListener("ended", (ev) => {
            setQueueIndex(player.queueIndex + 1);
            player.playQueue();
        })
        this.currentAudio.addEventListener("play", () => this.dispatchEvent(new CustomEvent(this.playingChangedEvent, {detail: this.getNowPlaying()})))
        this.currentAudio.addEventListener("pause", () => this.dispatchEvent(new CustomEvent(this.playingChangedEvent, {detail: this.getNowPlaying()})))
        this.currentAudio.addEventListener("timeupdate", () => this.dispatchEvent(new CustomEvent(this.seekChangedEvent, {detail: {time: this.currentAudio.currentTime, duration: this.currentAudio.duration}})));
    }

    getNowPlaying() {
        return metaFile.tracks[player.getQueueItem(player.queueIndex)];
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
        this.dispatchEvent(new CustomEvent(this.queueUpdatedEvent, {detail: [...this.queue]}));
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

    skipTo(i: number) {
        this.queueIndex = i;
        this.playQueue();
    }

    shuffleQueue() {
        this.shuffle = true;
        this.fyShuffle(this.queue);
        this.dispatchEvent(new CustomEvent(this.queueUpdatedEvent, {detail: this.queue}));
    }

    unshuffleQueue() {
        this.shuffle = false;
        switch (this.playingFrom.type) {
            case PlayerItemType.Album:
                var x = this.getQueueItem(player.queueIndex)
                player.queueIndex = player.queue.indexOf(x);
                this.setQueue(metaFile.albums[player.playingFrom.id].tracks?.sort((a, b) => a.trackNum - b.trackNum).map((v) => {
                    return v.id
                }) || [""]);
                break;
            case PlayerItemType.All:
                this.setQueue(Object.values(metaFile.tracks || {}).map((v) => v.id));
                break;
            default:
                break;
        }
    }

    playQueue() {
        this.directPlay(this.getQueueItem(this.queueIndex));
    }

    directPlay(id: string) {
        const bin = convertFileSrc(metaFile.tracks[id].path || "");
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

    setQueueAtIndex(index: number, trackId: string) {
        this.queue[index] = trackId
        this.dispatchEvent(new CustomEvent(this.queueUpdatedEvent, {detail: this.queue}));
    }

    playTrackFromAlbum(album: string, trackIndex: number) {
        this.queueIndex = trackIndex;
        let sortedQ = metaFile.albums[album].tracks?.sort((a, b) => a.trackNum - b.trackNum).map((v) => v.id) || [""];
        if(this.shuffle) {
            let unShuffled = [...sortedQ];
            this.fyShuffle(sortedQ)
            this.queueIndex = 0;
            sortedQ[0] = unShuffled[trackIndex]
            this.setQueue(sortedQ);
        } else this.setQueue(sortedQ); 
        this.playingFrom = { id: album, type: PlayerItemType.Album }
        this.playQueue();
    }

    playTrackFromArtist(albumId: string, trackIndex: number, artist: string) {
        let allSongs = [] as string[]
        metaFile.artists[artist].albumIds.forEach((v) => {
            let x = metaFile.albums[v].trackIds || [];
            allSongs = [...allSongs, ...x]
        });
        this.fyShuffle(allSongs);
        allSongs[0] = (metaFile.albums[albumId].tracks?.sort((a, b) => a.trackNum - b.trackNum).map((v) => v.id) || [])[trackIndex];
        this.shuffle = true;
        this.setQueue(allSongs);
        this.playQueue();
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





document.body.appendChild(current);
current.style.display = "none";






function updateMediaSession(id: string) {
    if (navigator.mediaSession) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: metaFile.tracks[id].title || "",
            artist: metaFile.tracks[id].artistName || "",
            album: metaFile.tracks[id].albumName || ""
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
    player.setQueue(Object.values(metaFile.tracks || {}).map((v) => v.id));
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
