package com.moussadetous.mousseos

import android.app.Application
import android.util.Log
import com.moussadetous.mousseos.managers.AppManager
import com.moussadetous.mousseos.utils.AppConstants

class MousseOSApp : Application() {
    
    val appManager: AppManager by lazy {
        AppManager(this)
    }
    
    override fun onCreate() {
        super.onCreate()
        
        Log.d("MousseOSApp", "Application started")
        
        // Initialize app
        initializeApp()
    }
    
    private fun initializeApp() {
        // Create necessary directories
        val appDir = android.os.Environment.getExternalStoragePublicDirectory(
            android.os.Environment.DIRECTORY_DOWNLOADS
        )
        
        // Initialize app manager
        appManager
    }
}
