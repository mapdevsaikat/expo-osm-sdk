package expo.modules.osmsdk

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Foreground service that owns GPS/network location updates while the app is
 * backgrounded or the screen is off (started via
 * `startLocationTracking({ background: true })` from JS).
 *
 * A foreground service with `foregroundServiceType="location"` is the
 * OS-sanctioned mechanism for continuous tracking on Android 8+ — it survives
 * Doze without wake locks and requires the persistent notification shown here.
 *
 * Fixes are buffered in a bounded, static buffer so nothing is lost while the
 * JS runtime is asleep; JS drains it via `getBufferedLocationFixes()` when the
 * app returns to the foreground. While the app is active, fixes are also
 * forwarded live to the map view through [liveLocationListener].
 *
 * Uses the plain [LocationManager] (no Google Play Services dependency) so
 * tracking works on low-end and de-Googled devices too: the GPS provider
 * supplies the accurate fixes, the NETWORK provider keeps coverage indoors
 * and in urban canyons.
 */
class LocationTrackingService : Service(), LocationListener {

    companion object {
        private const val TAG = "OSMLocationService"
        private const val NOTIFICATION_CHANNEL_ID = "expo_osm_sdk_location_tracking"
        private const val NOTIFICATION_ID = 0x05D1

        const val ACTION_START = "expo.modules.osmsdk.action.START_TRACKING"
        const val ACTION_STOP = "expo.modules.osmsdk.action.STOP_TRACKING"

        const val EXTRA_INTERVAL_MS = "intervalMs"
        const val EXTRA_MIN_DISTANCE_M = "minDistanceMeters"
        const val EXTRA_NOTIFICATION_TITLE = "notificationTitle"
        const val EXTRA_NOTIFICATION_TEXT = "notificationText"

        /** Max fixes buffered while JS is asleep before the oldest are dropped. */
        private const val MAX_BUFFERED_FIXES = 10_000

        /** A NETWORK fix is ignored while a GPS fix newer than this exists. */
        private const val GPS_PREFERENCE_WINDOW_MS = 5_000L

        @Volatile
        var isRunning = false
            private set

        // Fixes collected for JS. Static so the module can drain it without a
        // binder, and so points survive a service restart within the process.
        private val bufferLock = Object()
        private val bufferedFixes = ArrayDeque<Map<String, Double>>()

        /**
         * Invoked on the main thread for every accepted fix so a mounted map
         * view keeps emitting live onUserLocationChange events while the app
         * is in the foreground. Set/cleared by ExpoOsmSdkModule (which
         * resolves the view through a weak reference, so no view is leaked).
         */
        @Volatile
        var liveLocationListener: ((Location) -> Unit)? = null

        /** Returns and clears every buffered fix (oldest first). */
        fun drainBufferedFixes(): List<Map<String, Double>> {
            synchronized(bufferLock) {
                val drained = bufferedFixes.toList()
                bufferedFixes.clear()
                return drained
            }
        }

        fun start(
            context: Context,
            intervalMs: Long,
            minDistanceMeters: Float,
            notificationTitle: String?,
            notificationText: String?
        ) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_INTERVAL_MS, intervalMs)
                putExtra(EXTRA_MIN_DISTANCE_M, minDistanceMeters)
                notificationTitle?.let { putExtra(EXTRA_NOTIFICATION_TITLE, it) }
                notificationText?.let { putExtra(EXTRA_NOTIFICATION_TEXT, it) }
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, LocationTrackingService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to deliver stop intent: ${e.message}")
            }
        }
    }

    private var locationManager: LocationManager? = null
    private var trackingStarted = false
    private var lastGpsFixElapsedMs = 0L

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return try {
            when (intent?.action) {
                ACTION_STOP -> {
                    stopTracking()
                    START_NOT_STICKY
                }
                else -> {
                    // ACTION_START, or a system redelivery after process death
                    val intervalMs = intent?.getLongExtra(EXTRA_INTERVAL_MS, 1000L) ?: 1000L
                    val minDistanceM = intent?.getFloatExtra(EXTRA_MIN_DISTANCE_M, 0f) ?: 0f
                    val title = intent?.getStringExtra(EXTRA_NOTIFICATION_TITLE)
                        ?: "Location tracking active"
                    val text = intent?.getStringExtra(EXTRA_NOTIFICATION_TEXT)
                        ?: "Your position is being recorded."
                    startTracking(intervalMs, minDistanceM, title, text)
                    // Redeliver the intent (with its configuration) if the
                    // system kills and later restarts the service mid-session.
                    START_REDELIVER_INTENT
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "onStartCommand failed: ${e.message}")
            stopTracking()
            START_NOT_STICKY
        }
    }

    private fun startTracking(
        intervalMs: Long,
        minDistanceMeters: Float,
        notificationTitle: String,
        notificationText: String
    ) {
        // The OS requires startForeground() promptly after startForegroundService()
        val notification = buildNotification(notificationTitle, notificationText)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        if (trackingStarted) {
            return // already subscribed (duplicate start intent)
        }

        // The runtime permission can have been revoked between the module's
        // validation and this point — never crash, just shut down cleanly.
        if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(TAG, "Location permission missing — stopping service")
            stopTracking()
            return
        }

        try {
            val lm = getSystemService(Context.LOCATION_SERVICE) as LocationManager
            locationManager = lm

            var subscribed = false
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    intervalMs,
                    minDistanceMeters,
                    this,
                    mainLooper
                )
                subscribed = true
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    intervalMs,
                    minDistanceMeters,
                    this,
                    mainLooper
                )
                subscribed = true
            }

            if (!subscribed) {
                Log.e(TAG, "No enabled location provider — stopping service")
                stopTracking()
                return
            }

            trackingStarted = true
            isRunning = true
        } catch (e: SecurityException) {
            Log.e(TAG, "Location permission denied while subscribing: ${e.message}")
            stopTracking()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start location updates: ${e.message}")
            stopTracking()
        }
    }

    private fun stopTracking() {
        try {
            locationManager?.removeUpdates(this)
        } catch (e: Exception) {
            // ignored — cleanup must never fail
        }
        locationManager = null
        trackingStarted = false
        isRunning = false
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
        } catch (e: Exception) {
            // ignored
        }
        stopSelf()
    }

    // MARK: - LocationListener

    override fun onLocationChanged(location: Location) {
        try {
            if (!isAcceptableFix(location)) {
                return
            }

            val fix = mapOf(
                "latitude" to location.latitude,
                "longitude" to location.longitude,
                "accuracy" to location.accuracy.toDouble(),
                "altitude" to location.altitude,
                "speed" to location.speed.toDouble(),
                "bearing" to (if (location.hasBearing()) location.bearing.toDouble() else -1.0),
                "timestamp" to location.time.toDouble()
            )

            synchronized(bufferLock) {
                bufferedFixes.addLast(fix)
                while (bufferedFixes.size > MAX_BUFFERED_FIXES) {
                    bufferedFixes.removeFirst()
                }
            }

            // Forward to the map view for live onUserLocationChange events
            // while the app is foregrounded. A listener error must never kill
            // the tracking service.
            try {
                liveLocationListener?.invoke(location)
            } catch (e: Exception) {
                Log.w(TAG, "Live location listener failed: ${e.message}")
            }
        } catch (e: Exception) {
            Log.w(TAG, "onLocationChanged failed: ${e.message}")
        }
    }

    // Prefer GPS over NETWORK: network fixes are skipped while fresh GPS fixes
    // are flowing, since GPS is strictly more accurate when available. Mock
    // locations (emulators, test tools) are accepted rather than crashed on.
    private fun isAcceptableFix(location: Location): Boolean {
        return try {
            val now = SystemClock.elapsedRealtime()
            if (location.provider == LocationManager.GPS_PROVIDER) {
                lastGpsFixElapsedMs = now
                true
            } else {
                now - lastGpsFixElapsedMs > GPS_PREFERENCE_WINDOW_MS
            }
        } catch (e: Exception) {
            true
        }
    }

    @Deprecated("Deprecated in API 29", ReplaceWith(""))
    override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {
    }

    override fun onProviderEnabled(provider: String) {
    }

    override fun onProviderDisabled(provider: String) {
    }

    override fun onDestroy() {
        try {
            locationManager?.removeUpdates(this)
        } catch (e: Exception) {
            // ignored
        }
        locationManager = null
        trackingStarted = false
        isRunning = false
        super.onDestroy()
    }

    // MARK: - Notification

    private fun buildNotification(title: String, text: String): Notification {
        createNotificationChannel()

        // Tapping the notification reopens the app
        val contentIntent: PendingIntent? = try {
            packageManager.getLaunchIntentForPackage(packageName)?.let { launchIntent ->
                launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_UPDATE_CURRENT
                }
                PendingIntent.getActivity(this, 0, launchIntent, flags)
            }
        } catch (e: Exception) {
            null
        }

        // The SDK bundles no drawables — use the host app's icon, falling back
        // to a stock system icon so the notification can never crash the service.
        val smallIcon = try {
            val appIcon = applicationInfo.icon
            if (appIcon != 0) appIcon else android.R.drawable.ic_menu_mylocation
        } catch (e: Exception) {
            android.R.drawable.ic_menu_mylocation
        }

        val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(smallIcon)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
        contentIntent?.let { builder.setContentIntent(it) }
        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        try {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (manager.getNotificationChannel(NOTIFICATION_CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    NOTIFICATION_CHANNEL_ID,
                    "Location tracking",
                    NotificationManager.IMPORTANCE_LOW
                )
                channel.description = "Shown while background location tracking is active"
                channel.setShowBadge(false)
                manager.createNotificationChannel(channel)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to create notification channel: ${e.message}")
        }
    }
}
