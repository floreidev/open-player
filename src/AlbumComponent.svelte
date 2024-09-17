<script lang="ts">
    import * as audioManager from "./audioManager";
    import TrackList from "./TrackList.svelte";
    export let doOverflow: boolean = true;
    export let selected: Album;
</script>
<div class="album-container" style={doOverflow ? "overflow-y: scroll; max-height: 100%;" : "overflow-y: hidden;"}>
    
<div class="title-area" style="{doOverflow ? "background: linear-gradient(to bottom, var(--light), var(--bg));" : "background: var(--bg);"}">
    <h1>{selected.name}</h1>
<h2>{selected.artistName}</h2>
</div>
<TrackList clickCallback={(i) => audioManager.playTrackFromAlbum(selected.id, i)} items={selected.tracks || []}></TrackList>

</div>
<style>
        ::-webkit-scrollbar {
	height: 14px;
	width:  14px;
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
        flex-direction: column;
    }
    .album-container {
        font-family: 'Figtree';

    background: var(--bg);
    color: white;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
}


</style>
