<script lang="ts">
    import { playAll } from "./audioManager";

    export let playlists: Playlist[] = [];
    export let metaArtists: Artist[] = [];
    export let metaAlbums: Album[] = [];
    export let setSelected: (selected: any, route: string) => void;

</script>

<div class="sidebar">
    <button class="db" on:click={() => playAll()}>Play All</button>
    <p class="sidebar-title">PLAYLISTS</p>
    <button class="db">Create Playlist</button>
    <div class="playlists">
        {#each playlists.sort((a, b) => a.title < b.title ? -1 : 1) as playlist}
            <button class="db playlist" on:click={() => setSelected(playlist, "Playlist")}
                >{playlist.title}</button
            >
        {/each}
    </div>
    <p class="sidebar-title">ALBUMS</p>
    <div class="albums">
        {#each metaAlbums.sort((a, b) => a.name < b.name ? -1 : 1) as album}
            <button class="db playlist" on:click={() => setSelected(album, "Album")}>{album.name}</button
            >
        {/each}
    </div>
    <p class="sidebar-title">ARTISTS</p>
    <div class="artists">
        {#each metaArtists.sort((a, b) => a.name < b.name ? -1 : 1) as artist}
            <button class="db playlist" on:click={() => setSelected(artist, "Artist")}
                >{artist.name}</button
            >
        {/each}
    </div>
</div>

<style>
    .db {
        background: none;
        outline: none;
        border: none;
        color: white;
        margin: 4px 0px 4px 24px;
        border-radius: 4px;
        padding: 8px;
        width: calc(100% - 48px);
        text-align: left;
        cursor: pointer;
        font-family: 'Figtree';
        user-select: none;
    }

    .db:hover, .db:active, .db:focus {
        background: var(--light);
    }
    .sidebar {
        font-family: 'Figtree';
        width: 240px;
        min-width: 240px;
        background: var(--bg);
        height: 100%;
        color: white;
        padding-top: 24px;
        overflow-y: scroll;
    }

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


    .sidebar-title {
        padding-left: 24px;
        color: var(--contrast);
        text-transform: uppercase;
        font-size: 14px;
        font-weight: 300;
        letter-spacing: 2px;
    }
</style>
