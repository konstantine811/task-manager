import { useLocation } from "react-router";

const useRoutingPath = (relation: "parent" | "nested") => {
  const location = useLocation();
  if (relation === "parent") {
    return location.pathname.split("/").slice(0, 2).join("/");
  } else if (relation === "nested") {
    return location.pathname.split("/").slice(2).join("/");
  }
};

export default useRoutingPath;
