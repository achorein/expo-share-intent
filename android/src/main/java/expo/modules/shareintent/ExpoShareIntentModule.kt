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
            instance!!.sendEvent("onChange", mapOf("value" to value))
        }
        private fun notifyError(message: String) {
            instance!!.sendEvent("onError", mapOf("value" to message))
        }

        @SuppressLint("Range")
        private fun getFileInfo(uri: Uri): Map<String, String> {
            val resolver: ContentResolver = instance?.currentActivity?.contentResolver!!
            val queryResult: Cursor = resolver.query(uri, null, null, null, null)!!
            queryResult.moveToFirst()
            val fileName = queryResult.getString(queryResult.getColumnIndex(OpenableColumns.DISPLAY_NAME))
            queryResult.close()
            return mapOf(
                    "fileName" to fileName,
                    "filePath" to instance!!.getAbsolutePath(uri)!!,
                    "mimeType" to resolver.getType(uri)!!,
                    "contentUri" to uri.toString(),
            )
        }

        fun handleShareIntent(intent: Intent) {
            if (intent.type == null) return
            if (intent.type!!.startsWith("text")) {
                // text / urls
                if (intent.action == Intent.ACTION_SEND) {
                    notifyShareIntent(mapOf( "text" to intent.getStringExtra(Intent.EXTRA_TEXT)))
                } else if (intent.action == Intent.ACTION_VIEW) {
                    notifyShareIntent(mapOf( "text" to intent.dataString))
                } else {
                    notifyError("Invalid action for text sharing: " + intent.action)
                }
            } else {
                // files / medias
                if (intent.action == Intent.ACTION_SEND) {
                    @Suppress("DEPRECATION") // see inline function at the end of the file
                    val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM);
                    if (uri != null) {
                        notifyShareIntent(arrayOf(getFileInfo(uri)))
                    } else {
                        notifyError("empty uri for file sharing: " + intent.action)
                    }
                } else if (intent.action == Intent.ACTION_SEND_MULTIPLE) {
                    @Suppress("DEPRECATION") // see inline function at the end of the file
                    val uris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
                    if (uris != null) {
                        notifyShareIntent(uris.map { getFileInfo(it) })
                    } else {
                        notifyError("empty uris array for file sharing: " + intent.action)
                    }
                } else {
                    notifyError("Invalid action for file sharing: " + intent.action)
                }
            }
        }
    }

    // See https://docs.expo.dev/modules/module-api
    override fun definition() = ModuleDefinition {
        Name("ExpoShareIntentModule")

        Events("onChange", "onError")

        AsyncFunction("getShareIntent") { _: String ->
            // get the Intent from onCreate activity (app not running in background)
            if (ExpoShareIntentSingleton.intent?.type != null) {
                handleShareIntent(ExpoShareIntentSingleton.intent!!);
                ExpoShareIntentSingleton.intent = null
            }
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
        val resolver: ContentResolver = instance?.currentActivity?.contentResolver!!
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

    /*
     * https://stackoverflow.com/questions/73019160/the-getparcelableextra-method-is-deprecated
     */
    inline fun <reified T : Parcelable> Intent.parcelable(key: String): T? = when {
        Build.VERSION.SDK_INT >= 33 -> getParcelableExtra(key, T::class.java)
        else -> @Suppress("DEPRECATION") getParcelableExtra(key) as? T
    }

    inline fun <reified T : Parcelable> Bundle.parcelableArrayList(key: String): ArrayList<T>? = when {
        Build.VERSION.SDK_INT >= 33 -> getParcelableArrayList(key, T::class.java)
        else -> @Suppress("DEPRECATION") getParcelableArrayList(key)
    }
}
