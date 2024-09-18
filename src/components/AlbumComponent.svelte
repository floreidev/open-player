<script lang="ts">
    import { resolveResource, join, homeDir } from "@tauri-apps/api/path";
    import { player } from "../utils/audioManager";
    import { convertFileSrc } from "@tauri-apps/api/tauri";
    import TrackList from "./TrackList.svelte";
    export let doOverflow: boolean = true;
    export let selected: Album;
    export let playFunction: (a: any, b: any, c?: any) => void = (a, b, c) =>
        player.playTrackFromAlbum(a, b);
    export let playData: string = "";
    async function getAlbum() {
        let acp = await join(
            await homeDir(),
            "Music",
            "OpenPlayer",
            "AlbumCovers",
            selected.name + ".png",
        );
        return convertFileSrc(acp);
    }
</script>

<div
    class="album-container"
    style={doOverflow
        ? "overflow-y: scroll; height: calc(100vh - 96px);"
        : "overflow-y: hidden;"}
>
    <div
        class="title-area"
        style={doOverflow
            ? "background: linear-gradient(to bottom, var(--light), var(--bg));"
            : "background: var(--bg);"}
    >
        <div class="title-left">
            {#key selected}
                {#await getAlbum()}
                    <img
                        src="https://community.mp3tag.de/uploads/default/original/2X/a/acf3edeb055e7b77114f9e393d1edeeda37e50c9.png"
                        alt=""
                    />
                {:then album}
                    <img src={album} alt="" width="32" height="32" />
                {/await}
            {/key}
        </div>
        <div class="title-right">
            <h1>{selected.name}</h1>
            <h2>{selected.artistName}</h2>
        </div>
    </div>
    <TrackList
        {doOverflow}
        clickCallback={(i) => playFunction(selected.id, i, playData)}
        items={selected.tracks || []}
    ></TrackList>
</div>

<style>
    
    img {
        width: 128px;
        height: 128px;
        border-radius: 16px;
    }
    .title-left {
        margin-right: 16px;
    }
    img::before {
        content: ' ';
        display: block;
        width: 128px;
        height: 128px;
        background-image: url(https://community.mp3tag.de/uploads/default/original/2X/a/acf3edeb055e7b77114f9e393d1edeeda37e50c9.png);
    }
    ::-webkit-scrollbar {
        height: 14px;
        width: 14px;
    }

    ::-webkit-scrollbar-corner {
        background: var(--contrast);
    }

    ::-webkit-scrollbar-thumb:horizontal {
        background: var(--bg);
        min-width: 20px;
        padding-left: 7px;
        padding-right: 7px;
        -webkit-background-clip: border-box, border-box, content-box;
        cursor: pointer;
    }

    ::-webkit-scrollbar-thumb:vertical {
        background: var(--light);
        min-height: 20px;
        padding-top: 7px;
        padding-bottom: 7px;
        -webkit-background-clip: border-box, border-box, content-box;
    }

    .title-area {
        display: flex;
        width: 100%;
        height: 256px;
        padding: 64px;
        flex-direction: row;
    }
    .album-container {
        font-family: "Figtree";

        background: var(--bg);
        color: white;
        width: 100%;
        position: relative;
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
    }
</style>
