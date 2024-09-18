

type PlayerItem = {
    id: string,
    type?: PlayerItemType
}

type Playlist = PlayerItem & {
    title: string
    description: string,
    tracks: Track[],
    trackIds: string[],
}

type Track = PlayerItem & {
    title: string,
    artistId: string,
    artist?: Artist,
    artistName?: string,
    length: number,
    path: string,
    albumId: string,
    album?: Album,
    albumName?: string
    trackNum: number
}
enum UsedTags {
    Album = "Album",
    TrackTitle = "TrackTitle",
    Path = "_PATH",
    TrackNumber = "TrackNumber",
    Artist = "Artist"
}

type RustReturn = {
    [key: string]: {[key in UsedTags]: string}
}

type Artist = PlayerItem & {
    name: string,
    img?: string,
    albums?: Album[]
    albumIds: string[]
}

type Album = PlayerItem & {
    name: string,
    img?: string,
    tracks?: Track[],
    trackIds?: string[]
    artist?: Artist,
    artistName?: string,
    artistId: string
}

type PrimitiveMetaFile = {
    tracks: {[key: string]: Track}, artists: {[key: string]:Artist}, albums: {[key: string]: Album}, playlists: string[]
}