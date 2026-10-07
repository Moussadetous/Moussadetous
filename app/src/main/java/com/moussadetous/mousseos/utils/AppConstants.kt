package com.moussadetous.mousseos.utils

object AppConstants {
    // App directories
    const val APP_DIR_NAME = "MousseOS_Apps"
    const val TEMP_DIR_NAME = "MousseOS_Temp"
    const val ICONS_DIR_NAME = "icons"
    const val DEFAULT_INDEX_FILE = "index.html"
    
    // File extensions
    const val ZIP_EXTENSION = ".zip"
    const val HTML_EXTENSION = ".html"
    
    // Preferences
    const val PREFS_NAME = "MousseOS_Prefs"
    const val PREFS_FIRST_LAUNCH = "first_launch"
    const val PREFS_LAST_INSTALL_DIR = "last_install_dir"
    
    // Request codes
    const val REQUEST_CODE_FILE_PICKER = 1001
    const val REQUEST_CODE_STORAGE_PERMISSION = 1002
    const val REQUEST_CODE_INSTALL_PERMISSION = 1003
    
    // MIME types
    const val MIME_TYPE_ZIP = "application/zip"
    const val MIME_TYPE_HTML = "text/html"
    
    // Intent extras
    const val EXTRA_APP_ID = "extra_app_id"
    const val EXTRA_APP_PATH = "extra_app_path"
    const val EXTRA_APP_NAME = "extra_app_name"
    
    // Default values
    const val DEFAULT_APP_NAME = "Untitled App"
    const val DEFAULT_APP_VERSION = "1.0"
    
    // Limits
    const val MAX_APP_NAME_LENGTH = 50
    const val MAX_APP_DESCRIPTION_LENGTH = 500
    
    // WebView settings
    const val WEBVIEW_USER_AGENT = "MousseOS/1.0"
    const val WEBVIEW_TIMEOUT = 30000L // 30 seconds
}
