<script lang="ts">
    export let items: Track[];
    export let clickCallback: (i: number) => void;
    export let doOverflow: boolean;
</script>
<ol style="{doOverflow ? "overflow-y: scroll;" : ""}">
    {#each items as item, i}
    <li><button class="track" on:click={() => clickCallback(i)}><p class="l">{item.trackNum}. {item.title}</p> <p class="c">{item.artistName}</p> <p class="c">{item.albumName}</p> <p class="r">{item.length}</p></button></li>     
{/each}
</ol>

<style>
    ol {
        font-family: 'Figtree';

    display: flex;
    flex-direction: column; /* Stacks list items vertically */
    margin: 0px 64px 64px 64px;
    list-style: none;
    position: relative;
    flex-grow: 0; /* Prevent the list from growing more than its content */
}


    .c {
        text-align: center;
    }
    .l {
        text-align: left;
    }
    .r {
        text-align: right;
    }

    li {
        width: 100%;
        min-height: 48px;
    }
    .track {
        display: flex;
        width: 100%;
        height: 100%;
        border: none;
        border-top: 2px solid var(--light);
        border-radius: 12px;
        align-items: center;
        flex: 1;
        padding-left: 16px;
        padding-right: 16px;
        cursor: pointer;
        user-select: none;
        outline: none;
        background-color: var(--bg);
        color: white;
        font-size: 16px;
        font-family: 'Figtree';
    }
    
    .track:hover, .track:active, .track:focus {
        background: var(--light);
    }

    ::-webkit-scrollbar {
	height: 14px;
	width:  14px;
}
    p {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
    .track > * {
        flex: 1;
    }
</style>
