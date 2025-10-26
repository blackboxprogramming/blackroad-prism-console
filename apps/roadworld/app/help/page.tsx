export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10 text-white">
      <h1 className="text-3xl font-semibold">RoadWorld Help & Shortcuts</h1>
      <section>
        <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-white/70">
          <li><strong>W/E/R</strong> – Translate, Rotate, and Scale gizmos</li>
          <li><strong>Ctrl/Cmd + Z</strong> – Undo</li>
          <li><strong>Ctrl/Cmd + Shift + Z</strong> – Redo</li>
          <li><strong>F</strong> – Frame current selection</li>
          <li><strong>1/2/3</strong> – Camera presets</li>
          <li><strong>Shift + Click</strong> – Multi-select</li>
          <li><strong>Del</strong> – Delete selection</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Snapping</h2>
        <p className="mt-2 text-sm text-white/70">
          Snapping is configured per-axis in the inspector. You can toggle snapping globally and adjust
          increments for translation, rotation, and scale to fit your workflow.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Import & Export</h2>
        <p className="mt-2 text-sm text-white/70">
          Export the current world as JSON at any time from the top bar. Importing a JSON file validates
          against the world schema to ensure data integrity. glTF files can be imported directly into the
          scene through the viewport drag-and-drop interface.
        </p>
      </section>
    </div>
  );
}
