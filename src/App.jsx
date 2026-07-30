function App() {
  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-xl font-bold text-slate-800">Ambit</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="text-2xl font-semibold text-slate-800">
          Willkommen bei Ambit
        </h2>
        <p className="text-slate-500 max-w-sm">
          Deine mobile Web-App ist startklar. Hier entsteht bald etwas
          Grossartiges.
        </p>
        <button className="mt-2 rounded-full bg-blue-600 px-6 py-3 font-medium text-white shadow active:bg-blue-700">
          Los geht's
        </button>
      </main>

      <footer className="px-4 py-3 text-center text-sm text-slate-400">
        Ambit · Version 0.1
      </footer>
    </div>
  )
}

export default App
