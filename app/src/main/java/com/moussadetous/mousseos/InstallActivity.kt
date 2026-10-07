package com.moussadetous.mousseos

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.textfield.TextInputEditText
import com.moussadetous.mousseos.models.WebApp
import com.moussadetous.mousseos.utils.AppConstants
import com.moussadetous.mousseos.utils.PermissionUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

class InstallActivity : AppCompatActivity() {
    private lateinit var btnSelectFile: Button
    private lateinit var btnInstall: Button
    private lateinit var btnCancel: Button
    private lateinit var etAppName: TextInputEditText
    private lateinit var etAppDescription: TextInputEditText
    private lateinit var etAppIconUrl: TextInputEditText
    private lateinit var tvSelectedFile: TextView
    private lateinit var progressBar: ProgressBar
    
    private val appManager by lazy {
        (application as MousseOSApp).appManager
    }
    
    private var selectedFileUri: Uri? = null
    private var selectedFilePath: String? = null
    
    private val filePickerResult = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.let { uri ->
                selectedFileUri = uri
                selectedFilePath = uri.path
                tvSelectedFile.text = uri.lastPathSegment ?: uri.toString()
                tvSelectedFile.visibility = TextView.VISIBLE
                
                // Try to extract app name from filename
                val fileName = uri.lastPathSegment ?: ""
                if (fileName.endsWith(".zip", ignoreCase = true)) {
                    val appName = fileName.substring(0, fileName.length - 4)
                    etAppName.setText(appName)
                }
            }
        }
    }
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            openFilePicker()
        } else {
            Toast.makeText(
                this,
                getString(R.string.permission_denied),
                Toast.LENGTH_SHORT
            ).show()
        }
    }
    
    private val requestMultiplePermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            openFilePicker()
        } else {
            Toast.makeText(
                this,
                getString(R.string.permission_denied),
                Toast.LENGTH_SHORT
            ).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_install)
        
        initializeViews()
        setupToolbar()
        setupListeners()
        
        // Check if file path was passed as extra
        intent.getStringExtra(AppConstants.EXTRA_APP_PATH)?.let { path ->
            selectedFilePath = path
            selectedFileUri = Uri.parse(path)
            tvSelectedFile.text = Uri.parse(path).lastPathSegment ?: path
            tvSelectedFile.visibility = TextView.VISIBLE
        }
    }
    
    private fun initializeViews() {
        btnSelectFile = findViewById(R.id.btnSelectFile)
        btnInstall = findViewById(R.id.btnInstall)
        btnCancel = findViewById(R.id.btnCancel)
        etAppName = findViewById(R.id.etAppName)
        etAppDescription = findViewById(R.id.etAppDescription)
        etAppIconUrl = findViewById(R.id.etAppIconUrl)
        tvSelectedFile = findViewById(R.id.tvSelectedFile)
        progressBar = findViewById(R.id.progressBar)
    }
    
    private fun setupToolbar() {
        val toolbar = findViewById<com.google.android.material.appbar.MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.apply {
            title = getString(R.string.install_title)
            setDisplayHomeAsUpEnabled(true)
        }
        
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }
    }
    
    private fun setupListeners() {
        btnSelectFile.setOnClickListener {
            checkAndRequestPermissions()
        }
        
        btnInstall.setOnClickListener {
            installApp()
        }
        
        btnCancel.setOnClickListener {
            onBackPressed()
        }
    }
    
    private fun checkAndRequestPermissions() {
        if (PermissionUtils.hasAllRequiredPermissions(this)) {
            openFilePicker()
        } else {
            requestStoragePermissions()
        }
    }
    
    private fun requestStoragePermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestMultiplePermissionsLauncher.launch(
                arrayOf(
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VIDEO,
                    Manifest.permission.READ_MEDIA_AUDIO
                )
            )
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            requestPermissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE)
        } else {
            requestMultiplePermissionsLauncher.launch(
                arrayOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                )
            )
        }
    }
    
    private fun openFilePicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "application/zip"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        filePickerResult.launch(intent)
    }
    
    private fun installApp() {
        val appName = etAppName.text.toString().trim()
        
        if (appName.isBlank()) {
            Toast.makeText(
                this,
                "Please enter an app name",
                Toast.LENGTH_SHORT
            ).show()
            return
        }
        
        if (selectedFileUri == null) {
            Toast.makeText(
                this,
                getString(R.string.invalid_zip),
                Toast.LENGTH_SHORT
            ).show()
            return
        }
        
        val appDescription = etAppDescription.text.toString().trim()
        val iconUrl = etAppIconUrl.text.toString().trim().ifBlank { null }
        
        // Show progress
        progressBar.visibility = ProgressBar.VISIBLE
        btnInstall.isEnabled = false
        btnCancel.isEnabled = false
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                selectedFileUri?.let { uri ->
                    val result = appManager.installApp(
                        zipUri = uri,
                        appName = appName,
                        appDescription = appDescription,
                        iconUrl = iconUrl
                    )
                    
                    withContext(Dispatchers.Main) {
                        progressBar.visibility = ProgressBar.GONE
                        btnInstall.isEnabled = true
                        btnCancel.isEnabled = true
                        
                        result.onSuccess { app ->
                            Toast.makeText(
                                this@InstallActivity,
                                getString(R.string.install_success),
                                Toast.LENGTH_SHORT
                            ).show()
                            
                            // Finish and return to main activity
                            val resultIntent = Intent().apply {
                                putExtra(AppConstants.EXTRA_APP_ID, app.id)
                            }
                            setResult(Activity.RESULT_OK, resultIntent)
                            finish()
                        }
                        
                        result.onFailure { exception ->
                            val errorMessage = when (exception.message) {
                                "No index.html found in ZIP" -> getString(R.string.no_index_html)
                                "App with this name already exists" -> getString(R.string.app_exists)
                                "Failed to extract ZIP file" -> getString(R.string.error_extract_failed)
                                else -> getString(R.string.install_error)
                            }
                            
                            Toast.makeText(
                                this@InstallActivity,
                                errorMessage,
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("InstallActivity", "Error installing app", e)
                withContext(Dispatchers.Main) {
                    progressBar.visibility = ProgressBar.GONE
                    btnInstall.isEnabled = true
                    btnCancel.isEnabled = true
                    
                    Toast.makeText(
                        this@InstallActivity,
                        getString(R.string.install_error),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
}
