// Единственное место со ссылками на файлы GeCards. При обновлении правится только он.
const RELEASES = "https://github.com/GeshaNYT/gecards/releases";

export const GECARDS_LINKS = {
  windows: RELEASES,
  macArm: RELEASES,
  macIntel: RELEASES,
  linuxAppImage: RELEASES,
  deb: RELEASES,
  releases: RELEASES,
};

export const GECARDS_PLATFORMS: { label: string; key: keyof typeof GECARDS_LINKS }[] = [
  { label: "Windows", key: "windows" },
  { label: "Mac (Apple Silicon)", key: "macArm" },
  { label: "Mac (Intel)", key: "macIntel" },
  { label: "Linux AppImage", key: "linuxAppImage" },
  { label: "Ubuntu / Debian .deb", key: "deb" },
];
