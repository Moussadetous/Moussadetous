package com.moussadetous.mousseos.utils

import android.content.Context
import android.net.Uri
import android.os.Environment
import android.util.Log
import net.lingala.zip4j.ZipFile
import net.lingala.zip4j.model.ZipParameters
import net.lingala.zip4j.model.enums.CompressionLevel
import net.lingala.zip4j.model.enums.CompressionMethod
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

object FileUtils {
    private const val TAG = "FileUtils"
    
    fun getAppDirectory(context: Context): File {
        val externalFilesDir = context.getExternalFilesDir(null)
        return File(externalFilesDir, AppConstants.APP_DIR_NAME).apply {
            if (!exists()) mkdirs()
        }
    }
    
    fun getTempDirectory(context: Context): File {
        return File(context.cacheDir, AppConstants.TEMP_DIR_NAME).apply {
            if (!exists()) mkdirs()
        }
    }
    
    fun getIconsDirectory(context: Context): File {
        return File(getAppDirectory(context), AppConstants.ICONS_DIR_NAME).apply {
            if (!exists()) mkdirs()
        }
    }
    
    fun getAppInstallationDirectory(context: Context, appId: String): File {
        return File(getAppDirectory(context), appId).apply {
            if (!exists()) mkdirs()
        }
    }
    
    fun extractZipFile(zipFile: File, targetDir: File): Boolean {
        return try {
            val zip = ZipFile(zipFile)
            zip.extractAll(targetDir.absolutePath)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting ZIP file", e)
            false
        }
    }
    
    fun extractZipFileWithProgress(
        zipFile: File,
        targetDir: File,
        onProgress: (Int) -> Unit
    ): Boolean {
        return try {
            val zip = ZipFile(zipFile)
            zip.setProgressMonitor(object : net.lingala.zip4j.progress.ProgressMonitor {
                override fun update(percentDone: Int) {
                    onProgress(percentDone)
                }
            })
            zip.extractAll(targetDir.absolutePath)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error extracting ZIP file", e)
            false
        }
    }
    
    fun findIndexHtml(directory: File): File? {
        val indexFile = File(directory, AppConstants.DEFAULT_INDEX_FILE)
        if (indexFile.exists()) return indexFile
        
        // Search recursively
        return directory.walk()
            .filter { it.isFile && it.name.equals(AppConstants.DEFAULT_INDEX_FILE, ignoreCase = true) }
            .firstOrNull()
    }
    
    fun findHtmlFiles(directory: File): List<File> {
        return directory.walk()
            .filter { it.isFile && it.name.endsWith(AppConstants.HTML_EXTENSION, ignoreCase = true) }
            .toList()
    }
    
    fun copyFileFromUri(context: Context, uri: Uri, destination: File): Boolean {
        return try {
            context.contentResolver.openInputStream(uri)?.use { inputStream ->
                FileOutputStream(destination).use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error copying file from URI", e)
            false
        }
    }
    
    fun copyFile(input: File, output: File): Boolean {
        return try {
            input.inputStream().use { inputStream ->
                output.outputStream().use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error copying file", e)
            false
        }
    }
    
    fun deleteDirectoryRecursively(file: File): Boolean {
        return try {
            if (file.isDirectory) {
                file.listFiles()?.forEach { child ->
                    deleteDirectoryRecursively(child)
                }
            }
            file.delete()
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting directory", e)
            false
        }
    }
    
    fun getDirectorySize(directory: File): Long {
        var size: Long = 0
        if (directory.exists()) {
            val files = directory.listFiles()
            if (files != null) {
                for (file in files) {
                    size += if (file.isDirectory) {
                        getDirectorySize(file)
                    } else {
                        file.length()
                    }
                }
            }
        }
        return size
    }
    
    fun createZipFile(sourceDir: File, outputZip: File): Boolean {
        return try {
            val zipParameters = ZipParameters().apply {
                compressionMethod = CompressionMethod.DEFLATE
                compressionLevel = CompressionLevel.NORMAL
            }
            
            ZipFile(outputZip).use { zipFile ->
                zipFile.addFolder(sourceDir, zipParameters)
            }
            true
        } catch (e: Exception) {
            Log.e(TAG, "Error creating ZIP file", e)
            false
        }
    }
    
    fun getFileExtension(fileName: String): String {
        val lastDotIndex = fileName.lastIndexOf('.')
        return if (lastDotIndex >= 0) {
            fileName.substring(lastDotIndex)
        } else {
            ""
        }
    }
    
    fun generateAppId(name: String): String {
        return name
            .lowercase()
            .replace("[^a-z0-9]".toRegex(), "_")
            .replace("_+".toRegex(), "_")
            .trim('_')
    }
    
    fun sanitizeFileName(fileName: String): String {
        return fileName
            .replace("[<>:\"/\\\\|?*]".toRegex(), "_")
            .replace("\s+".toRegex(), " ")
            .trim()
    }
}
