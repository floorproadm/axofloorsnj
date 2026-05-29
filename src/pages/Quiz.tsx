import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import SEOHead from "@/components/shared/SEOHead";
import QuizFlow from "@/components/quiz/QuizFlow";

const Quiz = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Get Your Floor Estimate in 60 Seconds — AXO Floors NJ"
        description="Answer 7 quick questions and get a real budget range for your hardwood project. No call required to start. NJ licensed & insured installers."
      />
      <Header />

      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <QuizFlow />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Quiz;
