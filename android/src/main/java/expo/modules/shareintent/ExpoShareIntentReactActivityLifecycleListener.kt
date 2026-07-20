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
        // only store when the new intent is not empty AND this is a fresh launch.
        // When savedInstanceState != null the Activity is being recreated (process
        // killed with the task retained, or a configuration change): the system
        // re-supplies the original task-root intent, so treating it as a new share
        // would re-deliver a share that was already consumed in a previous session.
        if (savedInstanceState == null && activity?.intent?.type != null) {
            ExpoShareIntentSingleton.intent = activity.intent
            ExpoShareIntentSingleton.isPending = true
        }
    }
}