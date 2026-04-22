import { Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { routes } from "./config/routes";
import useSetTheme from "./hooks/useSetTheme";
import { PushNotificationsBootstrap } from "./services/notifications/push";
import { PageLoader } from "./components/ui/page-loader";

function App() {
  useSetTheme();

  return (
    <>
      <PushNotificationsBootstrap />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {routes.map(({ path, element, children }) => (
            <Route key={path} path={path} element={element}>
              {children?.map((child) =>
                child.path === "" ? (
                  <Route key="index" index element={child.element} />
                ) : (
                  <Route
                    key={child.path}
                    path={child.path}
                    element={child.element}
                  />
                ),
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
