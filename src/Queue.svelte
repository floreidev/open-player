<script lang="ts" context="module">
    let q: HTMLElement;
    export let isQueueOpened: boolean;
    export function toggleQueue() {
        if (isQueueOpened) q.classList.remove("q-active");
        else q.classList.add("q-active");
        isQueueOpened = !isQueueOpened;
    }

</script>


<script lang="ts">
    import { getContext } from "svelte";

    import { player } from "./audioManager";
    import type { Writable } from "svelte/store";
    $: queueItems = [] as Array<Track | undefined>;
    let metaDat: MetaFile | null = null;
    let metaFile: Writable<MetaFile> = getContext("fileMeta");
    metaFile.subscribe((v) => {
        metaDat = v;
    });

    // new code
    $: player.addEventListener("playingChanged", updateQ)
    $: player.addEventListener("queueChanged", updateQ);
    const updateQ = () => {
        let uQueueItems = player.getQueue();
        queueItems = uQueueItems.map((v) => metaDat?.tracks[v])
    }
</script>

<div bind:this={q} class="queue">
    <div class="q-container">
        <h1>Queue</h1>
{#each queueItems as qItem, i}
    {#if qItem && (i >= player.queueIndex)}
        <button on:click={() => player.skipTo(i)} class="q-item">
            <p>{qItem.title}</p>
            <p class="artist">{qItem.artistName}</p>
        </button>
    {/if}
{/each}
    </div>
</div>

<style>
    h1 {
        padding: 16px 16px 16px 24px;
        background: var(--bg-tint);
    }

p, button {
        text-overflow: ellipsis;
        flex-wrap: nowrap;
        white-space: nowrap;
        overflow: hidden;
    }
    .artist {
        color: var(--contrast);
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
    .queue {
        right: -384px;
        top: 0;
        bottom: 96px;
        width: 384px;
        background: var(--bg-tint);
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 10;
        transition: 0.25s ease-in-out;
        color: white;
        padding-bottom: 32px;
    }
    .q-container {
        width: 100%;
        min-height: 100%;
        flex: 1;
        overflow-y: scroll;
    }



    .q-item {
        margin-left: 16px;
        margin-right: 16px;
        border-radius: 8px;
        background: var(--bg-tint);
        height: 52px !important;
        flex: 1;
        display: flex;
        justify-content: center;
        flex-direction: column;
        padding-left: 8px;
        cursor: pointer;
        user-select: none;
        outline: none;
        border: none;
        color: white;
        width: calc(100% - 32px);
        font-size: 14px;
        font-family: 'Figtree';
    }
    .q-item:hover, .q-item:active, .q-item:focus {
        background: var(--bg);
    }
    :global(.q-active) {
        right: 0 !important;
    }
</style>
