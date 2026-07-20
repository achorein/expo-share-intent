package expo.modules.shareintent

import android.app.Activity
import android.app.Application
import android.os.Bundle
import expo.modules.core.interfaces.ApplicationLifecycleListener

class ExpoShareIntentApplicationLifecycleListener : ApplicationLifecycleListener {
    override fun onCreate(application: Application) {
        // onActivityPreCreated (API 29+) receives the framework's real savedInstanceState
        // before the Activity's own onCreate runs. ReactActivityLifecycleListener.onCreate
        // can't be used for this: RN/Expo MainActivity templates call super.onCreate(null),
        // so the bundle is always null there. Below API 29 this hook never fires and
        // behavior is unchanged.
        application.registerActivityLifecycleCallbacks(object : Application.ActivityLifecycleCallbacks {
            override fun onActivityPreCreated(activity: Activity, savedInstanceState: Bundle?) {
                ExpoShareIntentSingleton.isRecreation = savedInstanceState != null
            }

            override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
            override fun onActivityStarted(activity: Activity) {}
            override fun onActivityResumed(activity: Activity) {}
            override fun onActivityPaused(activity: Activity) {}
            override fun onActivityStopped(activity: Activity) {}
            override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
            override fun onActivityDestroyed(activity: Activity) {}
        })
    }
}
