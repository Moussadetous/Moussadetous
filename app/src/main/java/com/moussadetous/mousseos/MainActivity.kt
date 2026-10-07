package com.moussadetous.mousseos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.moussadetous.mousseos.adapters.AppListAdapter
import com.moussadetous.mousseos.models.WebApp
import com.moussadetous.mousseos.utils.AppConstants
import com.moussadetous.mousseos.utils.PermissionUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    private lateinit var appsRecyclerView: RecyclerView
    private lateinit var fabInstall: FloatingActionButton
    private lateinit var tvEmpty: TextView
    private lateinit var tvEmptyDescription: TextView
    
    private val appManager by lazy {
        (application as MousseOSApp).appManager
    }
    
    private var installedApps: List<WebApp> = emptyList()
    private var isGridView = false
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            loadApps()
        } else {
            showPermissionDeniedDialog()
        }
    }
    
    private val requestMultiplePermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.values.all { it }
        if (allGranted) {
            loadApps()
        } else {
            showPermissionDeniedDialog()
        }
    }
    
    private val filePickerResult = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.data?.let { uri ->
                val intent = Intent(this, InstallActivity::class.java).apply {
                    putExtra(AppConstants.EXTRA_APP_PATH, uri.toString())
                }
                startActivity(intent)
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        initializeViews()
        setupToolbar()
        setupRecyclerView()
        setupFab()
        
        checkAndRequestPermissions()
    }
    
    private fun initializeViews() {
        appsRecyclerView = findViewById(R.id.appsRecyclerView)
        fabInstall = findViewById(R.id.fabInstall)
        tvEmpty = findViewById(R.id.tvEmpty)
        tvEmptyDescription = findViewById(R.id.tvEmptyDescription)
    }
    
    private fun setupToolbar() {
        val toolbar = findViewById<com.google.android.material.appbar.MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.apply {
            title = getString(R.string.main_title)
            subtitle = getString(R.string.main_subtitle)
        }
    }
    
    private fun setupRecyclerView() {
        appsRecyclerView.apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            setHasFixedSize(true)
        }
    }
    
    private fun setupFab() {
        fabInstall.setOnClickListener {
            openFilePicker()
        }
    }
    
    private fun checkAndRequestPermissions() {
        if (PermissionUtils.hasAllRequiredPermissions(this)) {
            loadApps()
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
    
    private fun loadApps() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                installedApps = appManager.getInstalledApps()
                
                withContext(Dispatchers.Main) {
                    updateUI()
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "Error loading apps", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MainActivity,
                        getString(R.string.error_unknown),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun updateUI() {
        if (installedApps.isEmpty()) {
            appsRecyclerView.visibility = View.GONE
            tvEmpty.visibility = View.VISIBLE
            tvEmptyDescription.visibility = View.VISIBLE
        } else {
            appsRecyclerView.visibility = View.VISIBLE
            tvEmpty.visibility = View.GONE
            tvEmptyDescription.visibility = View.GONE
            
            val adapter = AppListAdapter(
                apps = installedApps,
                onAppClick = { app ->
                    openApp(app)
                },
                onAppLongClick = { app ->
                    showAppOptionsDialog(app)
                }
            )
            appsRecyclerView.adapter = adapter
        }
    }
    
    private fun openApp(app: WebApp) {
        val intent = Intent(this, WebAppActivity::class.java).apply {
            putExtra(AppConstants.EXTRA_APP_ID, app.id)
            putExtra(AppConstants.EXTRA_APP_PATH, app.basePath)
            putExtra(AppConstants.EXTRA_APP_NAME, app.name)
        }
        startActivity(intent)
    }
    
    private fun showAppOptionsDialog(app: WebApp) {
        val items = arrayOf(
            getString(R.string.detail_launch),
            getString(R.string.detail_open_folder),
            getString(R.string.detail_uninstall)
        )
        
        AlertDialog.Builder(this)
            .setTitle(app.name)
            .setItems(items) { _, which ->
                when (which) {
                    0 -> openApp(app)
                    1 -> openAppFolder(app)
                    2 -> confirmUninstall(app)
                }
            }
            .setNegativeButton(getString(R.string.cancel_button), null)
            .show()
    }
    
    private fun openAppFolder(app: WebApp) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(Uri.parse(app.basePath), "resource/folder")
        }
        startActivity(intent)
    }
    
    private fun confirmUninstall(app: WebApp) {
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.confirm_uninstall_title))
            .setMessage(getString(R.string.confirm_uninstall_message).format(app.name))
            .setPositiveButton(getString(R.string.confirm_uninstall_yes)) { _, _ ->
                uninstallApp(app)
            }
            .setNegativeButton(getString(R.string.confirm_uninstall_no), null)
            .show()
    }
    
    private fun uninstallApp(app: WebApp) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val success = appManager.uninstallApp(app.id)
                
                withContext(Dispatchers.Main) {
                    if (success) {
                        Toast.makeText(
                            this@MainActivity,
                            "${app.name} ${getString(R.string.detail_uninstall)}",
                            Toast.LENGTH_SHORT
                        ).show()
                        loadApps()
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            getString(R.string.error_unknown),
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "Error uninstalling app", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@MainActivity,
                        getString(R.string.error_unknown),
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
    
    private fun showPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.permission_denied))
            .setMessage(getString(R.string.permission_storage_rationale))
            .setPositiveButton(getString(R.string.permission_grant)) { _, _ ->
                requestStoragePermissions()
            }
            .setNegativeButton(getString(R.string.cancel_button)) { _, _ ->
                finish()
            }
            .setCancelable(false)
            .show()
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.menu_refresh -> {
                loadApps()
                true
            }
            R.id.menu_grid_view -> {
                isGridView = !isGridView
                updateRecyclerViewLayout()
                true
            }
            R.id.menu_settings -> {
                // Open settings
                true
            }
            R.id.menu_about -> {
                showAboutDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun updateRecyclerViewLayout() {
        appsRecyclerView.layoutManager = if (isGridView) {
            GridLayoutManager(this, 2)
        } else {
            LinearLayoutManager(this)
        }
        appsRecyclerView.adapter?.notifyDataSetChanged()
    }
    
    private fun showAboutDialog() {
        AlertDialog.Builder(this)
            .setTitle(getString(R.string.about_title))
            .setMessage(getString(R.string.about_description))
            .setPositiveButton(getString(R.string.ok)) { _, _ -> }
            .show()
    }
    
    override fun onResume() {
        super.onResume()
        loadApps()
    }
}
