const fs = require('fs');
const path = require('path');

/**
 * electron-builder afterPack hook
 * Prunes redundant locales and unused Chromium assets before packaging into NSIS installer.
 */
async function afterPack(context) {
  // 1. Windows / Linux locales directory: <appOutDir>/locales/
  const localesDir = path.join(context.appOutDir, 'locales');
  if (fs.existsSync(localesDir)) {
    const files = fs.readdirSync(localesDir);
    let removedCount = 0;
    for (const file of files) {
      // Keep en-US.pak and en-GB.pak; remove other 50+ languages
      if (!file.startsWith('en-')) {
        try {
          fs.unlinkSync(path.join(localesDir, file));
          removedCount++;
        } catch (err) {
          console.warn(`[afterPack] Could not remove locale ${file}:`, err.message);
        }
      }
    }
    console.log(`[afterPack] Pruned ${removedCount} unused locale .pak files from ${localesDir}`);
  }

  // 2. macOS Resources directory: <appOutDir>/<AppName>.app/Contents/Resources/
  const macAppDir = path.join(
    context.appOutDir,
    `${context.packager?.appInfo?.productFilename || 'Mriter'}.app`,
    'Contents',
    'Resources'
  );
  if (fs.existsSync(macAppDir)) {
    const files = fs.readdirSync(macAppDir);
    let removedMacCount = 0;
    for (const file of files) {
      if (file.endsWith('.lproj') && !file.startsWith('en')) {
        try {
          fs.rmSync(path.join(macAppDir, file), { recursive: true, force: true });
          removedMacCount++;
        } catch (err) {
          console.warn(`[afterPack] Could not remove macOS locale ${file}:`, err.message);
        }
      }
    }
    if (removedMacCount > 0) {
      console.log(`[afterPack] Pruned ${removedMacCount} unused .lproj folders from ${macAppDir}`);
    }
  }
}

module.exports = afterPack;
module.exports.default = afterPack;
