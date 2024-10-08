<script lang="ts">
    import {
        Heart,
        ThreeDots,
        Shuffle,
        SkipStartFill,
        SkipEndFill,
        PlayFill,
        Repeat,
        VolumeUpFill,
        Bookshelf,
        PauseFill,
    } from "svelte-bootstrap-icons";
    import * as audioManager from "../utils/audioManager";
    import { homeDir, join } from "@tauri-apps/api/path";
    import { convertFileSrc } from "@tauri-apps/api/tauri";
    import { isQueueOpened, toggleQueue } from "./Queue.svelte";

    $: nowPlaying = {} as Track;
    $: playing = audioManager.player.isPlaying();
    $: audioManager.player.addEventListener("playingChanged", () => {
        var np = audioManager.player.getNowPlaying();
        if (np) nowPlaying = np;

        playing = audioManager.player.isPlaying();
        shuffled = audioManager.player.shuffle;
    });

    $: shuffled = audioManager.player.shuffle;
    $: loop = audioManager.player.loop;
    $: qOpen = false;
    $: seekTime = 0;
    $: seekDuration = 1;
    $: audioManager.player.addEventListener("seekChanged", (e) => {
        let event = e as CustomEvent;
        if (event.detail.duration && event.detail.time)
            [seekTime, seekDuration] = [
                event.detail.time,
                event.detail.duration,
            ];
    });
    async function getAlbum() {
        console.log("getting album");
        let acp = await join(
            await homeDir(),
            "Music",
            "OfflinePlayer",
            "AlbumCovers",
            nowPlaying.albumName + ".png",
        );
        return convertFileSrc(acp);
    }

    const getAsTimeString = (t: number) => {
        var d = new Date(t);
        return (
            d.getMinutes() + ":" + d.getSeconds().toString().padStart(2, "0")
        );
    };
</script>

<div class="ba seek-area">
    <div class="ss track-info">
        <div class="track-left">
            {#key nowPlaying}
            {#await getAlbum()}
                <img
                    src="https://community.mp3tag.de/uploads/default/original/2X/a/acf3edeb055e7b77114f9e393d1edeeda37e50c9.png"
                    alt=""
                />
            {:then album}
                <img src={album} alt="" />
            {/await}
            {/key}
        </div>
        <div class="track-right">
            <div class="title-segment">
                <div class="title">
                    <h1>{nowPlaying.title || "Nothing Playing..."}</h1>
                    <Heart style="margin-right: 8px;" />
                    <ThreeDots />
                </div>
                <p class="artist-txt">{nowPlaying.artistName || "hi :)"}</p>
                <p class="sub-txt">
                    {nowPlaying.albumName || "free palestine"}
                </p>
            </div>
        </div>
    </div>
    <div class="ss playbar">
        <div class="controls">
            <button
                class="shuffle"
                on:click={() => {
                    audioManager.toggleShuffle();
                }}
            >
                <Shuffle
                    width="20"
                    height="20"
                    color={shuffled ? "lime" : "white"}
                />
            </button>
            <button class="prev" on:click={() => audioManager.previous()}>
                <SkipStartFill width="20" height="20" color="white" />
            </button>
            <button class="play" on:click={() => audioManager.toggle()}>
                {#if playing}
                    <PauseFill width="32" height="32" color="white" />
                {:else}
                    <PlayFill width="32" height="32" color="white" />
                {/if}
            </button>
            <button class="skip" on:click={() => audioManager.next()}>
                <SkipEndFill width="20" height="20" color="white" />
            </button>
            <button
                class="repeat"
                on:click={() => {
                    audioManager.player.toggleLoop();
                    loop = audioManager.player.loop;
                }}
            >
                <Repeat
                    width="20"
                    height="20"
                    color={loop ? "lime" : "white"}
                />
            </button>
        </div>
        <div class="seek-container">
            <p>{getAsTimeString(seekTime * 1000)}</p>
            <div
                class="seek"
                style="--data-percent: {(seekTime / seekDuration) * 100}%;"
            ></div>
            <p>{getAsTimeString(seekDuration * 1000)}</p>
        </div>
    </div>
    <div class="ss misc-controls">
        <button class="mc-btn">
            <VolumeUpFill width="24" height="24" />
        </button>
        <button
            class="mc-btn"
            on:click={() => {
                toggleQueue();
                qOpen = isQueueOpened;
            }}
        >
            <Bookshelf
                width="24"
                height="24"
                color={qOpen ? "lime" : "white"}
            />
        </button>
    </div>
</div>

<style>
    .seek-container p {
        font-size: 14px;
        margin: 8px;
    }

    .mc-btn {
        width: 32px;
        height: 32px;
        display: flex;
        justify-content: center;
        background: none;
        outline: none;
        border: none;
        color: white;
        margin-right: 32px;
    }
    .title-segment {
        flex-direction: column;
        display: flex;
        justify-content: space-between;
        height: 64px;
    }
    .title-segment h1,
    .title-segment p {
        overflow: hidden;
        word-break: normal;
        word-wrap: normal;
        text-overflow: ellipsis;
        max-height: 16px;
    }
    .seek-area {
        z-index: 100;
        font-family: "Figtree";
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 96px;
        background: var(--bg);
        color: white;
        -webkit-box-shadow: 0px -3px 21px 0px rgba(0, 0, 0, 0.47);
        -moz-box-shadow: 0px -3px 21px 0px rgba(0, 0, 0, 0.47);
        box-shadow: 0px -3px 21px 0px rgba(0, 0, 0, 0.47);
    }
    .ss {
        flex: 1;
    }

    .seek {
        height: 3px;
        border-radius: 1.5px;
        width: 60%;
        background: var(--highlight);
        position: relative;
    }

    .seek-container {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
    }

    .seek::before {
        content: "";
        position: absolute;
        border-radius: 1.5px;
        width: var(--data-percent);
        height: 100%;
        background: var(--contrast);
        left: 0;
        top: 0;
        bottom: 0;
    }

    .playbar {
        flex: 2;
        justify-content: center;
        align-items: center;
        display: flex;
        flex-direction: column;
    }
    .track-left img {
        width: 64px;
        height: 64px;
        border-radius: 12px;
    }
    .track-info {
        display: flex;
        align-items: center;
    }
    .track-right,
    .title,
    .title h1 {
        font-size: 14px;
    }
    .title h1 {
        margin-right: 16px;
    }

    .controls {
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .controls button {
        width: 32px;
        height: 32px;
        margin: 8px;
    }
    button {
        border: none;
        border-radius: 4px;
        outline: none;
        cursor: pointer;
        background: none;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    button:hover {
        background: var(--highlight);
    }

    .track-right {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .sub-txt {
        text-transform: uppercase;
        font-size: 10px;
        letter-spacing: 2px;
    }
    .artist-txt {
        font-weight: 900;
    }
    .sub-txt,
    .artist-txt {
        color: var(--contrast);
    }
    .track-left {
        margin-left: 16px;
        margin-right: 16px;
    }

    .title {
        display: flex;
        align-items: center;
    }
    .misc-controls {
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }
</style>
