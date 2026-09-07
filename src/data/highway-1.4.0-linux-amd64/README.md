# Highway installed headers

This is a snapshot of the complete `include/` directory returned by:

```sh
llar install google/highway@1.4.0 --os linux --arch amd64 -v --json
```

The command completed successfully on 2026-09-07 with LLAR v0.3.3. The target is Linux / AMD64. The snapshot contains 62 files (4,575,161 bytes); file contents and directory names are preserved without modification. `manifest.json` records paths relative to `include/` and exact byte sizes.

The installed metadata includes `-DHWY_STATIC_DEFINE` and `-lhwy -lm`. This snapshot represents that build only, not other platforms, versions, or build configurations. Headers for other architectures present under `hwy/ops/` are retained because they are included in the installed output.

`LICENSE` is copied from the build output's `licenses/LICENSE`. Individual source notices remain in the headers.
