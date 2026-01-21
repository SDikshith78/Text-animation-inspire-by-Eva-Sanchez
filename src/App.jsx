import LiquidText from "./components/LiquidText";

export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f7f5f0]">
      
      {/* Eva Sánchez grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              to right,
              rgba(0,0,0,0.08) 0px,
              rgba(0,0,0,0.08) 1px,
              transparent 1px,
              transparent 80px
            ),
            repeating-linear-gradient(
              to bottom,
              rgba(0,0,0,0.06) 0px,
              rgba(0,0,0,0.06) 1px,
              transparent 1px,
              transparent 48px
            )
          `,
          opacity: 0.5
        }}
      />

      {/* WebGL text layer */}
      <LiquidText />

    </div>
  );
}
