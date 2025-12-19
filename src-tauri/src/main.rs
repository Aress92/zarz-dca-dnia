#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_autostart::MacosLauncher;

// Otwórz okno widgetu
#[tauri::command]
fn open_widget(app: AppHandle) -> Result<(), String> {
    // Sprawdź czy okno widgetu już istnieje
    if let Some(window) = app.get_webview_window("widget") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Stwórz nowe okno widgetu - używamy query param dla detekcji
    WebviewWindowBuilder::new(
        &app,
        "widget",
        WebviewUrl::App("index.html?widget=true".into())
    )
    .title("Zarządca Dnia - Widget")
    .inner_size(320.0, 400.0)
    .min_inner_size(280.0, 300.0)
    .max_inner_size(400.0, 600.0)
    .resizable(true)
    .decorations(true)
    .always_on_top(true)
    .skip_taskbar(false)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

// Zamknij okno widgetu
#[tauri::command]
fn close_widget(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("widget") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Sprawdź czy widget jest otwarty
#[tauri::command]
fn is_widget_open(app: AppHandle) -> bool {
    app.get_webview_window("widget").is_some()
}

// Sprawdź status autostartu
#[tauri::command]
fn get_autostart_enabled(app: AppHandle) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch()
        .is_enabled()
        .map_err(|e| e.to_string())
}

// Włącz/wyłącz autostart
#[tauri::command]
fn set_autostart_enabled(app: AppHandle, enabled: bool) -> Result<(), String> {
    use tauri_plugin_autostart::ManagerExt;
    let autostart = app.autolaunch();

    if enabled {
        autostart.enable().map_err(|e| e.to_string())
    } else {
        autostart.disable().map_err(|e| e.to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .invoke_handler(tauri::generate_handler![
            open_widget,
            close_widget,
            is_widget_open,
            get_autostart_enabled,
            set_autostart_enabled
        ])
        .run(tauri::generate_context!())
        .expect("Błąd podczas uruchamiania aplikacji");
}
