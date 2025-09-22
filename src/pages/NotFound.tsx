import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Header />
      <main className="flex min-h-screen items-center justify-center bg-background pt-20">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-navy">404</h1>
          <p className="mb-4 text-xl text-grey">Oops! Page not found</p>
          <a href="/" className="text-gold underline hover:text-gold/80 transition-smooth">
            Return to Home
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default NotFound;
