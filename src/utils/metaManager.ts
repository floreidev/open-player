import { invoke } from "@tauri-apps/api/tauri"
import { PlayerItemType } from "./audioManager"
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs"


class MetaFile {
    artists: {[key: string]: Artist}
    tracks: {[key: string]: Track}
    albums: {[key: string]: Album}
    playlists: string[]
    constructor() {
        this.artists = {};
        this.tracks = {};
        this.albums = {};
        this.playlists = [];
    }

    async loadFromFile(filePath: string) {
        let metaFile: PrimitiveMetaFile = JSON.parse(await readTextFile(filePath));
        console.log(metaFile)
        for(var trackId in metaFile.tracks) {
            var track = metaFile.tracks[trackId];
            metaFile.tracks[trackId].album = metaFile.albums[track.albumId];
            if(!metaFile.albums[track.albumId].tracks) metaFile.albums[track.albumId].tracks = [];
            metaFile.albums[track.albumId].tracks?.push(metaFile.tracks[trackId]);
        }
        for(var albumId in metaFile.albums) {
            var album = metaFile.albums[albumId];
            metaFile.albums[albumId].artist = metaFile.artists[album.artistId];
            if(!metaFile.artists[album.artistId].albums) metaFile.artists[album.artistId].albums = [];
            metaFile.artists[album.artistId].albums?.push(metaFile.albums[albumId]);
        }
        this.tracks = metaFile.tracks;
        this.artists = metaFile.artists;
        this.albums = metaFile.albums;
        this.playlists = metaFile.playlists;
    }

    async firstLoad(rustReturn: RustReturn, filePath: string) {
        var metaFile: PrimitiveMetaFile = {tracks: {}, artists: {}, albums: {}, playlists: []};
        for(var trackId in rustReturn) {
            var trackMetadata = rustReturn[trackId];
            let album = trackMetadata.Album, artist = trackMetadata.Artist.split(";")[0], title = trackMetadata.TrackTitle, path = trackMetadata._PATH, trackNum = trackMetadata.TrackNumber;
            let existingAlbum = this.findAlbum(metaFile, album);
            let existingArtist = this.findArtist(metaFile, artist);
            if(existingAlbum && existingArtist) {
                metaFile.tracks[trackId] = {id: trackId, title, artistName: artist, artistId: existingArtist.id, length: -1, type: PlayerItemType.Track, path, albumId: existingAlbum.id, albumName: album, trackNum: parseInt(trackNum)}
                metaFile.albums[existingAlbum.id].trackIds?.push(trackId);
                /* Recursive segment - will be removed before saving to file. */
                metaFile.tracks[trackId].album = metaFile.albums[existingAlbum.id];
                metaFile.albums[existingAlbum.id].tracks?.push(metaFile.tracks[trackId]);
            } else if(existingArtist) {
                let newAlbumId: string = await invoke("generate_id");
                metaFile.artists[existingArtist.id].albumIds.push(newAlbumId);
                metaFile.albums[newAlbumId] = {id: newAlbumId, tracks: [], name: album, trackIds: [trackId], artistId: existingArtist.id, artistName: artist, type: PlayerItemType.Album};
                metaFile.tracks[trackId] = {id: trackId, title, artistName: artist, artistId: existingArtist.id, length: -1, type: PlayerItemType.Track, path, albumId: newAlbumId, albumName: album, trackNum: parseInt(trackNum)}

                metaFile.tracks[trackId].album = metaFile.albums[newAlbumId];
                metaFile.albums[newAlbumId].tracks?.push(metaFile.tracks[trackId]);
                metaFile.artists[existingArtist.id].albums?.push(metaFile.albums[newAlbumId]);
            } else {
                let newAlbumId: string = await invoke("generate_id");
                let newArtistId: string = await invoke("generate_id");
                metaFile.artists[newArtistId] = {id: newArtistId, name: artist, albumIds: [newAlbumId], albums: [], type: PlayerItemType.Artist}
                metaFile.albums[newAlbumId] = {id: newAlbumId, tracks: [], name: album, trackIds: [trackId], artistId: newArtistId, artistName: artist, type: PlayerItemType.Album};
                metaFile.tracks[trackId] = {id: trackId, title, artistName: artist, artistId: newArtistId, length: -1, type: PlayerItemType.Track, path, albumId: newAlbumId, albumName: album, trackNum: parseInt(trackNum)}

                metaFile.tracks[trackId].album = metaFile.albums[newAlbumId];
                metaFile.albums[newAlbumId].tracks?.push(metaFile.tracks[trackId]);
                metaFile.artists[newArtistId].albums?.push(metaFile.albums[newAlbumId]);
                metaFile.albums[newAlbumId].artist = metaFile.artists[newArtistId];
            }
        }
        let writableMetaFile = structuredClone(metaFile);
        Object.keys(writableMetaFile.albums).map((v) => {
            delete writableMetaFile.albums[v].tracks;
            delete writableMetaFile.albums[v].artist;
        })
        
        Object.keys(writableMetaFile.tracks).map((v) => {
            delete writableMetaFile.tracks[v].album;
        })
        
        Object.keys(writableMetaFile.artists).map((v) => {
            delete writableMetaFile.artists[v].albums;
        })
        this.tracks = metaFile.tracks;
        this.artists = metaFile.artists;
        this.albums = metaFile.albums;
        this.playlists = metaFile.playlists;
        writeTextFile(filePath, JSON.stringify(writableMetaFile)); 
    }

    private findAlbum(metaFile: PrimitiveMetaFile, albumName: string) {
        return Object.values(metaFile.albums).find((v) => v.name == albumName);
    }

    
    private findArtist(metaFile: PrimitiveMetaFile, artistName: string) {
        return Object.values(metaFile.artists).find((v) => v.name == artistName);
    }

}

export var metaFile = new MetaFile();
