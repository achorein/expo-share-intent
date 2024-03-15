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

    Events("onChange", "onError")

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("getShareIntent") { (url: String) in
        let fileUrl = URL(string: url)
        let json =  handleUrl(url: fileUrl);
        if (json != "error" && json != "empty") {
            self.sendEvent("onChange", [
                "value": json
            ])
        }
    }

    Function("clearShareIntent") { (sharedKey: String) in
        let userDefaults = UserDefaults(suiteName: "group.\(Bundle.main.bundleIdentifier!)")
        userDefaults?.set(nil, forKey: sharedKey)
        userDefaults?.synchronize()
    }
  }

  private var initialMedia: [SharedMediaFile]? = nil
  private var latestMedia: [SharedMediaFile]? = nil

  private var initialText: String? = nil
  private var latestText: String? = nil

  private func handleUrl(url: URL?) -> String? {
    let appDomain = Bundle.main.bundleIdentifier!
    if let url = url {
        let userDefaults = UserDefaults(suiteName: "group.\(appDomain)")
        if url.fragment == "media" {
            if let key = url.host?.components(separatedBy: "=").last {
                if let json = userDefaults?.object(forKey: key) as? Data {
                    let sharedArray = decode(data: json)
                    let sharedMediaFiles: [SharedMediaFile] = sharedArray.compactMap {
                        guard let path = getAbsolutePath(for: $0.path) else {
                            return nil
                        }
                        if ($0.type == .video && $0.thumbnail != nil) {
                            let thumbnail = getAbsolutePath(for: $0.thumbnail!)
                            return SharedMediaFile.init(path: path, thumbnail: thumbnail, duration: $0.duration, type: $0.type)
                        } else if ($0.type == .video && $0.thumbnail == nil) {
                            return SharedMediaFile.init(path: path, thumbnail: nil, duration: $0.duration, type: $0.type)
                        }
                        return SharedMediaFile.init(path: path, thumbnail: nil, duration: $0.duration, type: $0.type)
                    }
                    guard let json = toJson(data: sharedMediaFiles) else { return "[]"};
                    return "{ \"files\": \(json) }";
                } else {
                    return "empty"
                }
            }
        } else if url.fragment == "file" {
            if let key = url.host?.components(separatedBy: "=").last {
                if let json = userDefaults?.object(forKey: key) as? Data {                
                    let sharedArray = decode(data: json)
                    let sharedMediaFiles: [SharedMediaFile] = sharedArray.compactMap{
                        guard let path = getAbsolutePath(for: $0.path) else {
                            return nil
                        }
                        return SharedMediaFile.init(path: path, thumbnail: nil, duration: nil, type: $0.type)
                    }
                    guard let json = toJson(data: sharedMediaFiles) else { return "[]"};
                    return "{ \"files\": \(json) }";
                } else {
                    return "empty"
                }
            }
        } else if url.fragment == "text" {
            if let key = url.host?.components(separatedBy: "=").last {
                if let sharedArray = userDefaults?.object(forKey: key) as? [String] {
                    latestText =  sharedArray.joined(separator: ",")
                    let optionalString = latestText;
                    if let unwrapped = optionalString {
                        return "{ \"text\": \"\(unwrapped)\" }";
                    }
                    return latestText!;
                } else {
                    return "empty"
                }
            }
        } else {
            latestText = url.absoluteString
            let optionalString = latestText;
            // now unwrap it
            if let unwrapwebUrl = optionalString {
                return "{ \"text\": \"\(unwrapwebUrl)\" }";
            } else {
                return "empty"
            }
        }
        self.sendEvent("onError", [
            "value": "file type is Invalid \(url.fragment!)"
        ]);
        return "error"
    }
    self.sendEvent("onError", [
        "value": "invalid group name. Please check your share extention bundle name is same as `group.\(appDomain)`"
    ])
    return "error"
  }

  private func getAbsolutePath(for identifier: String) -> String? {
    if (identifier.starts(with: "file://") || identifier.starts(with: "/var/mobile/Media") || identifier.starts(with: "/private/var/mobile")) {
        return identifier;
    }
    let phAsset = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: .none).firstObject
    if(phAsset == nil) {
        return nil
    }
    let (url, _) = getFullSizeImageURLAndOrientation(for: phAsset!)
    return url
  }

  private func getFullSizeImageURLAndOrientation(for asset: PHAsset)-> (String?, Int) {
    var url: String? = nil
    var orientation: Int = 0
    let semaphore = DispatchSemaphore(value: 0)
    let options2 = PHContentEditingInputRequestOptions()
    options2.isNetworkAccessAllowed = true
    asset.requestContentEditingInput(with: options2){(input, info) in
        orientation = Int(input?.fullSizeImageOrientation ?? 0)
        url = input?.fullSizeImageURL?.path
        semaphore.signal()
    }
    semaphore.wait()
    return (url, orientation)
  }

  private func decode(data: Data) -> [SharedMediaFile] {
    let encodedData = try? JSONDecoder().decode([SharedMediaFile].self, from: data)
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

  class SharedMediaFile: Codable {
    var path: String;
    var thumbnail: String?; // video thumbnail
    var duration: Double?; // video duration in milliseconds
    var type: SharedMediaType;

    init(path: String, thumbnail: String?, duration: Double?, type: SharedMediaType) {
        self.path = path
        self.thumbnail = thumbnail
        self.duration = duration
        self.type = type
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
