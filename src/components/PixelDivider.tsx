export function PixelDivider({ accent = false }: { accent?: boolean }) {
  const color = accent ? "#FF6B00" : "#222222";
  // Dithered pixel pattern — alternating pixels for a retro look
  return (
    <div
      className="w-full h-[2px] pixel-render"
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 2px, transparent 2px, transparent 4px)`,
        imageRendering: "pixelated",
      }}
    />
  );
}

export function DitheredDivider() {
  // Full dithered pattern — checkerboard pixel grid
  return (
    <div
      className="w-full h-[8px] pixel-render opacity-30"
      style={{
        backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVQIW2M4w8DwHwMDAwMAGLID/TBjGbgAAAAASUVORK5CYII=")`,
        backgroundSize: "2px 2px",
        imageRendering: "pixelated",
      }}
    />
  );
}
