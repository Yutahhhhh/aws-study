interface SimulationLayoutProps {
  modeSelector: React.ReactNode;
  diagram: React.ReactNode;
  controller: React.ReactNode;
  inspector: React.ReactNode;
  explanation: React.ReactNode;
  leftColumns?: number;
  rightColumns?: number;
}

export const SimulationLayout = ({
  modeSelector,
  diagram,
  controller,
  inspector,
  explanation,
  leftColumns = 7,
  rightColumns = 5,
}: SimulationLayoutProps) => {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-3 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      {/* Left: Diagram Area */}
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl p-3 lg:p-4 flex flex-col justify-between shadow-2xl relative"
        style={{ gridColumn: `span ${leftColumns}` }}
      >
        {modeSelector}
        {diagram}
        {controller}
      </div>

      {/* Right: Inspector & Explanation */}
      <div
        className="hidden lg:flex flex-col space-y-6"
        style={{ gridColumn: `span ${rightColumns}` }}
      >
        {inspector}
        {explanation}
      </div>
    </main>
  );
};
