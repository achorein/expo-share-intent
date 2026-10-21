/*!
 * Native module created for Expo Share Intent (https://github.com/achorein/expo-share-intent)
 * author: achorein (https://github.com/achorein)
 * inspired by : 
 *  - https://github.com/EvanBacon/expo-quick-actions/blob/main/android/src/main/java/expo/modules.quickactions/ExpoQuickActionsModule.kt
 *  - https://github.com/ajith-ab/react-native-receive-sharing-intent/tree/master/android/src/main/java/com/reactnativereceivesharingintent
 */
package expo.modules.shareintent

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.graphics.BitmapFactory
import android.media.MediaMetadataRetriever;
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Parcelable
import android.os.Bundle
import android.provider.DocumentsContract
import android.provider.OpenableColumns
import android.provider.MediaStore
import android.util.Log
import android.webkit.MimeTypeMap
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.Date


class ExpoShareIntentModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    private val currentActivity: Activity?
        get() = appContext.currentActivity

    companion object {
        private var instance: ExpoShareIntentModule? = null

        private fun notifyShareIntent(value: Any) {
            notifyState("pending")
            instance!!.sendEvent("onChange", mapOf("value" to value))
        }
        private fun notifyState(state: String) {
            instance!!.sendEvent("onStateChange", mapOf("value" to state))
        }
        private fun notifyError(message: String) {
            instance!!.sendEvent("onError", mapOf("value" to message))
        }

        @SuppressLint("Range")
        private fun getFileInfo(uri: Uri): Map<String, String?> {
            val resolver: ContentResolver? = instance?.currentActivity?.contentResolver
                    ?: instance?.context?.contentResolver
            if (resolver == null) {
                notifyError("Cannot get resolver (getFileInfo)")
                return mapOf(
                    "contentUri" to uri.toString(),
                    "filePath" to instance?.getAbsolutePath(uri),
                )
            }
            var fileName: String? = null
            var fileSize: String? = null
            try {
                resolver.query(uri, null, null, null, null)?.use { queryResult ->
                    if (queryResult.moveToFirst()) {
                        val nameIndex = queryResult.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                        if (nameIndex >= 0) {
                            fileName = queryResult.getString(nameIndex)
                        }
                        val sizeIndex = queryResult.getColumnIndex(OpenableColumns.SIZE)
                        if (sizeIndex >= 0) {
                            fileSize = queryResult.getString(sizeIndex)
                        }
                    }
                }
            } catch (exception: Exception) {
                Log.w("ExpoShareIntent", "Cannot query shared URI metadata", exception)
            }

            val mimeType = try {
                resolver.getType(uri)?.takeIf { it.isNotBlank() }
            } catch (exception: Exception) {
                Log.w("ExpoShareIntent", "Cannot read shared URI MIME type", exception)
                null
            } ?: "application/octet-stream"

            var mediaWidth: String? = null;
            var mediaHeight: String? = null;
            var mediaDuration: String? = null;
            if (mimeType.startsWith("image/")) {
                try {
                    val options = BitmapFactory.Options().apply {
                        inJustDecodeBounds = true
                    }
                    resolver.openInputStream(uri)?.use { input ->
                        BitmapFactory.decodeStream(input, null, options)
                    }
                    if (options.outHeight > 0 && options.outWidth > 0) {
                        mediaHeight = options.outHeight.toString()
                        mediaWidth = options.outWidth.toString()
                    }
                } catch (exception: Exception) {
                    Log.w("ExpoShareIntent", "Cannot inspect shared image metadata", exception)
                }
            }
            if (mimeType.startsWith("video/")) {
                var retriever: MediaMetadataRetriever? = null
                try {
                    val mediaRetriever = MediaMetadataRetriever()
                    retriever = mediaRetriever
                    mediaRetriever.setDataSource(instance?.getAbsolutePath(uri))
                    mediaWidth = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()?.toString()
                    mediaHeight = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()?.toString()
                    // Check orientation and flip size if required
                    val metaRotation = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0;
                    if (metaRotation == 90 || metaRotation == 270) {
                        mediaWidth = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull()?.toString()
                        mediaHeight = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull()?.toString()
                    }
                    mediaDuration = mediaRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toIntOrNull()?.toString()
                } catch (exception: Exception) {
                    mediaWidth = null
                    mediaHeight = null
                    mediaDuration = null
                    Log.w("ExpoShareIntent", "Cannot inspect shared video metadata", exception)
                } finally {
                    try {
                        retriever?.release()
                    } catch (exception: Exception) {
                        Log.w("ExpoShareIntent", "Cannot release video metadata reader", exception)
                    }
                }
            }

            return mapOf(
                    "contentUri" to uri.toString(),
                    "filePath" to instance?.getAbsolutePath(uri),
                    "fileName" to fileName,
                    "fileSize" to fileSize,
                    "mimeType" to mimeType,
                    "width" to mediaWidth,
                    "height" to mediaHeight,
                    "duration" to mediaDuration
            )
        }

        fun handleShareIntent(intent: Intent) {
            val activity = instance?.currentActivity
            if (activity != null && !activity.isTaskRoot) {
                val newIntent = Intent(intent).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                activity.startActivity(newIntent)
                activity.finish()
                return
            }
            if (intent.type == null) return
            if (intent.type!!.startsWith("text/plain")) {
                // text / urls
                if (intent.action == Intent.ACTION_SEND) {
                    notifyShareIntent(mapOf(
                        "text" to intent.getStringExtra(Intent.EXTRA_TEXT),
                        "type" to "text",
                        "meta" to mapOf(
                            "title" to intent.getCharSequenceExtra(Intent.EXTRA_TITLE),
                        )
                    ))
                } else if (intent.action == Intent.ACTION_VIEW) {
                    notifyShareIntent(mapOf( "text" to intent.dataString, "type" to "text"))
                } else {
                    notifyError("Invalid action for text sharing: " + intent.action)
                }
            } else {
                // files / medias
                if (intent.action == Intent.ACTION_SEND) {
                    val uri = intent.parcelable<Uri>(Intent.EXTRA_STREAM);
                    if (uri != null) {
                        notifyShareIntent(mapOf( "files" to arrayOf(getFileInfo(uri), "type" to "file")))
                    } else {
                        notifyError("empty uri for file sharing: " + intent.action)
                    }
                } else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
                    val uris = intent.parcelableArrayList<Uri>(Intent.EXTRA_STREAM)
                    if (uris != null) {
                        notifyShareIntent(mapOf( "files" to uris.map { getFileInfo(it) }, "type" to "file"))
                    } else {
                        notifyError("empty uris array for file sharing: " + intent.action)
                    }
                } else {
                    notifyError("Invalid action for file sharing: " + intent.action)
                }
            }
        }

        /*
         * https://stackoverflow.com/questions/73019160/the-getparcelableextra-method-is-deprecated
         */
        private inline fun <reified T : Parcelable> Intent.parcelable(key: String): T? = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> getParcelableExtra(key, T::class.java)
            else -> @Suppress("DEPRECATION") getParcelableExtra(key) as? T
        }

        private inline fun <reified T : Parcelable> Intent.parcelableArrayList(key: String): ArrayList<T>? = when {
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU -> getParcelableArrayListExtra(key, T::class.java)
            else -> @Suppress("DEPRECATION") getParcelableArrayListExtra(key)
        }
    }

    // See https://docs.expo.dev/modules/module-api
    override fun definition() = ModuleDefinition {
        Name("ExpoShareIntentModule")

        Events("onChange", "onStateChange", "onError")

        AsyncFunction("getShareIntent") { _: String ->
            // get the Intent from onCreate activity (app not running in background)
            ExpoShareIntentSingleton.isPending = false
            if (ExpoShareIntentSingleton.intent?.type != null) {
                handleShareIntent(ExpoShareIntentSingleton.intent!!);
                ExpoShareIntentSingleton.intent = null
            }
        }

        Function("clearShareIntent") { _: String ->
            ExpoShareIntentSingleton.intent = null
        }

        Function("hasShareIntent") { _: String ->
            ExpoShareIntentSingleton.isPending
        }

        OnNewIntent {
            handleShareIntent(it)
        }

        OnCreate {
            instance = this@ExpoShareIntentModule
        }

        OnDestroy {
            instance = null
        }
    }

    /**
     * Get a file path from a Uri. This will get the the path for Storage Access
     * Framework Documents, as well as the _data field for the MediaStore and
     * other file-based ContentProviders.
     *
     * @param uri The Uri to query.
     * @author paulburke
     */
    fun getAbsolutePath(uri: Uri): String? {
        try {
            // DocumentProvider
            if (DocumentsContract.isDocumentUri(context, uri)) {
                // ExternalStorageProvider
                if (isExternalStorageDocument(uri)) {
                    val docId = DocumentsContract.getDocumentId(uri)
                    val split = docId.split(":".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
                    val type = split[0]

                    return if ("primary".equals(type, ignoreCase = true)) {
                        Environment.getExternalStorageDirectory().toString() + "/" + split[1]
                    } else {
                        getDataColumn(uri, null, null)
                    }
                } else if (isDownloadsDocument(uri)) {
                    return try {
                        val id = DocumentsContract.getDocumentId(uri)
                        val contentUri = ContentUris.withAppendedId(
                                Uri.parse("content://downloads/public_downloads"), java.lang.Long.valueOf(id))

                        getDataColumn(contentUri, null, null)
                    } catch (exception: Exception) {
                        getDataColumn(uri, null, null)
                    }
                } else if (isMediaDocument(uri)) {
                    val docId = DocumentsContract.getDocumentId(uri)
                    val split = docId.split(":".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
                    val type = split[0]

                    var contentUri: Uri? = null
                    when (type) {
                        "image" -> contentUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                        "video" -> contentUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                        "audio" -> contentUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
                    }

                    if (contentUri == null) return null

                    val selection = "_id=?"
                    val selectionArgs = arrayOf(split[1])
                    return getDataColumn(contentUri, selection, selectionArgs)
                }// MediaProvider
                // DownloadsProvider
            } else if ("content".equals(uri.scheme, ignoreCase = true)) {
                return getDataColumn(uri, null, null)
            }

            return uri.path
        } catch (e: Exception) {
            e.printStackTrace()
            notifyError("cannot retreive absoluteFilePath for $uri: ${e.message}")
            return null
        }
    }

    /**
     * Get the value of the data column for this Uri. This is useful for
     * MediaStore Uris, and other file-based ContentProviders.
     *
     * @param uri The Uri to query.
     * @param selection (Optional) Filter used in the query.
     * @param selectionArgs (Optional) Selection arguments used in the query.
     * @return The value of the _data column, which is typically a file path.
     */
    private fun getDataColumn(uri: Uri, selection: String?,
                              selectionArgs: Array<String>?): String? {
        val resolver: ContentResolver? = instance?.currentActivity?.contentResolver
        ?: instance?.context?.contentResolver
        if (resolver == null) {
            notifyError("Cannot get resolver (getDataColumn)")
            return null
        }
        if (uri.authority != null) {
            var cursor: Cursor? = null
            val column = "_display_name"
            val projection = arrayOf(column)
            var targetFile: File? = null
            try {
                cursor = resolver.query(uri, projection, selection, selectionArgs, null)
                if (cursor != null && cursor.moveToFirst()) {
                    val columnIndex = cursor.getColumnIndexOrThrow(column)
                    val fileName = cursor.getString(columnIndex)
                    Log.i("FileDirectory", "File name: $fileName")
                    val safeName = fileName?.let { File(it).name }.orEmpty()
                    if (safeName.isNotEmpty()) {
                        val candidate = File(context.cacheDir, safeName)
                        val cacheRoot = context.cacheDir.canonicalPath + File.separator
                        if (candidate.canonicalPath.startsWith(cacheRoot)) {
                            targetFile = candidate
                        }
                    }                }
            } finally {
                cursor?.close()
            }

            if (targetFile == null) {
                val mimeType = resolver.getType(uri)
                val prefix = with(mimeType ?: "") {
                    when {
                        startsWith("image") -> "IMG"
                        startsWith("video") -> "VID"
                        else -> "FILE"
                    }
                }
                val type = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType)
                targetFile = File(context.cacheDir, "${prefix}_${Date().time}.$type")
            }

            resolver.openInputStream(uri)?.use { input ->
                FileOutputStream(targetFile).use { fileOut ->
                    input.copyTo(fileOut)
                }
            }
            return targetFile.path
        }

        var cursor: Cursor? = null
        val column = "_data"
        val projection = arrayOf(column)

        try {
            cursor = resolver.query(uri, projection, selection, selectionArgs, null)
            if (cursor != null && cursor.moveToFirst()) {
                val columnIndex = cursor.getColumnIndexOrThrow(column)
                return cursor.getString(columnIndex)
            }
        } finally {
            cursor?.close()
        }
        return null
    }


    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is ExternalStorageProvider.
     */
    private fun isExternalStorageDocument(uri: Uri): Boolean {
        return "com.android.externalstorage.documents" == uri.authority
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is DownloadsProvider.
     */
    private fun isDownloadsDocument(uri: Uri): Boolean {
        return "com.android.providers.downloads.documents" == uri.authority
    }

    /**
     * @param uri The Uri to check.
     * @return Whether the Uri authority is MediaProvider.
     */
    private fun isMediaDocument(uri: Uri): Boolean {
        return "com.android.providers.media.documents" == uri.authority
    }
}
