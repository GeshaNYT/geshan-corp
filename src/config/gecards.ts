// Единственное место со ссылками на файлы GeCards. При обновлении правится только он.
const BASE = "https://github.com/GeshaNYT/gecards/releases/latest/download";

export const GECARDS_LINKS = {
  windows: `${BASE}/GeCards-Setup.exe`,
  macArm: `${BASE}/GeCards-arm64.dmg`,
  macIntel: `${BASE}/GeCards-x64.dmg`,
  linuxAppImage: `${BASE}/GeCards.AppImage`,
  deb: `${BASE}/GeCards-amd64.deb`,
  releases: "https://github.com/GeshaNYT/gecards/releases/latest",
};

export const GECARDS_PLATFORMS: { label: string; key: keyof typeof GECARDS_LINKS }[] = [
  { label: "Windows", key: "windows" },
  { label: "Mac (Apple Silicon)", key: "macArm" },
  { label: "Mac (Intel)", key: "macIntel" },
  { label: "Linux AppImage", key: "linuxAppImage" },
  { label: "Ubuntu / Debian .deb", key: "deb" },
];
