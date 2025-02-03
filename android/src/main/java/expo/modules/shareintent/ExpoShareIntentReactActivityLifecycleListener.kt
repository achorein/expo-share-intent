package expo.modules.shareintent

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ShortcutManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener


class ExpoShareIntentReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {

    override fun onCreate(activity: Activity?, savedInstanceState: Bundle?) {
        // only store when the new intent is not empty
        if (activity?.intent?.type != null) {
            ExpoShareIntentSingleton.intent = activity?.intent
            ExpoShareIntentSingleton.isPending = true
        }
    }
}