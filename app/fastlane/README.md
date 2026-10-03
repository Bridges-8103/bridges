fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios load_asc_api_key

```sh
[bundle exec] fastlane ios load_asc_api_key
```

Load App Store Connect API Key (from local certificates repo or CI env vars)

### ios load_match_password

```sh
[bundle exec] fastlane ios load_match_password
```

Load Match encryption password from local certificates repo or CI env var

### ios sync_devices

```sh
[bundle exec] fastlane ios sync_devices
```

Register device UDIDs from devices.txt in the certificates repository

### ios match_adhoc

```sh
[bundle exec] fastlane ios match_adhoc
```

Sync Ad-Hoc certificates and provisioning profile via Match

### ios build_adhoc

```sh
[bundle exec] fastlane ios build_adhoc
```

Build Ad-Hoc IPA package

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
