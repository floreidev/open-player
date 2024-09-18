// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::Path;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::{MetadataOptions, StandardTagKey};
use symphonia::core::probe::Hint;
use uuid::Uuid;

#[tauri::command]
fn make_folders(base_path: String) -> HashMap<String, HashMap<String, String>>{
    let base_path = Path::new(&base_path);
    let music_path = base_path.join("Music");
    let open_player_path = music_path.join("OpenPlayer");
    let playlist_path = open_player_path.join("Playlists");
    let album_cover_path = open_player_path.join("AlbumCovers");

    if !music_path.is_dir() {
        let _ = fs::create_dir(&music_path);
    }
    if !open_player_path.is_dir() {
        let _ = fs::create_dir(&open_player_path);
    }
    if !playlist_path.is_dir() {
        let _ = fs::create_dir(&playlist_path);
    }
    if !album_cover_path.is_dir() {
        let _ = fs::create_dir(&album_cover_path);
    }

    let meta_file = playlist_path.join("__META__.json");
    let mut map = HashMap::new();
    if !meta_file.is_file() {
        let _ = fs::File::create(&meta_file);
        let sw = fs::OpenOptions::new().write(true).open(meta_file);
        match sw {
            Err(_) => map = HashMap::new(),
            Ok(mut file) => {
                let _ = file.write_all(
                    b"{\"tracks\": {}, \"albums\": {}, \"artists\": {}, \"playlists\": []}",
                );
                map = get_all_meta(music_path.to_str().unwrap().to_owned(), album_cover_path.to_str().unwrap().to_owned())
            }
        }
    }
    map
}

#[tauri::command]
fn generate_id() -> String {
    return Uuid::new_v4().as_simple().to_string();
}

#[tauri::command]
fn get_all_meta(path: String, album_cover_path: String) -> HashMap<String, HashMap<String, String>> {
    let path = Path::new(&path);
    let files = fs::read_dir(path).unwrap();
    let mut full_map: HashMap<String, HashMap<String, String>> = HashMap::new();
    for file in files {
        let dir_entry = file.unwrap();
        let full_path = &path.join(dir_entry.file_name());
        let file = Path::new(&full_path);
        let isf = &file.is_file();
        if *isf {
            let ext = &file.extension().unwrap().to_ascii_lowercase();
            if ext == "mp3" {
                full_map.insert(generate_id(), get_meta(full_path.to_str().unwrap().to_owned(), ext.clone().into_string().unwrap(), album_cover_path.clone()));
            }
        }
    }
    full_map

}

#[tauri::command]
fn get_meta(path: String, ext: String, ac_path: String) -> HashMap<String, String> {
    // Open the media source.
    let src = std::fs::File::open(&path).expect("failed to open media");

    // Create the media source stream.
    let mss = MediaSourceStream::new(Box::new(src), Default::default());

    // Create a probe hint using the file's extension. [Optional]
    let mut hint = Hint::new();
    hint.with_extension(&ext);

    // Use the default options for metadata and format readers.
    let meta_opts: MetadataOptions = Default::default();
    let fmt_opts: FormatOptions = Default::default();

    // Probe the media source.
    let mut probed = symphonia::default::get_probe()
        .format(&hint, mss, &fmt_opts, &meta_opts)
        .expect("unsupported format");

    match probed.metadata.get() {
        None => HashMap::new(),
        Some(meta) => {
            let mut map: HashMap<String, String> = HashMap::new();
            match meta.current() {
                None => HashMap::new(),
                Some(meta_current) => {
                    let mut album = "none".to_owned();
                    for t in meta_current.tags() {
                        match t.std_key {
                            None => {
                                map.insert("NoKey".to_owned(), t.value.to_string());
                            },
                            Some(tag) => {
                                map.insert(format!("{:?}", tag), t.value.to_string());
                            }
                        }
                        if t.std_key.is_some()
                            && matches!(t.std_key.unwrap(), StandardTagKey::Album)
                        {
                            album = t.value.to_string()
                        }
                    }
                    map.insert("_PATH".to_string(), path.clone());
                    let vis = meta_current.visuals();
                    if vis.len() > 0 {
                        let album_cover_path = Path::new(&ac_path).join(format!("{}.png", album));
                        if !album_cover_path.exists() {
                            let album_cover_file = fs::File::create(&album_cover_path);
                            match album_cover_file {
                                Err(_) => {}
                                Ok(_) => {
                                    let sw =
                                        fs::OpenOptions::new().write(true).open(&album_cover_path);
                                    let _ = sw.unwrap().write_all(&vis[0].data);
                                }
                            }
                        }
                    }
                    map
                }
            }
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![make_folders, get_all_meta, get_meta, generate_id])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
