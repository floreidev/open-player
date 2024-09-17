

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

type MetaFile = {
    playlists: string[],
    tracks: {[key: string]: Track},
    albums: {[key: string]: Album},
    artists: {[key: string]: Artist},
}