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
                )
            }

            try {
                // Step 1: Read metadata from the content URI while permission is valid
                var fileName: String? = null
                var fileSize: String? = null
                try {
                    resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
                        if (cursor.moveToFirst()) {
                            val nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                            val sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE)
                            if (nameIdx >= 0) fileName = cursor.getString(nameIdx)
                            if (sizeIdx >= 0) fileSize = cursor.getString(sizeIdx)
                        }
                    }
                } catch (e: SecurityException) {
                    Log.w("ExpoShareIntent", "Cannot query metadata for $uri: ${e.message}")
                }

                val mimeType = try {
                    resolver.getType(uri)
                } catch (e: SecurityException) {
                    Log.w("ExpoShareIntent", "Cannot get MIME type for $uri: ${e.message}")
                    null
                }

                // Step 2: Copy file to cache immediately (while URI permission is still valid)
                val extension = if (fileName != null && fileName!!.contains(".")) {
                    fileName!!.substringAfterLast(".")
                } else {
                    MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType) ?: "bin"
                }
                val safeName = fileName ?: "shared_${Date().time}.$extension"
                val targetFile = File(instance?.context?.cacheDir, safeName)

                resolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                    }
                } ?: run {
                    notifyError("Cannot open input stream for $uri")
                    return mapOf("contentUri" to uri.toString())
                }

                // Step 3: If we couldn't get size from metadata, use the copied file size
                if (fileSize == null) {
                    fileSize = targetFile.length().toString()
                }

                // Step 4: Read media dimensions from the LOCAL copy (no permission needed)
                var mediaWidth: String? = null
                var mediaHeight: String? = null
                var mediaDuration: String? = null

                if (mimeType?.startsWith("image/") == true) {
                    val options = BitmapFactory.Options().apply {
                        inJustDecodeBounds = true
                    }
                    BitmapFactory.decodeFile(targetFile.path, options)
                    mediaHeight = options.outHeight.toString()
                    mediaWidth = options.outWidth.toString()
                }
                if (mimeType?.startsWith("video/") == true) {
                    try {
                        val retriever = MediaMetadataRetriever()
                        retriever.setDataSource(targetFile.path)
                        mediaWidth = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)
                        mediaHeight = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)
                        val metaRotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
                        if (metaRotation == 90 || metaRotation == 270) {
                            val tmp = mediaWidth
                            mediaWidth = mediaHeight
                            mediaHeight = tmp
                        }
                        mediaDuration = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                        retriever.release()
                    } catch (e: Exception) {
                        Log.w("ExpoShareIntent", "Cannot read video metadata: ${e.message}")
                    }
                }

                return mapOf(
                        "contentUri" to uri.toString(),
                        "filePath" to targetFile.path,
                        "fileName" to (fileName ?: safeName),
                        "fileSize" to fileSize,
                        "mimeType" to mimeType,
                        "width" to mediaWidth,
                        "height" to mediaHeight,
                        "duration" to mediaDuration
                )
            } catch (e: Exception) {
                Log.e("ExpoShareIntent", "getFileInfo failed for $uri: ${e.message}", e)
                notifyError("Cannot process shared file: ${e.message}")
                return mapOf("contentUri" to uri.toString())
            }
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

            if (intent.action == Intent.ACTION_SEND) {
                // Check for file stream first — even text/* MIME types can be file shares
                val streamUri = intent.parcelable<Uri>(Intent.EXTRA_STREAM)
                if (streamUri != null) {
                    notifyShareIntent(mapOf("files" to arrayOf(getFileInfo(streamUri)), "type" to "file"))
                } else if (intent.type!!.startsWith("text/")) {
                    // Pure text share (no file attachment)
                    notifyShareIntent(mapOf(
                        "text" to intent.getStringExtra(Intent.EXTRA_TEXT),
                        "type" to "text",
                        "meta" to mapOf(
                            "title" to intent.getCharSequenceExtra(Intent.EXTRA_TITLE),
                        )
                    ))
                } else {
                    notifyError("Unsupported ACTION_SEND with no stream and non-text type: ${intent.type}")
                }
            } else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
                val uris = intent.parcelableArrayList<Uri>(Intent.EXTRA_STREAM)
                if (uris != null) {
                    notifyShareIntent(mapOf("files" to uris.map { getFileInfo(it) }, "type" to "file"))
                } else {
                    notifyError("empty uris array for file sharing: ${intent.action}")
                }
            } else if (intent.action == Intent.ACTION_VIEW) {
                notifyShareIntent(mapOf("text" to intent.dataString, "type" to "text"))
            } else {
                notifyError("Unsupported intent action: ${intent.action}")
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
                    targetFile = File(context.cacheDir, fileName)
                }
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
