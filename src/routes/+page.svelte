<script lang="ts">
    import { getContext, setContext, type SvelteComponent } from "svelte";
    import Seekbar from "../Seekbar.svelte";
    import Sidebar from "../Sidebar.svelte";
    import Viewport from "../Viewport.svelte";
    import {
        readDir,
        copyFile,
        BaseDirectory,
        exists,
        createDir,
        readTextFile,
        writeTextFile,
    } from "@tauri-apps/api/fs";
    import { audioDir, join, homeDir } from "@tauri-apps/api/path";
    import Test from "../Test.svelte";
    import { invoke } from "@tauri-apps/api/tauri";
    import { page, updated } from "$app/stores";
    import { writable } from "svelte/store";
    import AlbumComponent from "../AlbumComponent.svelte";
    import ArtistComponent from "../ArtistComponent.svelte";
    import * as audioManager from "../audioManager";

    async function createDefaultFolders(
        opDir: string,
        playlistDir: string,
        mDir: string,
        acDir: string
    ) {
        var hasMD = await exists(mDir);
        if (!hasMD) await createDir(mDir);

        var hasOD = await exists(opDir);
        if (!hasOD) await createDir(opDir);

        var hasPD = await exists(playlistDir);
        if (!hasPD) await createDir(playlistDir);



        var hasACP = await exists(acDir);
        if(!hasACP) await createDir(acDir);

        var mta = await join(playlistDir, "__META__.json");
        var hasMeta = await exists(mta);
        if (!hasMeta)
            await writeTextFile(
                mta,
                JSON.stringify({
                    tracks: {},
                    albums: {},
                    artists: {},
                    playlists: [],
                }),
            );
        return hasMeta;
    }

    import { register } from "@tauri-apps/api/globalShortcut";
    import Queue from "../Queue.svelte";
    register("CommandOrControl+Shift+Alt+Right", () => {
        audioManager.next();
    });

    register("CommandOrControl+Shift+Alt+Left", () => {
        audioManager.previous();
    });

    async function addTaggedMusicToMeta(mDir: string) { 
        /* TODO: Offload looping, path concatenation, reading files to rust for optimization purposes. 
            if swapping just album covers makes it around 220x faster then we should offload as much of the
            I/O and non-gui tasks to rust as possible

            For now, ill keep the majority of the API on the svelte side, sunk-cost fallacy and such,
            however the metadata creation, specifically the looping, ID generation, and file creation, can
            be offloaded onto rust as thats the biggest performance issue in the code right now

            in general, the app performance incredibly well, even while spamming the shuffle button and playing music
            i managed to get ~ 100x the resource efficieny of spotiy, but this app should be able to run on a 
            fucking potato if needs be, LET THE PEOPLE HAVE MUSIC!
        */
        let files = await readDir(mDir, { recursive: true });
        var albums: { [key: string]: Album } = {};
        var artists: { [key: string]: Artist } = {};
        var tracks: { [key: string]: Track } = {};
        let fp = await join(
            mDir,
            "OfflinePlayer",
            "Playlists",
            "__META__.json",
        );
        let acp = await join(
            mDir,
            "OfflinePlayer",
            "AlbumCovers",
        )
        var metaJson: MetaFile = JSON.parse(await readTextFile(fp));
        for (var f of files) {
            if (f.name?.match(/(\.mp3|\.wav|\.flac|\.mkv|\.m4a)$/)) {
                let v: any = await invoke("get_meta", {
                    path: f.path,
                    ext: f.name.split(".")[f.name.split(".").length - 1],
                    acPath: acp
                });
                let rtist = v["Some(Artist)"];
                let { album, artist, title, path, trackNum } = {
                    album: v["Some(Album)"],
                    artist: rtist ? rtist.split(";")[0] : "",
                    title: v["Some(TrackTitle)"],
                    path: v["_PATH"],
                    trackNum: v["Some(TrackNumber)"]?.split("/")[0] || 1,
                };
                if (!album || !artist || !title) continue;
                let existingAlbum = Object.values(metaJson.albums).filter(
                    (a) => a.artistName == artist && a.name == album,
                );
                let existingArtist = Object.values(metaJson.artists).filter(
                    (a) => a.name == artist,
                );
                let existingTrack = Object.values(metaJson.tracks).filter(
                    (a) =>
                        a.title == title &&
                        a.albumName == album &&
                        a.artistName == artist,
                );
                if (existingTrack.length > 0) {
                    // we have the track, album and artist
                    if (!album || existingAlbum.length < 1) {
                        console.log("ERROR FOR:", path);
                        continue;
                    }
                    let tId = existingTrack[0].id,
                        arId = existingArtist[0].id,
                        alId = existingAlbum[0].id;

                    tracks[tId] = existingTrack[0];
                    artists[arId] = existingArtist[0];
                    albums[alId] = existingAlbum[0];
                } else if (existingAlbum.length > 0) {
                    // we have the album and artist, but not the track, so add the track
                    if (!artist || existingArtist.length < 1) {
                        console.log("ERR LOADING", path);
                        continue;
                    }
                    let tId = generateId(),
                        arId = existingArtist[0].id,
                        alId = existingAlbum[0].id;
                    tracks[tId] = {
                        id: tId,
                        title,
                        artistId: arId,
                        length: -1,
                        type: audioManager.PlayerItemType.Track,
                        path: path,
                        albumId: alId,
                        artistName: artist,
                        albumName: album,
                        trackNum,
                    };
                    artists[arId] = existingArtist[0];
                    let newAlbum = existingAlbum[0];
                    newAlbum.trackIds?.push(tId);
                    albums[alId] = newAlbum;
                } else if (existingArtist.length > 0) {
                    // we have the artist, but not the track or album, so add the album and track
                    let tId = generateId(),
                        arId = existingArtist[0].id,
                        alId = generateId();
                    tracks[tId] = {
                        id: tId,
                        title,
                        artistId: arId,
                        length: -1,
                        path: path,
                        albumId: alId,
                        artistName: artist,
                        type: audioManager.PlayerItemType.Track,
                        albumName: album,
                        trackNum,
                    };
                    let newArtist = existingArtist[0];
                    newArtist.albumIds.push(alId);
                    artists[arId] = newArtist;
                    albums[alId] = {
                        id: alId,
                        name: album,
                        trackIds: [tId],
                        artistId: arId,
                        type: audioManager.PlayerItemType.Album,
                        artistName: artist,
                    };
                } else {
                    // we dont have anything, so add them all.
                    let tId = generateId(),
                        arId = generateId(),
                        alId = generateId();
                    tracks[tId] = {
                        id: tId,
                        title,
                        artistId: arId,
                        length: -1,
                        path: path,
                        albumId: alId,
                        artistName: artist,
                        type: audioManager.PlayerItemType.Track,
                        albumName: album,
                        trackNum,
                    };
                    artists[arId] = {
                        id: arId,
                        albumIds: [alId],
                        type: audioManager.PlayerItemType.Artist,
                        name: artist,
                    };
                    albums[alId] = {
                        id: alId,
                        name: album,
                        trackIds: [tId],
                        artistId: arId,
                        artistName: artist,
                        type: audioManager.PlayerItemType.Album,
                    };
                }
                Object.assign(metaJson.artists, artists);
                Object.assign(metaJson.tracks, tracks);
                Object.assign(metaJson.albums, albums);
            }
        }
        await writeTextFile(fp, JSON.stringify(metaJson));
        return metaJson;
    }

    function generateId() {
        return (
            Math.random().toString(36).substring(2) +
            Math.random().toString(36).substring(2)
        ).replace(/(.)/g, (m, n) =>
            Math.random() > 0.5 ? n.toUpperCase() : n,
        );
    }

    let writableDeepMeta = writable({});
    setContext("deepMeta", writableDeepMeta);
    let writableFileMeta = writable({});
    setContext("fileMeta", writableFileMeta);

    async function getMeta() {
        var ad = await homeDir();
        var mDir = await join(ad, "Music");
        var opDir = await join(mDir, "OfflinePlayer");
        var playlistDir = await join(opDir, "Playlists");
        var acDir = await join(opDir, "AlbumCovers");
        var doFullUpdate = !await createDefaultFolders(opDir, playlistDir, mDir, acDir);;
        
        var metaJson: MetaFile;
        if (doFullUpdate) {
            alert("Starting full meta update! This could take a while as we're scanning your whole music library...")
            metaJson = await addTaggedMusicToMeta(mDir);
            if (!metaJson.playlists) metaJson.playlists = [];
        } else {
            metaJson = JSON.parse(
                await readTextFile(await join(playlistDir, "__META__.json")),
            );
        }

        var playlists: Playlist[] = [];
        var albums: { [key: string]: Album } = {};
        var artists: { [key: string]: Artist } = {};
        var tracks: { [key: string]: Track } = {};
        for (var trackId in metaJson.tracks) {
            var track = metaJson.tracks[trackId];
            track.artist = metaJson.artists[track.artistId];
            track.album = metaJson.albums[track.albumId];
            tracks[trackId] = track;
        }
        for (var albumId in metaJson.albums) {
            var album = metaJson.albums[albumId];
            album.tracks = album.trackIds
                ?.map((v: string) => tracks[v])
                .sort((a, b) => a.trackNum - b.trackNum);
            album.artist = metaJson.artists[album.artistId];
            albums[albumId] = album;
        }
        for (var artistId in metaJson.artists) {
            var artist = metaJson.artists[artistId];
            artist.albums = artist.albumIds.map((v: string) => albums[v]);
            artists[artistId] = artist;
        }
        if (metaJson.playlists) {
            for (var playlist of metaJson.playlists) {
                var playlistJson = JSON.parse(
                    await readTextFile(await join(playlistDir, playlist)),
                );
                playlistJson.tracks = playlistJson.trackIds.map(
                    (v: string) => tracks[v],
                );
                playlists.push(playlistJson);
            }
        }
        let complete = {
            playlists,
            albums: Object.values(albums),
            artists: Object.values(artists),
        };

        writableDeepMeta.set(complete);
        writableFileMeta.set(metaJson);

        audioManager.init(metaJson);
        return complete;
    }

    $: route = "Viewport";
    let comp: any;
    $: route, update();

    const update = () => {
        comp = Viewport;
        switch (route) {
            case "Test":
                comp = Test;
                break;
            case "Album":
                comp = AlbumComponent;
                break;
            case "Artist":
                comp = ArtistComponent;
                break;
            case "Viewport":
            default:
                comp = Viewport;
                break;
        }
    };
    document.addEventListener("keyup", (ev) => {
        if(ev.key == " " && document.activeElement?.tagName != "BUTTON") audioManager.toggle();
        if(ev.key == "ArrowRight" && ev.ctrlKey) audioManager.next();
        if(ev.key == "ArrowLeft" && ev.ctrlKey) audioManager.previous();
    })
    $: selected = {};
</script>

<div class="ba main-area">
    {#await getMeta()}
        <h1>Waiting for metadata...</h1>
    {:then meta}
        <Sidebar
            playlists={meta.playlists}
            metaAlbums={meta.albums}
            metaArtists={meta.artists}
            setSelected={(x, r) => {
                selected = x;
                route = r;
            }}
        ></Sidebar>
    {/await}

    <svelte:component this={comp} {selected}></svelte:component>
    <Queue></Queue>
</div>
<Seekbar></Seekbar>

<style>
    .main-area {
        overflow-x: hidden;
        flex: 1;
        width: 100%;
        display: flex;
        width: 100vw;
        max-width: 100vw;
        height: calc(100vh - 96px);
        max-height: calc(100vh - 96px);
    }
</style>
