/*!
 * Native module created for Expo Share Intent (https://github.com/achorein/expo-share-intent)
 * author: achorein (https://github.com/achorein)
 * inspired by :
 *  - https://github.com/ajith-ab/react-native-receive-sharing-intent/blob/master/ios/ReceiveSharingIntent.swift
 */
import ExpoModulesCore
import Foundation
import Photos

public class ExpoShareIntentModule: Module {
    // Each module class must implement the definition function. The definition consists of components
    // that describes the module's functionality and behavior.
    // See https://docs.expo.dev/modules/module-api for more details about available components.
    public func definition() -> ModuleDefinition {
        // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
        // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
        // The module will be accessible from `requireNativeModule('ExpoShareIntentModule')` in JavaScript.
        Name("ExpoShareIntentModule")

        Events("onChange", "onStateChange", "onError")

        // Defines a JavaScript function that always returns a Promise and whose native code
        // is by default dispatched on the different thread than the JavaScript runtime runs on.
        AsyncFunction("getShareIntent") { (url: String) in
            let fileUrl = URL(string: url)
            let json = handleUrl(url: fileUrl)
            if json != "error" && json != "empty" {
                self.sendEvent(
                    "onChange",
                    [
                        "value": json
                    ])
            }
        }

        Function("clearShareIntent") { (sharedKey: String) in
            let appGroupIdentifier = self.getAppGroupIdentifier()
            let userDefaults = UserDefaults(suiteName: appGroupIdentifier)
            userDefaults?.set(nil, forKey: sharedKey)
            userDefaults?.synchronize()
        }

        Function("hasShareIntent") { (key: String) in
            // for Android only
            return false
        }
    }

    private var initialMedia: [SharedMediaFile]? = nil
    private var latestMedia: [SharedMediaFile]? = nil

    private var initialText: String? = nil
    private var latestText: String? = nil

    private func handleUrl(url: URL?) -> String? {
        let appGroupIdentifier = self.getAppGroupIdentifier()
        NSLog("HandleUrl \(String(describing: url)) \(String(describing: appGroupIdentifier))")
        if let url = url {
            let userDefaults = UserDefaults(suiteName: appGroupIdentifier)
            if url.fragment == "media" {
                if let key = url.host?.components(separatedBy: "=").last {
                    if let json = userDefaults?.object(forKey: key) as? Data {
                        let sharedArray = decodeMedia(data: json)
                        let sharedMediaFiles: [SharedMediaFile] = sharedArray.compactMap {
                            if let path = getAbsolutePath(for: $0.path) {
                                if $0.type == .video && $0.thumbnail != nil {
                                    let thumbnail = getAbsolutePath(for: $0.thumbnail!)
                                    return SharedMediaFile.init(
                                        path: path, thumbnail: thumbnail, fileName: $0.fileName,
                                        fileSize: $0.fileSize, width: $0.width, height: $0.height,
                                        duration: $0.duration, mimeType: $0.mimeType, type: $0.type, extra: $0.extra)
                                } else if $0.type == .video && $0.thumbnail == nil {
                                    return SharedMediaFile.init(
                                        path: path, thumbnail: nil, fileName: $0.fileName,
                                        fileSize: $0.fileSize, width: $0.width, height: $0.height,
                                        duration: $0.duration, mimeType: $0.mimeType, type: $0.type, extra: $0.extra)
                                }
                                return SharedMediaFile.init(
                                    path: path, thumbnail: nil, fileName: $0.fileName,
                                    fileSize: $0.fileSize, width: $0.width, height: $0.height,
                                    duration: $0.duration, mimeType: $0.mimeType, type: $0.type, extra: $0.extra)
                            }
                            return nil
                        }
                        guard let json = toJson(data: sharedMediaFiles) else { return "[]" }
                        // meta.extra: first non-empty extra among files
                        let extra = sharedMediaFiles.compactMap { $0.extra }.first { !$0.isEmpty }
                        if let extra = extra, let metaData = try? JSONSerialization.data(withJSONObject: ["extra": extra]), let metaJson = String(data: metaData, encoding: .utf8) {
                            return "{ \"files\": \(json), \"meta\": \(metaJson), \"type\": \"\(url.fragment!)\" }"
                        }
                        return "{ \"files\": \(json), \"type\": \"\(url.fragment!)\" }"
                    } else {
                        return "empty"
                    }
                }
            } else if url.fragment == "file" {
                if let key = url.host?.components(separatedBy: "=").last {
                    if let json = userDefaults?.object(forKey: key) as? Data {
                        let sharedArray = decodeMedia(data: json)
                        let sharedMediaFiles: [SharedMediaFile] = sharedArray.compactMap {
                            if let path = getAbsolutePath(for: $0.path) {
                                return SharedMediaFile.init(
                                    path: path, thumbnail: nil, fileName: $0.fileName,
                                    fileSize: $0.fileSize, width: nil, height: nil, duration: nil,
                                    mimeType: $0.mimeType, type: $0.type, extra: $0.extra)
                            }
                            return nil
                        }
                        guard let json = toJson(data: sharedMediaFiles) else { return "[]" }
                        let extra = sharedMediaFiles.compactMap { $0.extra }.first { !$0.isEmpty }
                        if let extra = extra, let metaData = try? JSONSerialization.data(withJSONObject: ["extra": extra]), let metaJson = String(data: metaData, encoding: .utf8) {
                            return "{ \"files\": \(json), \"meta\": \(metaJson), \"type\": \"\(url.fragment!)\" }"
                        }
                        return "{ \"files\": \(json), \"type\": \"\(url.fragment!)\" }"
                    } else {
                        return "empty"
                    }
                }
            } else if url.fragment == "weburl" {
                if let key = url.host?.components(separatedBy: "=").last {
                    if let json = userDefaults?.object(forKey: key) as? Data {
                        let sharedArray = decodeWebUrl(data: json)
                        let sharedWebUrls: [WebUrl] = sharedArray.compactMap {
                            return WebUrl.init(url: $0.url, meta: $0.meta)
                        }
                        guard let json = toJson(data: sharedWebUrls) else { return "[]" }
                        return "{ \"weburls\": \(json), \"type\": \"\(url.fragment!)\" }"
                    } else {
                        return "empty"
                    }
                }
            } else if url.fragment == "text" {
                if let key = url.host?.components(separatedBy: "=").last {
                    if let sharedArray = userDefaults?.object(forKey: key) as? [String] {
                        latestText = sharedArray.joined(separator: ",")
                        let optionalString = latestText
                        if let unwrapped = optionalString {
                            return try? ShareIntentText(text: unwrapped, type: url.fragment!)
                                .toJSON()
                        }
                        return latestText!
                    } else {
                        return "empty"
                    }
                }
            } else {
                latestText = url.absoluteString
                let optionalString = latestText
                // now unwrap it
                if let unwrapwebUrl = optionalString {
                    return try? ShareIntentText(text: unwrapwebUrl, type: url.fragment!).toJSON()
                } else {
                    return "empty"
                }
            }
            self.sendEvent(
                "onError",
                [
                    "value": "file type is Invalid \(url.fragment!)"
                ])
            return "error"
        }
        self.sendEvent(
            "onError",
            [
                "value":
                    "Cannot retreive appGroupIdentifier. Please check your share extention iosAppGroupIdentifier. `\(String(describing: appGroupIdentifier))`"
            ])
        return "error"
    }

    private func getAppGroupIdentifier() -> String? {
        let appGroupIdentifier: String? =
            Bundle.main.object(forInfoDictionaryKey: "AppGroupIdentifier")
            as? String
        if appGroupIdentifier == nil {
            self.sendEvent(
                "onError",
                [
                    "value":
                        "appGroupIdentifier is nil `\(String(describing: appGroupIdentifier))`"
                ])
        }
        return appGroupIdentifier
    }

    private func getAbsolutePath(for identifier: String) -> String? {
        if identifier.starts(with: "file://") || identifier.starts(with: "/var/mobile/Media")
            || identifier.starts(with: "/private/var/mobile")
        {
            return identifier
        }
        let phAsset = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: .none)
            .firstObject
        if phAsset == nil {
            return nil
        }
        return getImageURL(for: phAsset!)
    }

    private func getImageURL(for asset: PHAsset) -> String? {
        var url: String? = nil
        let semaphore = DispatchSemaphore(value: 0)
        let options2 = PHContentEditingInputRequestOptions()
        options2.isNetworkAccessAllowed = true
        asset.requestContentEditingInput(with: options2) { (input, info) in
            url = input?.fullSizeImageURL?.path
            semaphore.signal()
        }
        semaphore.wait()
        return url
    }

    private func decodeMedia(data: Data) -> [SharedMediaFile] {
        let encodedData = try? JSONDecoder().decode([SharedMediaFile].self, from: data)
        return encodedData!
    }
    private func decodeWebUrl(data: Data) -> [WebUrl] {
        let encodedData = try? JSONDecoder().decode([WebUrl].self, from: data)
        return encodedData!
    }

    private func toJson(data: [SharedMediaFile]?) -> String? {
        if data == nil {
            return nil
        }
        let encodedData = try? JSONEncoder().encode(data)
        let json = String(data: encodedData!, encoding: .utf8)!
        return json
    }
    
    private func toJson(data: [WebUrl]?) -> String? {
        if data == nil {
            return nil
        }
        let encodedData = try? JSONEncoder().encode(data)
        let json = String(data: encodedData!, encoding: .utf8)!
        return json
    }

    struct ShareIntentText: Codable {
        let text: String
        let type: String  // text / weburl
    }

    class WebUrl: Codable {
        var url: String
        var meta: String

        init(url: String, meta: String) {
            self.url = url
            self.meta = meta
        }
    }

    class SharedMediaFile: Codable {
        var path: String  // can be image, video or url path
        var thumbnail: String?  // video thumbnail
        var fileName: String  // uuid + extension
        var fileSize: Int?
        var width: Int?  // for image
        var height: Int?  // for image
        var duration: Double?  // video duration in milliseconds
        var mimeType: String
        var type: SharedMediaType
    var extra: String?  // caption / extra text (optional)

        init(
            path: String, thumbnail: String?, fileName: String, fileSize: Int?, width: Int?,
            height: Int?, duration: Double?, mimeType: String, type: SharedMediaType, extra: String? = nil
        ) {
            self.path = path
            self.thumbnail = thumbnail
            self.fileName = fileName
            self.fileSize = fileSize
            self.width = width
            self.height = height
            self.duration = duration
            self.mimeType = mimeType
            self.type = type
            self.extra = extra
        }
    }

    enum SharedMediaType: Int, Codable {
        case image
        case video
        case file
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

extension Encodable {
    func toJSON() throws -> String? {
        let jsonData = try? JSONEncoder().encode(self)
        let jsonString = String(data: jsonData!, encoding: .utf8)
        return jsonString
    }
}