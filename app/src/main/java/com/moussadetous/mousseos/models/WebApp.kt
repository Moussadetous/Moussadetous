package com.moussadetous.mousseos.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import java.io.File

@Parcelize
data class WebApp(
    val id: String,
    val name: String,
    val packageName: String,
    val version: String = "1.0",
    val description: String = "",
    val iconUrl: String? = null,
    val localIconPath: String? = null,
    val indexPath: String,
    val basePath: String,
    val size: Long = 0,
    val installedAt: Long = System.currentTimeMillis(),
    val lastUpdated: Long = System.currentTimeMillis(),
    val isFavorite: Boolean = false
) : Parcelable {
    
    val installationDirectory: File
        get() = File(basePath)
    
    val indexFile: File
        get() = File(basePath, indexPath)
    
    fun exists(): Boolean = installationDirectory.exists() && indexFile.exists()
    
    fun getIconFile(): File? {
        localIconPath?.let { path ->
            val iconFile = File(path)
            if (iconFile.exists()) return iconFile
        }
        return null
    }
    
    fun getSizeFormatted(): String {
        return when {
            size >= 1024 * 1024 -> "%.2f MB".format(size / (1024.0 * 1024.0))
            size >= 1024 -> "%.2f KB".format(size / 1024.0)
            else -> "$size B"
        }
    }
}
