package com.moussadetous.mousseos

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.moussadetous.mousseos.utils.AppConstants
import java.io.File

class WebAppActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var tvError: TextView
    private lateinit var fabReload: FloatingActionButton
    
    private val appManager by lazy {
        (application as MousseOSApp).appManager
    }
    
    private var appId: String = ""
    private var appPath: String = ""
    private var appName: String = ""
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_web_app)
        
        initializeViews()
        setupToolbar()
        setupWebView()
        setupSwipeRefresh()
        setupFab()
        
        loadAppInfo()
    }
    
    private fun initializeViews() {
        webView = findViewById(R.id.webView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        tvError = findViewById(R.id.tvError)
        fabReload = findViewById(R.id.fabReload)
    }
    
    private fun setupToolbar() {
        val toolbar = findViewById<com.google.android.material.appbar.MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            setDisplayShowHomeEnabled(true)
        }
        
        toolbar.setNavigationOnClickListener {
            onBackPressed()
        }
    }
    
    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                setSupportZoom(true)
                builtInZoomControls = true
                displayZoomControls = false
                allowFileAccess = true
                allowFileAccessFromFileURLs = true
                allowUniversalAccessFromFileURLs = true
                loadWithOverviewMode = true
                useWideViewPort = true
                userAgentString = AppConstants.WEBVIEW_USER_AGENT
            }
            
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    return false
                }
                
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    progressBar.visibility = View.VISIBLE
                    tvError.visibility = View.GONE
                }
                
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false
                }
                
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    progressBar.visibility = View.GONE
                    tvError.visibility = View.VISIBLE
                    tvError.text = getString(R.string.web_app_error)
                }
            }
            
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    super.onProgressChanged(view, newProgress)
                    if (newProgress >= 100) {
                        progressBar.visibility = View.GONE
                    }
                }
            }
        }
    }
    
    private fun setupSwipeRefresh() {
        swipeRefresh.setOnRefreshListener {
            reloadWebView()
        }
        
        swipeRefresh.setColorSchemeColors(
            resources.getColor(android.R.color.holo_blue_light, null),
            resources.getColor(android.R.color.holo_green_light, null),
            resources.getColor(android.R.color.holo_orange_light, null),
            resources.getColor(android.R.color.holo_red_light, null)
        )
    }
    
    private fun setupFab() {
        fabReload.setOnClickListener {
            reloadWebView()
        }
    }
    
    private fun loadAppInfo() {
        appId = intent.getStringExtra(AppConstants.EXTRA_APP_ID) ?: ""
        appPath = intent.getStringExtra(AppConstants.EXTRA_APP_PATH) ?: ""
        appName = intent.getStringExtra(AppConstants.EXTRA_APP_NAME) ?: ""
        
        supportActionBar?.title = appName
        
        loadWebApp()
    }
    
    private fun loadWebApp() {
        if (appPath.isBlank()) {
            Toast.makeText(
                this,
                getString(R.string.error_file_not_found),
                Toast.LENGTH_SHORT
            ).show()
            finish()
            return
        }
        
        val indexFile = appManager.getIndexFile(appPath, appId)
        if (indexFile != null && indexFile.exists()) {
            val uri = Uri.fromFile(indexFile)
            webView.loadUrl(uri.toString())
        } else {
            // Try to find index.html in the app directory
            val appDir = File(appPath)
            val foundIndex = appManager.findIndexHtml(appDir)
            if (foundIndex != null) {
                val uri = Uri.fromFile(foundIndex)
                webView.loadUrl(uri.toString())
            } else {
                tvError.visibility = View.VISIBLE
                tvError.text = getString(R.string.no_index_html)
            }
        }
    }
    
    private fun reloadWebView() {
        webView.reload()
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }
    
    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu_web_app, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                onBackPressed()
                true
            }
            R.id.menu_refresh -> {
                reloadWebView()
                true
            }
            R.id.menu_app_details -> {
                openAppDetails()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun openAppDetails() {
        val intent = Intent(this, AppDetailActivity::class.java).apply {
            putExtra(AppConstants.EXTRA_APP_ID, appId)
            putExtra(AppConstants.EXTRA_APP_PATH, appPath)
            putExtra(AppConstants.EXTRA_APP_NAME, appName)
        }
        startActivity(intent)
    }
}
