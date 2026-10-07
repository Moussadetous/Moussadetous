package com.moussadetous.mousseos.managers

import android.content.Context
import android.content.SharedPreferences
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.moussadetous.mousseos.models.WebApp
import com.moussadetous.mousseos.utils.AppConstants
import com.moussadetous.mousseos.utils.FileUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import net.lingala.zip4j.ZipFile
import java.io.File
import java.io.FileOutputStream

class AppManager(private val context: Context) {
    private val TAG = "AppManager"
    private val sharedPreferences: SharedPreferences by lazy {
        context.getSharedPreferences(AppConstants.PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    private val appsDir: File by lazy {
        FileUtils.getAppDirectory(context)
    }
    
    private val iconsDir: File by lazy {
        FileUtils.getIconsDirectory(context)
    }
    
    private val tempDir: File by lazy {
        FileUtils.getTempDirectory(context)
    }
    
    // Get all installed apps
    suspend fun getInstalledApps(): List<WebApp> = withContext(Dispatchers.IO) {
        val apps = mutableListOf<WebApp>()
        
        if (!appsDir.exists()) return@withContext apps
        
        appsDir.listFiles()?.forEach { appDir ->
            if (appDir.isDirectory) {
                val appInfoFile = File(appDir, "app.info")
                if (appInfoFile.exists()) {
                    try {
                        val appInfo = appInfoFile.readText()
                        val app = parseAppInfo(appInfo, appDir)
                        apps.add(app)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error reading app info for ${appDir.name}", e)
                    }
                }
            }
        }
        
        return@withContext apps.sortedBy { it.name }
    }
    
    // Get app by ID
    suspend fun getAppById(appId: String): WebApp? = withContext(Dispatchers.IO) {
        val appDir = File(appsDir, appId)
        if (!appDir.exists()) return@withContext null
        
        val appInfoFile = File(appDir, "app.info")
        if (!appInfoFile.exists()) return@withContext null
        
        try {
            val appInfo = appInfoFile.readText()
            return@withContext parseAppInfo(appInfo, appDir)
        } catch (e: Exception) {
            Log.e(TAG, "Error reading app info for $appId", e)
            return@withContext null
        }
    }
    
    // Get app by path
    suspend fun getAppByPath(appPath: String): WebApp? = withContext(Dispatchers.IO) {
        val appDir = File(appPath)
        if (!appDir.exists()) return@withContext null
        
        val appInfoFile = File(appDir, "app.info")
        if (!appInfoFile.exists()) return@withContext null
        
        try {
            val appInfo = appInfoFile.readText()
            return@withContext parseAppInfo(appInfo, appDir)
        } catch (e: Exception) {
            Log.e(TAG, "Error reading app info for $appPath", e)
            return@withContext null
        }
    }
    
    // Install app from ZIP file
    suspend fun installApp(
        zipUri: Uri,
        appName: String,
        appDescription: String = "",
        iconUrl: String? = null
    ): Result<WebApp> = withContext(Dispatchers.IO) {
        return@withContext try {
            // Copy ZIP to temp directory
            val tempZipFile = File(tempDir, "temp_${System.currentTimeMillis()}.zip")
            if (!FileUtils.copyFileFromUri(context, zipUri, tempZipFile)) {
                return@withContext Result.failure(Exception("Failed to copy ZIP file"))
            }
            
            // Extract ZIP to temp directory
            val tempExtractDir = File(tempDir, "extract_${System.currentTimeMillis()}")
            if (!tempExtractDir.mkdirs()) {
                return@withContext Result.failure(Exception("Failed to create temp directory"))
            }
            
            if (!FileUtils.extractZipFile(tempZipFile, tempExtractDir)) {
                return@withContext Result.failure(Exception("Failed to extract ZIP file"))
            }
            
            // Find index.html
            val indexFile = FileUtils.findIndexHtml(tempExtractDir)
            if (indexFile == null) {
                return@withContext Result.failure(Exception("No index.html found in ZIP"))
            }
            
            // Generate app ID
            val appId = FileUtils.generateAppId(appName)
            val appDir = File(appsDir, appId)
            
            // Check if app already exists
            if (appDir.exists()) {
                return@withContext Result.failure(Exception("App with this name already exists"))
            }
            
            // Create app directory
            if (!appDir.mkdirs()) {
                return@withContext Result.failure(Exception("Failed to create app directory"))
            }
            
            // Move extracted files to app directory
            tempExtractDir.listFiles()?.forEach { file ->
                val targetFile = File(appDir, file.name)
                if (file.isDirectory) {
                    FileUtils.copyFile(file, targetFile)
                } else {
                    FileUtils.copyFile(file, targetFile)
                }
            }
            
            // Calculate size
            val size = FileUtils.getDirectorySize(appDir)
            
            // Create relative path for index
            val relativeIndexPath = indexFile.path.substring(tempExtractDir.path.length + 1)
            
            // Create WebApp object
            val packageName = "com.moussadetous.mousseos.app.$appId"
            val webApp = WebApp(
                id = appId,
                name = appName,
                packageName = packageName,
                version = AppConstants.DEFAULT_APP_VERSION,
                description = appDescription,
                iconUrl = iconUrl,
                localIconPath = null,
                indexPath = relativeIndexPath,
                basePath = appDir.absolutePath,
                size = size,
                installedAt = System.currentTimeMillis(),
                lastUpdated = System.currentTimeMillis()
            )
            
            // Save app info
            saveAppInfo(webApp)
            
            // Cleanup temp files
            tempZipFile.delete()
            FileUtils.deleteDirectoryRecursively(tempExtractDir)
            
            Result.success(webApp)
        } catch (e: Exception) {
            Log.e(TAG, "Error installing app", e)
            Result.failure(e)
        }
    }
    
    // Install app from File
    suspend fun installAppFromFile(
        zipFile: File,
        appName: String,
        appDescription: String = "",
        iconUrl: String? = null
    ): Result<WebApp> = withContext(Dispatchers.IO) {
        return@withContext try {
            // Extract ZIP to temp directory
            val tempExtractDir = File(tempDir, "extract_${System.currentTimeMillis()}")
            if (!tempExtractDir.mkdirs()) {
                return@withContext Result.failure(Exception("Failed to create temp directory"))
            }
            
            if (!FileUtils.extractZipFile(zipFile, tempExtractDir)) {
                return@withContext Result.failure(Exception("Failed to extract ZIP file"))
            }
            
            // Find index.html
            val indexFile = FileUtils.findIndexHtml(tempExtractDir)
            if (indexFile == null) {
                return@withContext Result.failure(Exception("No index.html found in ZIP"))
            }
            
            // Generate app ID
            val appId = FileUtils.generateAppId(appName)
            val appDir = File(appsDir, appId)
            
            // Check if app already exists
            if (appDir.exists()) {
                return@withContext Result.failure(Exception("App with this name already exists"))
            }
            
            // Create app directory
            if (!appDir.mkdirs()) {
                return@withContext Result.failure(Exception("Failed to create app directory"))
            }
            
            // Move extracted files to app directory
            tempExtractDir.listFiles()?.forEach { file ->
                val targetFile = File(appDir, file.name)
                if (file.isDirectory) {
                    file.copyRecursively(targetFile, overwrite = true)
                } else {
                    file.copyTo(targetFile, overwrite = true)
                }
            }
            
            // Calculate size
            val size = FileUtils.getDirectorySize(appDir)
            
            // Create relative path for index
            val relativeIndexPath = indexFile.path.substring(tempExtractDir.path.length + 1)
            
            // Create WebApp object
            val packageName = "com.moussadetous.mousseos.app.$appId"
            val webApp = WebApp(
                id = appId,
                name = appName,
                packageName = packageName,
                version = AppConstants.DEFAULT_APP_VERSION,
                description = appDescription,
                iconUrl = iconUrl,
                localIconPath = null,
                indexPath = relativeIndexPath,
                basePath = appDir.absolutePath,
                size = size,
                installedAt = System.currentTimeMillis(),
                lastUpdated = System.currentTimeMillis()
            )
            
            // Save app info
            saveAppInfo(webApp)
            
            // Cleanup temp files
            FileUtils.deleteDirectoryRecursively(tempExtractDir)
            
            Result.success(webApp)
        } catch (e: Exception) {
            Log.e(TAG, "Error installing app from file", e)
            Result.failure(e)
        }
    }
    
    // Uninstall app
    suspend fun uninstallApp(appId: String): Boolean = withContext(Dispatchers.IO) {
        return@withContext try {
            val appDir = File(appsDir, appId)
            if (!appDir.exists()) return@withContext false
            
            // Delete app directory
            FileUtils.deleteDirectoryRecursively(appDir)
            
            // Delete icon if exists
            getAppById(appId)?.localIconPath?.let { iconPath ->
                File(iconPath).delete()
            }
            
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error uninstalling app $appId", e)
            false
        }
    }
    
    // Update app icon from URL
    suspend fun updateAppIcon(appId: String, iconUrl: String): Boolean = withContext(Dispatchers.IO) {
        return@withContext try {
            // Download icon (simplified - in production use a proper download manager)
            // For now, we'll just store the URL
            getAppById(appId)?.let { app ->
                val updatedApp = app.copy(iconUrl = iconUrl)
                saveAppInfo(updatedApp)
                return@withContext true
            }
            false
        } catch (e: Exception) {
            Log.e(TAG, "Error updating app icon", e)
            false
        }
    }
    
    // Update app icon from local file
    suspend fun updateAppIcon(appId: String, iconFile: File): Boolean = withContext(Dispatchers.IO) {
        return@withContext try {
            getAppById(appId)?.let { app ->
                // Copy icon to icons directory
                val iconName = "${appId}_icon.png"
                val targetIcon = File(iconsDir, iconName)
                if (iconFile.copyTo(targetIcon, overwrite = true)) {
                    val updatedApp = app.copy(localIconPath = targetIcon.absolutePath)
                    saveAppInfo(updatedApp)
                    return@withContext true
                }
            }
            false
        } catch (e: Exception) {
            Log.e(TAG, "Error updating app icon from file", e)
            false
        }
    }
    
    // Update app info
    suspend fun updateAppInfo(appId: String, name: String? = null, description: String? = null): Boolean = withContext(Dispatchers.IO) {
        return@withContext try {
            getAppById(appId)?.let { app ->
                val updatedApp = app.copy(
                    name = name ?: app.name,
                    description = description ?: app.description,
                    lastUpdated = System.currentTimeMillis()
                )
                saveAppInfo(updatedApp)
                return@withContext true
            }
            false
        } catch (e: Exception) {
            Log.e(TAG, "Error updating app info", e)
            false
        }
    }
    
    // Toggle favorite status
    suspend fun toggleFavorite(appId: String): Boolean = withContext(Dispatchers.IO) {
        return@withContext try {
            getAppById(appId)?.let { app ->
                val updatedApp = app.copy(isFavorite = !app.isFavorite)
                saveAppInfo(updatedApp)
                return@withContext true
            }
            false
        } catch (e: Exception) {
            Log.e(TAG, "Error toggling favorite", e)
            false
        }
    }
    
    // Check if app exists
    suspend fun appExists(appId: String): Boolean = withContext(Dispatchers.IO) {
        return@withContext File(appsDir, appId).exists()
    }
    
    // Check if app exists by name
    suspend fun appExistsByName(appName: String): Boolean = withContext(Dispatchers.IO) {
        val appId = FileUtils.generateAppId(appName)
        return@withContext File(appsDir, appId).exists()
    }
    
    // Get app count
    suspend fun getAppCount(): Int = withContext(Dispatchers.IO) {
        return@withContext appsDir.listFiles()?.count { it.isDirectory } ?: 0
    }
    
    // Get total apps size
    suspend fun getTotalAppsSize(): Long = withContext(Dispatchers.IO) {
        var totalSize: Long = 0
        appsDir.listFiles()?.forEach { appDir ->
            if (appDir.isDirectory) {
                totalSize += FileUtils.getDirectorySize(appDir)
            }
        }
        return@withContext totalSize
    }
    
    // Parse app info from file
    private fun parseAppInfo(appInfo: String, appDir: File): WebApp {
        val lines = appInfo.lines()
        val map = mutableMapOf<String, String>()
        
        lines.forEach { line ->
            val parts = line.split("=", limit = 2)
            if (parts.size == 2) {
                map[parts[0].trim()] = parts[1].trim()
            }
        }
        
        return WebApp(
            id = appDir.name,
            name = map["name"] ?: appDir.name,
            packageName = map["packageName"] ?: "com.moussadetous.mousseos.app.${appDir.name}",
            version = map["version"] ?: "1.0",
            description = map["description"] ?: "",
            iconUrl = map["iconUrl"],
            localIconPath = map["localIconPath"],
            indexPath = map["indexPath"] ?: "index.html",
            basePath = appDir.absolutePath,
            size = map["size"]?.toLong() ?: FileUtils.getDirectorySize(appDir),
            installedAt = map["installedAt"]?.toLong() ?: System.currentTimeMillis(),
            lastUpdated = map["lastUpdated"]?.toLong() ?: System.currentTimeMillis(),
            isFavorite = map["isFavorite"]?.toBoolean() ?: false
        )
    }
    
    // Save app info to file
    private fun saveAppInfo(app: WebApp) {
        val appInfoContent = buildString {
            appendLine("name=${app.name}")
            appendLine("packageName=${app.packageName}")
            appendLine("version=${app.version}")
            appendLine("description=${app.description}")
            appendLine("iconUrl=${app.iconUrl}")
            appendLine("localIconPath=${app.localIconPath}")
            appendLine("indexPath=${app.indexPath}")
            appendLine("size=${app.size}")
            appendLine("installedAt=${app.installedAt}")
            appendLine("lastUpdated=${app.lastUpdated}")
            appendLine("isFavorite=${app.isFavorite}")
        }
        
        val appInfoFile = File(app.basePath, "app.info")
        appInfoFile.writeText(appInfoContent)
    }
    
    // Get app directory
    fun getAppDirectory(appId: String): File {
        return File(appsDir, appId)
    }
    
    // Get index file for app
    fun getIndexFile(app: WebApp): File? {
        val indexFile = File(app.basePath, app.indexPath)
        return if (indexFile.exists()) indexFile else null
    }
    
    // Export app as ZIP
    suspend fun exportApp(appId: String, outputFile: File): Boolean = withContext(Dispatchers.IO) {
        return@withContext try {
            val appDir = File(appsDir, appId)
            if (!appDir.exists()) return@withContext false
            
            FileUtils.createZipFile(appDir, outputFile)
        } catch (e: Exception) {
            Log.e(TAG, "Error exporting app $appId", e)
            false
        }
    }
}
