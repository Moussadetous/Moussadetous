package com.moussadetous.mousseos.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.moussadetous.mousseos.R
import com.moussadetous.mousseos.models.WebApp
import com.moussadetous.mousseos.utils.AppConstants
import com.squareup.picasso.Picasso

class AppListAdapter(
    private val apps: List<WebApp>,
    private val onAppClick: (WebApp) -> Unit,
    private val onAppLongClick: (WebApp) -> Unit
) : RecyclerView.Adapter<AppListAdapter.AppViewHolder>() {
    
    inner class AppViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val appIcon: ImageView = itemView.findViewById(R.id.appIcon)
        val appName: TextView = itemView.findViewById(R.id.appName)
        val appDescription: TextView = itemView.findViewById(R.id.appDescription)
        val appSize: TextView = itemView.findViewById(R.id.appSize)
        val appFavorite: ImageView = itemView.findViewById(R.id.appFavorite)
        val appCard: CardView = itemView.findViewById(R.id.appCard)
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AppViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_app, parent, false)
        return AppViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: AppViewHolder, position: Int) {
        val app = apps[position]
        
        // Set app name
        holder.appName.text = app.name
        
        // Set app description
        if (app.description.isNotBlank()) {
            holder.appDescription.text = app.description
            holder.appDescription.visibility = View.VISIBLE
        } else {
            holder.appDescription.text = ""
            holder.appDescription.visibility = View.GONE
        }
        
        // Set app size
        holder.appSize.text = app.getSizeFormatted()
        
        // Set favorite icon
        if (app.isFavorite) {
            holder.appFavorite.setImageResource(R.drawable.ic_favorite_filled)
            holder.appFavorite.visibility = View.VISIBLE
        } else {
            holder.appFavorite.setImageResource(R.drawable.ic_favorite_outline)
            holder.appFavorite.visibility = View.GONE
        }
        
        // Set app icon
        app.getIconFile()?.let { iconFile ->
            Picasso.get()
                .load(iconFile)
                .placeholder(R.drawable.ic_web_app)
                .error(R.drawable.ic_web_app)
                .fit()
                .centerCrop()
                .into(holder.appIcon)
        } ?: app.iconUrl?.let { iconUrl ->
            Picasso.get()
                .load(iconUrl)
                .placeholder(R.drawable.ic_web_app)
                .error(R.drawable.ic_web_app)
                .fit()
                .centerCrop()
                .into(holder.appIcon)
        } ?: run {
            holder.appIcon.setImageResource(R.drawable.ic_web_app)
        }
        
        // Set click listeners
        holder.appCard.setOnClickListener {
            onAppClick(app)
        }
        
        holder.appCard.setOnLongClickListener {
            onAppLongClick(app)
            true
        }
    }
    
    override fun getItemCount(): Int = apps.size
}
