import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { routes } from "./config/routes";
import useSetTheme from "./hooks/useSetTheme";

function App() {
  useSetTheme();

  return (
    <>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
        <Routes>
          {routes.map(({ path, element, children }) => (
            <Route key={path} path={path} element={element}>
              {children?.map((child) =>
                child.path === "" ? (
                  <Route key="index" index element={child.element} />
                ) : (
                  <Route key={child.path} path={child.path} element={child.element} />
                )
              )}
            </Route>
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
