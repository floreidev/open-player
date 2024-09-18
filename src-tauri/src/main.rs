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
                        map.insert(format!("{:?}", t.std_key), t.value.to_string());
                        if t.std_key.is_some() && matches!(t.std_key.unwrap(), StandardTagKey::Album) {
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
                            Err(_) => {},
                            Ok(_) => {
                              let sw = fs::OpenOptions::new().write(true).open(&album_cover_path);
                              let _ = sw.unwrap().write_all(&vis[0].data);
                            },
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
        .invoke_handler(tauri::generate_handler![get_meta])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
