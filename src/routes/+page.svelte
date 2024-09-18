<script lang="ts">
    import Seekbar from "../components/Seekbar.svelte";
    import Viewport from "../components/Viewport.svelte";
    import { join, homeDir } from "@tauri-apps/api/path";
    import Test from "../components/Test.svelte";
    import { invoke } from "@tauri-apps/api/tauri";
    import AlbumComponent from "../components/AlbumComponent.svelte";
    import ArtistComponent from "../components/ArtistComponent.svelte";
    import * as audioManager from "../utils/audioManager";
    import { register } from "@tauri-apps/api/globalShortcut";
    import Queue from "../components/Queue.svelte";
    import { metaFile } from "../utils/metaManager";
    import Sidebar from "../components/Sidebar.svelte";

    register("CommandOrControl+Shift+Alt+Right", () => {
        audioManager.next();
    });

    register("CommandOrControl+Shift+Alt+Left", () => {
        audioManager.previous();
    });


    getMeta();
    async function getMeta() {
        var ad = await homeDir();
        let x = await invoke("make_folders", {basePath: ad}) as RustReturn
        console.log(x);
        var mDir = await join(ad, "Music");
        var opDir = await join(mDir, "OpenPlayer");
        var playlistDir = await join(opDir, "Playlists");
        var metaDir = await join(playlistDir, "__META__.json")
        if(!x || Object.values(x).length == 0) await metaFile.loadFromFile(metaDir);
        else await metaFile.firstLoad(x, metaDir);        
        return metaFile;
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
            playlists={meta.playlists.map((v) => {
                return {id: v, trackIds: [""], title: "", description: "",tracks: [], type: 3 }
            })}
            metaAlbums={Object.values(meta.albums)}
            metaArtists={Object.values(meta.artists)}
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
