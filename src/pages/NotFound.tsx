import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Provide helpful guidance for common route mistakes
  const getHelpfulMessage = (pathname: string) => {
    if (pathname === '/login') {
      return {
        title: "Looking for Admin Login?",
        message: "The admin login page has moved. Click the button below to access it.",
        action: (
          <Link
            to="/dash/login"
            className="bg-choptym-orange text-white px-6 py-3 rounded-lg hover:bg-choptym-orange/90 transition-colors inline-block"
          >
            Go to Admin Login
          </Link>
        )
      };
    }
    return null;
  };

  const helpfulContent = getHelpfulMessage(location.pathname);

  return (
    <div className="min-h-screen flex items-center justify-center bg-choptym-beige">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-6xl font-bold text-choptym-brown mb-4">404</h1>

        {helpfulContent ? (
          <>
            <h2 className="text-2xl font-semibold text-choptym-brown mb-4">
              {helpfulContent.title}
            </h2>
            <p className="text-lg text-choptym-brown/70 mb-6">
              {helpfulContent.message}
            </p>
            {helpfulContent.action}
          </>
        ) : (
          <>
            <p className="text-xl text-choptym-brown/70 mb-6">Oops! Page not found</p>
            <Link
              to="/"
              className="bg-choptym-orange text-white px-6 py-3 rounded-lg hover:bg-choptym-orange/90 transition-colors inline-block"
            >
              Return to Home
            </Link>
          </>
        )}

        <p className="text-sm text-choptym-brown/50 mt-6">
          Path: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
