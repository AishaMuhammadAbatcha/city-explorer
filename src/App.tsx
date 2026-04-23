import Router from "./routers/Router";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import EnvDebug from "@/components/EnvDebug";

function App() {
  return (
    <ErrorBoundary>
      <Router />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
          },
        }}
      />
      <EnvDebug />
    </ErrorBoundary>
  );
}

export default App;