import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          This route has gone off the map
        </h1>
        <p className="mt-2 text-muted-foreground">
          We couldn't find a page at {location.pathname}.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
        >
          Back to Operations Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
