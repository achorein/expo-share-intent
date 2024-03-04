package expo.modules.shareintent

import android.content.Intent
import expo.modules.core.interfaces.SingletonModule

object ExpoShareIntentSingleton : SingletonModule {

  override fun getName(): String {
    return "ExpoShareIntent"
  }

  // member to store the initial launch intent
  var intent: Intent? = null
}