package expo.modules.shareintent

import android.content.Intent
import expo.modules.core.interfaces.SingletonModule

object ExpoShareIntentSingleton : SingletonModule {

  override fun getName(): String {
    return "ExpoShareIntent"
  }

  // members to store the initial launch intent
  var intent: Intent? = null
  var isPending: Boolean = false

  // true while the Activity currently being created is a system recreation
  // (process death with task retained, config change) rather than a fresh launch.
  // Set from onActivityPreCreated; false below API 29.
  var isRecreation: Boolean = false
}