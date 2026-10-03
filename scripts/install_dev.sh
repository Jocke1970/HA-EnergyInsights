#!/bin/sh
set -eu

REPO="Jocke1970/HA-EnergyInsights"
BRANCH="dev"
CONFIG_DIR="${CONFIG_DIR:-/config}"
TARGET="${CONFIG_DIR}/custom_components/energy_insights"
BACKUP="${CONFIG_DIR}/.energy_insights_previous"
TMP_DIR="$(mktemp -d)"
ARCHIVE="${TMP_DIR}/energy-insights.tar.gz"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT INT TERM

echo "Energy Insights dev installer"
echo "Repository: ${REPO}"
echo "Branch:     ${BRANCH}"
echo "Target:     ${TARGET}"
echo

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required." >&2
  exit 1
fi

echo "Downloading dev branch..."
curl -fsSL   "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz"   -o "${ARCHIVE}"

echo "Extracting..."
tar -xzf "${ARCHIVE}" -C "${TMP_DIR}"

SOURCE="${TMP_DIR}/HA-EnergyInsights-${BRANCH}/custom_components/energy_insights"

if [ ! -f "${SOURCE}/manifest.json" ]; then
  echo "ERROR: Downloaded archive does not contain Energy Insights." >&2
  exit 1
fi

mkdir -p "${CONFIG_DIR}/custom_components"

# Keep at most one rollback copy. No accumulating timestamped backups.
rm -rf "${BACKUP}"
if [ -d "${TARGET}" ]; then
  echo "Saving current installation as ${BACKUP} ..."
  mv "${TARGET}" "${BACKUP}"
fi

echo "Installing..."
cp -R "${SOURCE}" "${TARGET}"

echo
echo "Installed Energy Insights from dev."
echo "Next:"
echo "  1. Restart Home Assistant."
echo "  2. Settings -> Devices & services -> Add integration."
echo "  3. Search for: Energy Insights"
echo
echo "Rollback copy, when applicable: ${BACKUP}"
