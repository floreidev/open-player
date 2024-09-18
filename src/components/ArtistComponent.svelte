<script lang="ts">
    import AlbumComponent from "./AlbumComponent.svelte";
    import { player } from "../utils/audioManager";

export let selected: Artist;
</script>
<div class="container">
    <div class="title-area">
        <h1>{selected.name}</h1>
    </div>
    <div class="albums">
        {#each selected.albums || [] as album}
        <AlbumComponent playFunction={(a, b, c) => player.playTrackFromArtist(a, b, c)} playData={selected.id} doOverflow={false} selected={album}></AlbumComponent>
    {/each}
    </div>
    
</div>
<style>
    .title-area {
        background: linear-gradient(to bottom, var(--light), var(--bg));
        width: 100%;
        height: 256px;
        padding: 64px;
        color: white;
    }
.albums {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: fit-content;
        background: var(--bg);
    }
    .container {
        flex: 1; width: 100%; height: 100%; display: flex; flex-direction: column;
        background: none;
        padding-bottom: 64px;
        background: var(--bg);
        min-height: calc(100% - 96px);
        font-family: 'Figtree';

        overflow-y: scroll;
    }
    .container::-webkit-scrollbar {
	height: 14px;
	width:  14px;
}

.container::-webkit-scrollbar-corner {
	background: var(--contrast);
}

.container::-webkit-scrollbar-thumb {
	background: #000;
	min-width: 20px;
	padding-left: 7px;
	padding-right: 7px;
	-webkit-background-clip: border-box, border-box, content-box;
    cursor: pointer;
}

.container::-webkit-scrollbar-thumb:vertical {
	background: var(--light);
	min-height: 20px;
	padding-top: 7px;
	padding-bottom: 7px;
	-webkit-background-clip: border-box, border-box, content-box;
}
</style>