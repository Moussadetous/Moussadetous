package com.moussadetous.mousseos

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.moussadetous.mousseos.utils.AppConstants
import com.moussadetous.mousseos.utils.FileUtils
import com.squareup.picasso.Picasso
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AppDetailActivity : AppCompatActivity() {
    private lateinit var appIcon: ImageView
    private lateinit var appName: TextView
    private lateinit var appPackageName: TextView
    private lateinit var appDescription: TextView
    private lateinit var appVersion: TextView
    private lateinit var appSize: TextView
    private lateinit var appPath: TextView
    private lateinit var btnLaunch: Button
    private lateinit var btnUninstall: Button
    private lateinit var btnOpenFolder: Button
    
    private val appManager by lazy {
        (application as MousseOSApp).appManager
    }
    
    private var appId: String = ""
    private var appPath: String = ""
    private var currentApp: com.moussadetous.mousseos.models.WebApp? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_app_detail)
        
        initializeViews()
        setupToolbar()
        setupListeners()
        
        loadAppInfo()
    }
    
    private fun initializeViews() {
        appIcon = findViewById(R.id.appIcon)
        appName = findViewById(R.id.appName)
        appPackageName = findViewById(R.id.appPackageName)
        appDescription = findViewById(R.id.appDescription)
        appVersion = findViewById(R.id.appVersion)
        appSize = findViewById(R.id.appSize)
        appPath = findViewById(R.id.appPath)
        btnLaunch = findViewById(R.id.btnLaunch)
        btnUninstall = findViewById(R.id.btnUninstall)
        btnOpenFolder = findViewById(R.id.btnOpenFolder)
    }
    
    private fun setupToolbar() {
        val toolbar = findViewById<com.google.android.material.appbar.MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.apply {
            title = getString(R.string.detail_title)
            setDisplayHomeAsUpEnabled(true)
        }
        
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }
    }
    
    private fun setupListeners() {
        btnLaunch.setOnClickListener {
            currentApp?.let { app ->
                openApp(app)
            }
        }
        
        btnUninstall.setOnClickListener {
            currentApp?.let { app ->
                confirmUninstall(app)
            }
        }
        
        btnOpenFolder.setOnClickListener {
            currentApp?.let { app ->
                openAppFolder(app)
            }
        }
    }
    
    private fun loadAppInfo() {
        appId = intent.getStringExtra(AppConstants.EXTRA_APP_ID) ?: ""
        appPath = intent.getStringExtra(AppConstants.EXTRA_APP_PATH) ?: ""
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val app = if (appId.isNotBlank()) {
                    appManager.getAppById(appId)
                } else if (appPath.isNotBlank()) {
                    appManager.getAppByPath(appPath)
                } else {
                    null
                }
                
                withContext(Dispatchers.Main) {
                    if (app != null) {
                        currentApp = app
                        displayAppInfo(app)
                    } else {
                        Toast.makeText(
                            this@AppDetailActivity,
                            getString(R.string.error_file_not_found),
                            Toast.LENGTH_SHORT
                        ).show()
                        finish()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@AppDetailActivity,
                        getString(R.string.error_unknown),
                        Toast.LENGTH_SHORT
                    ).show()
                    finish()
                }
            }
        }
    }
    
    private fun displayAppInfo(app: com.moussadetous.mousseos.models.WebApp) {
        // Set app name
        appName.text = app.name
        
        // Set package name
        appPackageName.text = app.packageName
        
        // Set description
        appDescription.text = if (app.description.isBlank()) {
            getString(R.string.no_apps_description)
        } else {
            app.description
        }
        
        // Set version
        appVersion.text = app.version
        
        // Set size
        appSize.text = app.getSizeFormatted()
        
        // Set path
        appPath.text = app.basePath
        
        // Set icon
        app.getIconFile()?.let { iconFile ->
            Picasso.get()
                .load(iconFile)
                .placeholder(R.drawable.ic_web_app)
                .error(R.drawable.ic_web_app)
                .fit()
                .centerCrop()
                .into(appIcon)
        } ?: app.iconUrl?.let { iconUrl ->
            Picasso.get()
                .load(iconUrl)
                .placeholder(R.drawable.ic_web_app)
                .error(R.drawable.ic_web_app)
                .fit()
                .centerCrop()
                .into(appIcon)
        } ?: run {
            appIcon.setImageResource(R.drawable.ic_web_app)
        }
    }
    
    private fun openApp(app: com.moussadetous.mousseos.models.WebApp) {
        val intent = Intent(this, WebAppActivity::class.java).apply {
            putExtra(AppConstants.EXTRA_APP_ID, app.id)
            putExtra(AppConstants.EXTRA_APP_PATH, app.basePath)
            putExtra(AppConstants.EXTRA_APP_NAME, app.name)
        }
        startActivity(intent)
    }
    
    private fun confirmUninstall(app: com.moussadetous.mousseos.models.WebApp) {
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.confirm_uninstall_title))
            .setMessage(getString(R.string.confirm_uninstall_message).format(app.name))
            .setPositiveButton(getString(R.string.confirm_uninstall_yes)) { _, _ ->
                uninstallApp(app)
            }
            .setNegativeButton(getString(R.string.confirm_uninstall_no), null)
            .show()
    }
    
    private fun uninstallApp(app: com.moussadetous.mousseos.models.WebApp) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val success = appManager.uninstallApp(app.id)
                
                withContext(Dispatchers.Main) {
                    if (success) {
                        Toast.makeText(
                            this@AppDetailActivity,
                            "${app.name} ${getString(R.string.detail_uninstall)}",
                            Toast.LENGTH_SHORT
                        ).show()
                        finish()
                    } else {
                        Toast.makeText(
                            this@AppDetailActivity,
                            getString(R.string.error_unknown),
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@AppDetailActivity,
                        getString(R.string.error_unknown),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun openAppFolder(app: com.moussadetous.mousseos.models.WebApp) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(Uri.parse(app.basePath), "resource/folder")
        }
        startActivity(intent)
    }
    
    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}
